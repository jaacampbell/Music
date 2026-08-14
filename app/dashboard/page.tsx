"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  downloadPrivateFile,
  getCurrentUser,
  isCloudConfigured,
  signOut,
  supabaseRest,
  uploadPrivateFile
} from "@/lib/persistence/supabase-rest";
import type {
  CloudUser,
  ComparisonRow,
  MusicAssetKind,
  MusicAssetRow,
  MusicProjectRow,
  MusicReleaseRow,
  MusicTaskRow,
  MusicVersionRow,
  ProjectHistoryRow,
  WaveformCommentRow
} from "@/lib/persistence/types";
import styles from "./dashboard.module.css";

type DashboardTab = "overview" | "versions" | "files" | "compare" | "release" | "ask";

type Choice = "a" | "b" | "tie";

const RELEASE_CHECKLIST: Array<[string, string]> = [
  ["splits", "Songwriter splits"],
  ["producer_agreements", "Producer agreements"],
  ["master_ownership", "Master ownership"],
  ["publishing", "Publishing ownership"],
  ["samples", "Sample clearance / no samples"],
  ["artwork", "Final artwork"],
  ["lyrics", "Final lyrics"],
  ["clean_version", "Clean version decision"],
  ["isrc", "ISRC"],
  ["upc", "UPC"],
  ["distribution", "Distributor delivery"]
];

const initialReleaseChecklist = Object.fromEntries(RELEASE_CHECKLIST.map(([key]) => [key, false])) as Record<string, boolean>;

function formatBytes(value: number | null): string {
  if (!value) return "—";
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

async function getAudioDuration(file: File): Promise<number | null> {
  if (!file.type.startsWith("audio/")) return null;
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : null;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    audio.src = url;
  });
}

async function waveformFromBlob(blob: Blob, points = 96): Promise<number[]> {
  try {
    const context = new AudioContext();
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const channel = decoded.getChannelData(0);
    const block = Math.max(1, Math.floor(channel.length / points));
    const peaks = Array.from({ length: points }, (_, index) => {
      let peak = 0;
      const start = index * block;
      const end = Math.min(channel.length, start + block);
      for (let cursor = start; cursor < end; cursor += 1) peak = Math.max(peak, Math.abs(channel[cursor]));
      return Math.max(0.08, Math.min(1, peak));
    });
    await context.close();
    return peaks;
  } catch {
    return Array.from({ length: points }, (_, index) => 0.16 + ((index * 17) % 70) / 100);
  }
}

function projectNextStep(project: MusicProjectRow, versions: MusicVersionRow[], tasks: MusicTaskRow[], release: MusicReleaseRow | null): string {
  if (versions.length === 0) return "Upload the current demo or mix as Version 1 so the project has a playable source.";
  if (tasks.some((task) => task.status !== "done" && task.priority === "high")) return "Finish the high-priority production task before creating another version.";
  if (project.readiness < 50) return "Compare the current versions, leave timestamped notes, and turn the best ideas into the next revision.";
  const complete = release ? Object.values(release.checklist ?? {}).filter(Boolean).length : 0;
  if (!release || complete < 6) return "Start the Release Center checklist while the mix is being finalized.";
  if (project.readiness < 85) return "Finish mix/master decisions and clear the remaining release checklist items.";
  return "Create a final checkpoint, verify metadata, and prepare distributor delivery.";
}

export default function SongDashboardPage(): React.JSX.Element {
  const [user, setUser] = useState<CloudUser | null>(null);
  const [projects, setProjects] = useState<MusicProjectRow[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [draftProject, setDraftProject] = useState<MusicProjectRow | null>(null);
  const [versions, setVersions] = useState<MusicVersionRow[]>([]);
  const [assets, setAssets] = useState<MusicAssetRow[]>([]);
  const [tasks, setTasks] = useState<MusicTaskRow[]>([]);
  const [comments, setComments] = useState<WaveformCommentRow[]>([]);
  const [release, setRelease] = useState<MusicReleaseRow | null>(null);
  const [history, setHistory] = useState<ProjectHistoryRow[]>([]);
  const [comparisons, setComparisons] = useState<ComparisonRow[]>([]);
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Connecting to your private library…");
  const [newTitle, setNewTitle] = useState("");
  const [newBrief, setNewBrief] = useState("");
  const [newTask, setNewTask] = useState("");
  const [assetKind, setAssetKind] = useState<MusicAssetKind>("stem");
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [playerLabel, setPlayerLabel] = useState("");
  const [playerVersionId, setPlayerVersionId] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [noteInput, setNoteInput] = useState("");
  const [versionAId, setVersionAId] = useState("");
  const [versionBId, setVersionBId] = useState("");
  const [compareChoices, setCompareChoices] = useState<Record<string, Choice>>({ drums: "a", atmosphere: "b", vocal: "a", lowEnd: "a" });
  const [compareNotes, setCompareNotes] = useState("");
  const [askInput, setAskInput] = useState("");
  const [askAnswer, setAskAnswer] = useState("Ask about the current song, next steps, versions, mix decisions, stems, or release readiness.");
  const [releaseDraft, setReleaseDraft] = useState({ artist_name: "", release_date: "", isrc: "", upc: "", distributor: "", master_ownership: "", publishing_ownership: "", ai_note: "", explicit: false });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerUrlRef = useRef<string | null>(null);
  const artworkUrlRef = useRef<string | null>(null);

  const activeProject = useMemo(() => projects.find((project) => project.id === activeProjectId) ?? null, [projects, activeProjectId]);
  const versionA = versions.find((version) => version.id === versionAId) ?? null;
  const versionB = versions.find((version) => version.id === versionBId) ?? null;
  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const releaseCompleted = release ? RELEASE_CHECKLIST.filter(([key]) => Boolean(release.checklist?.[key])).length : 0;

  async function run<T>(work: () => Promise<T>, success?: string): Promise<T | null> {
    setBusy(true);
    try {
      const result = await work();
      if (success) setStatus(success);
      return result;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function loadProjects(preferredId?: string): Promise<void> {
    const rows = await supabaseRest<MusicProjectRow[]>("music_projects", { query: "select=*&order=updated_at.desc" });
    setProjects(rows);
    const next = preferredId ?? activeProjectId ?? rows[0]?.id ?? null;
    setActiveProjectId(next && rows.some((row) => row.id === next) ? next : rows[0]?.id ?? null);
  }

  async function loadProjectData(projectId: string): Promise<void> {
    const [versionRows, assetRows, taskRows, commentRows, releaseRows, historyRows, comparisonRows] = await Promise.all([
      supabaseRest<MusicVersionRow[]>("music_versions", { query: `select=*&project_id=eq.${projectId}&order=version_number.desc` }),
      supabaseRest<MusicAssetRow[]>("music_assets", { query: `select=*&project_id=eq.${projectId}&order=created_at.desc` }),
      supabaseRest<MusicTaskRow[]>("music_tasks", { query: `select=*&project_id=eq.${projectId}&order=created_at.desc` }),
      supabaseRest<WaveformCommentRow[]>("music_waveform_comments", { query: `select=*&project_id=eq.${projectId}&order=timestamp_ms.asc` }),
      supabaseRest<MusicReleaseRow[]>("music_releases", { query: `select=*&project_id=eq.${projectId}&limit=1` }),
      supabaseRest<ProjectHistoryRow[]>("music_project_history", { query: `select=*&project_id=eq.${projectId}&order=created_at.desc&limit=8` }),
      supabaseRest<ComparisonRow[]>("music_comparisons", { query: `select=*&project_id=eq.${projectId}&order=created_at.desc&limit=12` })
    ]);
    setVersions(versionRows);
    setAssets(assetRows);
    setTasks(taskRows);
    setComments(commentRows);
    setRelease(releaseRows[0] ?? null);
    setHistory(historyRows);
    setComparisons(comparisonRows);
    if (versionRows.length > 0) {
      setVersionAId((current) => current && versionRows.some((row) => row.id === current) ? current : versionRows[0].id);
      setVersionBId((current) => current && versionRows.some((row) => row.id === current) ? current : versionRows[1]?.id ?? versionRows[0].id);
    } else {
      setVersionAId("");
      setVersionBId("");
    }
  }

  useEffect(() => {
    if (!isCloudConfigured()) {
      setStatus("Cloud persistence is not configured. Add the Supabase environment variables first.");
      return;
    }
    void getCurrentUser().then(async (currentUser) => {
      if (!currentUser) {
        window.location.replace("/login");
        return;
      }
      setUser(currentUser);
      await loadProjects();
      setStatus("Private library connected.");
    }).catch(() => window.location.replace("/login"));
  }, []);

  useEffect(() => {
    if (!activeProject) {
      setDraftProject(null);
      setVersions([]);
      setAssets([]);
      setTasks([]);
      setComments([]);
      setRelease(null);
      setHistory([]);
      return;
    }
    setDraftProject(activeProject);
    void loadProjectData(activeProject.id).catch((error) => setStatus(error instanceof Error ? error.message : "Could not load project details."));
    void supabaseRest<MusicProjectRow[]>("music_projects", { method: "PATCH", query: `id=eq.${activeProject.id}`, body: { last_opened_at: new Date().toISOString() } }).catch(() => undefined);
  }, [activeProject?.id]);

  useEffect(() => {
    if (!release) {
      setReleaseDraft({ artist_name: "", release_date: "", isrc: "", upc: "", distributor: "", master_ownership: "", publishing_ownership: "", ai_note: "", explicit: false });
      return;
    }
    const firstAi = Array.isArray(release.ai_provenance) && release.ai_provenance.length > 0 ? release.ai_provenance[0] : null;
    setReleaseDraft({
      artist_name: release.artist_name ?? "",
      release_date: release.release_date ?? "",
      isrc: release.isrc ?? "",
      upc: release.upc ?? "",
      distributor: release.distributor ?? "",
      master_ownership: release.master_ownership ?? "",
      publishing_ownership: release.publishing_ownership ?? "",
      ai_note: typeof firstAi === "object" && firstAi && "note" in firstAi ? String((firstAi as { note?: unknown }).note ?? "") : "",
      explicit: release.explicit
    });
  }, [release?.id]);

  useEffect(() => {
    if (!draftProject || !activeProject || draftProject.id !== activeProject.id) return;
    const changed = draftProject.title !== activeProject.title || draftProject.brief !== activeProject.brief || draftProject.bpm !== activeProject.bpm || draftProject.song_key !== activeProject.song_key || draftProject.status !== activeProject.status || draftProject.readiness !== activeProject.readiness;
    if (!changed) return;
    const timeout = window.setTimeout(() => {
      void run(async () => {
        const rows = await supabaseRest<MusicProjectRow[]>("music_projects", {
          method: "PATCH",
          query: `id=eq.${draftProject.id}`,
          body: { title: draftProject.title, brief: draftProject.brief, bpm: draftProject.bpm, song_key: draftProject.song_key, status: draftProject.status, readiness: draftProject.readiness }
        });
        if (rows[0]) setProjects((current) => current.map((row) => row.id === rows[0].id ? rows[0] : row));
      }, "Autosaved to your private library.");
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [draftProject?.title, draftProject?.brief, draftProject?.bpm, draftProject?.song_key, draftProject?.status, draftProject?.readiness]);

  useEffect(() => {
    if (!activeProject?.artwork_path) {
      if (artworkUrlRef.current) URL.revokeObjectURL(artworkUrlRef.current);
      artworkUrlRef.current = null;
      setArtworkUrl(null);
      return;
    }
    void downloadPrivateFile(activeProject.artwork_path).then((blob) => {
      if (artworkUrlRef.current) URL.revokeObjectURL(artworkUrlRef.current);
      const url = URL.createObjectURL(blob);
      artworkUrlRef.current = url;
      setArtworkUrl(url);
    }).catch(() => setArtworkUrl(null));
  }, [activeProject?.artwork_path]);

  useEffect(() => () => {
    if (playerUrlRef.current) URL.revokeObjectURL(playerUrlRef.current);
    if (artworkUrlRef.current) URL.revokeObjectURL(artworkUrlRef.current);
  }, []);

  async function createProject(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!user || !newTitle.trim()) return;
    await run(async () => {
      const rows = await supabaseRest<MusicProjectRow[]>("music_projects", {
        method: "POST",
        body: { user_id: user.id, title: newTitle.trim(), brief: newBrief.trim(), readiness: 10 }
      });
      const created = rows[0];
      if (!created) throw new Error("Project could not be created.");
      setNewTitle("");
      setNewBrief("");
      await loadProjects(created.id);
      setTab("overview");
    }, "Song project created and saved to the cloud.");
  }

  async function loadAudio(path: string | null, label: string, versionId: string | null): Promise<void> {
    if (!path) { setStatus("This version does not have an uploaded audio file yet."); return; }
    await run(async () => {
      const blob = await downloadPrivateFile(path);
      const peaks = await waveformFromBlob(blob);
      if (playerUrlRef.current) URL.revokeObjectURL(playerUrlRef.current);
      const url = URL.createObjectURL(blob);
      playerUrlRef.current = url;
      setPlayerUrl(url);
      setPlayerLabel(label);
      setPlayerVersionId(versionId);
      setWaveform(peaks);
      setCurrentTime(0);
      window.setTimeout(() => void audioRef.current?.play().catch(() => undefined), 60);
    }, `Loaded ${label} into the private player.`);
  }

  async function uploadVersion(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file || !activeProject || !user) return;
    event.target.value = "";
    await run(async () => {
      const durationSec = await getAudioDuration(file);
      const path = await uploadPrivateFile(activeProject.id, file, "versions");
      const nextNumber = versions.reduce((max, version) => Math.max(max, version.version_number), 0) + 1;
      await supabaseRest<MusicVersionRow[]>("music_versions", {
        method: "POST",
        body: { user_id: user.id, project_id: activeProject.id, version_number: nextNumber, label: `Version ${nextNumber}`, storage_path: path, original_name: file.name, mime_type: file.type || null, byte_size: file.size, duration_sec: durationSec }
      });
      await supabaseRest<MusicProjectRow[]>("music_projects", { method: "PATCH", query: `id=eq.${activeProject.id}`, body: { status: "in-progress", readiness: Math.max(activeProject.readiness, 25) } });
      await Promise.all([loadProjects(activeProject.id), loadProjectData(activeProject.id)]);
    }, `${file.name} uploaded as a new private version.`);
  }

  async function uploadArtwork(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file || !activeProject || !user) return;
    event.target.value = "";
    await run(async () => {
      const path = await uploadPrivateFile(activeProject.id, file, "artwork");
      await supabaseRest<MusicAssetRow[]>("music_assets", { method: "POST", body: { user_id: user.id, project_id: activeProject.id, kind: "artwork", label: "Project artwork", storage_path: path, original_name: file.name, mime_type: file.type || null, byte_size: file.size } });
      await supabaseRest<MusicProjectRow[]>("music_projects", { method: "PATCH", query: `id=eq.${activeProject.id}`, body: { artwork_path: path } });
      await loadProjects(activeProject.id);
      await loadProjectData(activeProject.id);
    }, "Artwork uploaded to private storage.");
  }

  async function uploadAsset(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file || !activeProject || !user) return;
    event.target.value = "";
    await run(async () => {
      const durationSec = await getAudioDuration(file);
      const path = await uploadPrivateFile(activeProject.id, file, assetKind);
      await supabaseRest<MusicAssetRow[]>("music_assets", { method: "POST", body: { user_id: user.id, project_id: activeProject.id, kind: assetKind, label: file.name, storage_path: path, original_name: file.name, mime_type: file.type || null, byte_size: file.size, duration_sec: durationSec } });
      await loadProjectData(activeProject.id);
    }, `${file.name} saved in the project library.`);
  }

  async function addTask(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!activeProject || !user || !newTask.trim()) return;
    await run(async () => {
      await supabaseRest<MusicTaskRow[]>("music_tasks", { method: "POST", body: { project_id: activeProject.id, user_id: user.id, title: newTask.trim(), priority: "normal" } });
      setNewTask("");
      await loadProjectData(activeProject.id);
    }, "Task added.");
  }

  async function toggleTask(task: MusicTaskRow): Promise<void> {
    if (!activeProject) return;
    await run(async () => {
      await supabaseRest<MusicTaskRow[]>("music_tasks", { method: "PATCH", query: `id=eq.${task.id}`, body: { status: task.status === "done" ? "todo" : "done" } });
      await loadProjectData(activeProject.id);
    });
  }

  async function addTimestampNote(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!activeProject || !user || !noteInput.trim()) return;
    await run(async () => {
      await supabaseRest<WaveformCommentRow[]>("music_waveform_comments", { method: "POST", body: { project_id: activeProject.id, version_id: playerVersionId, user_id: user.id, timestamp_ms: Math.round(currentTime * 1000), body: noteInput.trim(), kind: "mix-note" } });
      setNoteInput("");
      await loadProjectData(activeProject.id);
    }, `Note saved at ${formatTime(currentTime)}.`);
  }

  async function saveComparison(): Promise<void> {
    if (!activeProject || !user || !versionA || !versionB || versionA.id === versionB.id) { setStatus("Choose two different versions first."); return; }
    await run(async () => {
      await supabaseRest<ComparisonRow[]>("music_comparisons", {
        method: "POST",
        body: {
          project_id: activeProject.id,
          user_id: user.id,
          version_a_id: versionA.id,
          version_b_id: versionB.id,
          drums_choice: compareChoices.drums,
          atmosphere_choice: compareChoices.atmosphere,
          vocal_space_choice: compareChoices.vocal,
          low_end_choice: compareChoices.lowEnd,
          notes: compareNotes.trim()
        }
      });
      await loadProjectData(activeProject.id);
    }, "A/B comparison saved to the project history.");
  }

  function blendDirection(): string {
    if (!versionA || !versionB) return "Choose two versions to build a blended revision direction.";
    const label = (choice: Choice, category: string) => choice === "tie" ? `keep the strongest ${category} elements from both` : `use ${choice === "a" ? versionA.label : versionB.label} for ${category}`;
    return `Next revision: ${label(compareChoices.drums, "drums")}; ${label(compareChoices.atmosphere, "atmosphere")}; ${label(compareChoices.vocal, "vocal space")}; ${label(compareChoices.lowEnd, "low end")}. ${compareNotes.trim()}`.trim();
  }

  async function saveCheckpoint(): Promise<void> {
    if (!activeProject || !user) return;
    await run(async () => {
      await supabaseRest<ProjectHistoryRow[]>("music_project_history", {
        method: "POST",
        body: { project_id: activeProject.id, user_id: user.id, label: `Checkpoint · ${new Date().toLocaleString()}`, snapshot: { project: activeProject, versions, tasks, release, comparisons: comparisons.slice(0, 5) } }
      });
      await loadProjectData(activeProject.id);
    }, "Project checkpoint saved.");
  }

  async function saveRelease(): Promise<void> {
    if (!activeProject || !user) return;
    const body = {
      project_id: activeProject.id,
      user_id: user.id,
      release_title: activeProject.title,
      artist_name: releaseDraft.artist_name || null,
      release_date: releaseDraft.release_date || null,
      explicit: releaseDraft.explicit,
      isrc: releaseDraft.isrc || null,
      upc: releaseDraft.upc || null,
      distributor: releaseDraft.distributor || null,
      master_ownership: releaseDraft.master_ownership || null,
      publishing_ownership: releaseDraft.publishing_ownership || null,
      ai_provenance: releaseDraft.ai_note.trim() ? [{ note: releaseDraft.ai_note.trim() }] : [],
      checklist: release?.checklist ?? initialReleaseChecklist,
      artwork_path: activeProject.artwork_path
    };
    await run(async () => {
      if (release) await supabaseRest<MusicReleaseRow[]>("music_releases", { method: "PATCH", query: `id=eq.${release.id}`, body });
      else await supabaseRest<MusicReleaseRow[]>("music_releases", { method: "POST", body });
      await loadProjectData(activeProject.id);
    }, "Release record saved.");
  }

  async function toggleReleaseItem(key: string): Promise<void> {
    if (!activeProject || !user) return;
    const checklist = { ...(release?.checklist ?? initialReleaseChecklist), [key]: !(release?.checklist?.[key] ?? false) };
    await run(async () => {
      if (release) await supabaseRest<MusicReleaseRow[]>("music_releases", { method: "PATCH", query: `id=eq.${release.id}`, body: { checklist } });
      else await supabaseRest<MusicReleaseRow[]>("music_releases", { method: "POST", body: { project_id: activeProject.id, user_id: user.id, release_title: activeProject.title, checklist } });
      await loadProjectData(activeProject.id);
    });
  }

  function askMusic(event: FormEvent): void {
    event.preventDefault();
    if (!activeProject) return;
    const q = askInput.toLowerCase();
    let answer = "I can use this project's stored metadata, versions, tasks, notes, and release status. Ask me what to do next, how to compare versions, how to organize stems, or what is missing before release.";
    if (q.includes("next") || q.includes("what should")) answer = projectNextStep(activeProject, versions, tasks, release);
    else if (q.includes("muddy")) answer = "For a muddy mix, first timestamp where it happens. Check whether kick/808 overlap, low-mid instruments stack around the vocal, or reverb is filling the center. Music OS does not yet run spectral diagnosis on this uploaded file, so treat this as a targeted listening checklist rather than a measured finding.";
    else if (q.includes("ad-lib") || q.includes("adlib")) answer = "Open Stem Studio → Deep targets and isolate ad-libs/background vocals. Save the result back into this project's Files area as a stem so it stays with the song.";
    else if (q.includes("room for") || q.includes("vocal space") || q.includes("which version")) answer = versions.length < 2 ? "Upload at least two versions first. Then use A/B Compare and focus on how much midrange and arrangement activity sits under the vocal." : `You have ${versions.length} versions available. Load two in A/B Compare, mark the Vocal Space winner, then save the comparison. I do not yet have measured vocal-space analytics for uploaded audio, so I will not pretend one wins without that analysis.`;
    else if (q.includes("release")) answer = `Release Center is ${releaseCompleted}/${RELEASE_CHECKLIST.length} checklist items complete. ${releaseCompleted < RELEASE_CHECKLIST.length ? "Finish ownership, agreements, metadata, identifiers, artwork, and distributor delivery before marking the project release-ready." : "The checklist is complete; save a final checkpoint and verify the distributor package."}`;
    else if (q.includes("stem")) answer = "Use Stem Studio for actual separation. Core stems are best for normal vocals/drums/bass/instruments workflows; Deep targets are better for specific parts such as ad-libs, kick, snare, keys, strings, or effects. Upload important outputs back to this project's private Files library.";
    setAskAnswer(answer);
  }

  async function leave(): Promise<void> {
    await signOut();
    window.location.assign("/login");
  }

  if (!isCloudConfigured()) {
    return <main className={styles.setup}><h1>Connect Music OS to Supabase</h1><p>Run <code>db/music-os-phase2.sql</code> and add the two public Supabase environment variables from <code>.env.example</code>. The dashboard is built, but it will not fake persistence when the database is not connected.</p><Link href="/">Back to Music OS</Link></main>;
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}><span>M</span><div><strong>Music OS</strong><small>Persistent Song Dashboard</small></div></div>
        <div className={styles.topActions}><Link href="/">Studio</Link><Link href="/stem-studio">Stem Studio</Link><span className={styles.userEmail}>{user?.email ?? "Private account"}</span><button onClick={() => void leave()}>Sign out</button></div>
      </header>

      <section className={styles.libraryBar}>
        <div><span className={styles.kicker}>My music</span><select value={activeProjectId ?? ""} onChange={(event) => setActiveProjectId(event.target.value || null)}><option value="">New song…</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></div>
        {activeProject && <div className={styles.readiness}><span>Readiness</span><div><i style={{ width: `${activeProject.readiness}%` }} /></div><strong>{activeProject.readiness}%</strong></div>}
      </section>

      {!activeProject ? (
        <section className={styles.createProject}>
          <div><span className={styles.kicker}>Create a private song project</span><h1>Start the record once. Keep everything with it.</h1><p>Versions, stems, artwork, agreements, release metadata, notes, comparisons, and tasks stay attached to this project.</p></div>
          <form onSubmit={(event) => void createProject(event)}><label>Song title<input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Untitled song" required /></label><label>Creative brief<textarea value={newBrief} onChange={(event) => setNewBrief(event.target.value)} placeholder="Describe the sound, mood, tempo, references, vocal approach, and what you want to protect." /></label><button disabled={busy}>Create cloud project</button></form>
        </section>
      ) : (
        <>
          <section className={styles.songHero}>
            <div className={styles.artwork}>{artworkUrl ? <img src={artworkUrl} alt={`${activeProject.title} artwork`} /> : <div className={styles.artworkPlaceholder}>♪</div>}<label className={styles.uploadMini}>Artwork<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadArtwork(event)} /></label></div>
            <div className={styles.songIdentity}>
              <span className={styles.kicker}>Current song</span>
              <input className={styles.titleInput} value={draftProject?.title ?? ""} onChange={(event) => draftProject && setDraftProject({ ...draftProject, title: event.target.value })} />
              <textarea value={draftProject?.brief ?? ""} onChange={(event) => draftProject && setDraftProject({ ...draftProject, brief: event.target.value })} />
              <div className={styles.heroMeta}>
                <label>BPM<input type="number" min="1" max="400" value={draftProject?.bpm ?? ""} onChange={(event) => draftProject && setDraftProject({ ...draftProject, bpm: event.target.value ? Number(event.target.value) : null })} /></label>
                <label>Key<input value={draftProject?.song_key ?? ""} onChange={(event) => draftProject && setDraftProject({ ...draftProject, song_key: event.target.value || null })} placeholder="e.g. D minor" /></label>
                <label>Status<select value={draftProject?.status ?? "draft"} onChange={(event) => draftProject && setDraftProject({ ...draftProject, status: event.target.value as MusicProjectRow["status"] })}><option value="draft">Draft</option><option value="in-progress">In production</option><option value="mixing">Mixing</option><option value="ready-for-release">Ready for release</option><option value="released">Released</option><option value="archived">Archived</option></select></label>
                <label>Readiness<input type="range" min="0" max="100" value={draftProject?.readiness ?? 0} onChange={(event) => draftProject && setDraftProject({ ...draftProject, readiness: Number(event.target.value) })} /><span>{draftProject?.readiness ?? 0}%</span></label>
              </div>
              <div className={styles.autosave}>● Autosave on · {status}</div>
            </div>
          </section>

          <nav className={styles.tabs} aria-label="Song dashboard sections">
            {(["overview", "versions", "files", "compare", "release", "ask"] as DashboardTab[]).map((item) => <button key={item} className={tab === item ? styles.activeTab : ""} onClick={() => setTab(item)}>{item === "ask" ? "Ask Music" : item[0].toUpperCase() + item.slice(1)}</button>)}
          </nav>

          {tab === "overview" && <section className={styles.dashboardGrid}>
            <article className={`${styles.card} ${styles.nextCard}`}><span className={styles.kicker}>Continue where you left off</span><h2>{projectNextStep(activeProject, versions, tasks, release)}</h2><div className={styles.actionRow}><button onClick={() => setTab(versions.length === 0 ? "versions" : activeProject.readiness >= 50 ? "release" : "compare")}>Continue →</button><button className={styles.secondary} onClick={() => void saveCheckpoint()}>Save checkpoint</button></div></article>
            <article className={styles.card}><span className={styles.kicker}>Project snapshot</span><div className={styles.stats}><div><strong>{versions.length}</strong><span>Versions</span></div><div><strong>{assets.length}</strong><span>Files</span></div><div><strong>{openTasks}</strong><span>Open tasks</span></div><div><strong>{releaseCompleted}/{RELEASE_CHECKLIST.length}</strong><span>Release</span></div></div></article>
            <article className={styles.card}><div className={styles.cardHead}><div><span className={styles.kicker}>Tasks</span><h2>What needs attention</h2></div></div><form className={styles.inlineForm} onSubmit={(event) => void addTask(event)}><input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add a task…" /><button>Add</button></form><div className={styles.taskList}>{tasks.length === 0 ? <p className={styles.muted}>No tasks yet.</p> : tasks.slice(0, 8).map((task) => <button key={task.id} className={task.status === "done" ? styles.taskDone : styles.task} onClick={() => void toggleTask(task)}><span>{task.status === "done" ? "✓" : "○"}</span>{task.title}</button>)}</div></article>
            <article className={styles.card}><span className={styles.kicker}>History</span><h2>Saved checkpoints</h2>{history.length === 0 ? <p className={styles.muted}>Save a checkpoint before a major revision, mix, or release handoff.</p> : <div className={styles.historyList}>{history.map((item) => <div key={item.id}><strong>{item.label}</strong><span>{new Date(item.created_at).toLocaleString()}</span></div>)}</div>}</article>
          </section>}

          {tab === "versions" && <section className={styles.sectionCard}>
            <div className={styles.sectionHead}><div><span className={styles.kicker}>Song versions</span><h2>Every meaningful bounce stays with the project.</h2><p>Upload demos, revisions, mixes, and masters as separate versions instead of overwriting files.</p></div><label className={styles.uploadButton}>＋ Upload new version<input type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff" onChange={(event) => void uploadVersion(event)} /></label></div>
            <div className={styles.versionList}>{versions.length === 0 ? <div className={styles.empty}><h3>No audio versions yet.</h3><p>Upload the current demo or mix as Version 1.</p></div> : versions.map((version) => <article key={version.id} className={styles.versionCard}><div><span className={styles.versionNumber}>V{version.version_number}</span><h3>{version.label}</h3><p>{version.original_name ?? "No source file"}</p></div><div className={styles.versionMeta}><span>{version.duration_sec ? formatTime(version.duration_sec) : "—"}</span><span>{formatBytes(version.byte_size)}</span><span>{new Date(version.created_at).toLocaleDateString()}</span></div><button onClick={() => void loadAudio(version.storage_path, version.label, version.id)}>Play</button></article>)}</div>
          </section>}

          {tab === "files" && <section className={styles.sectionCard}>
            <div className={styles.sectionHead}><div><span className={styles.kicker}>Private project files</span><h2>Stems, masters, artwork, agreements, lyrics, and references.</h2></div><div className={styles.uploadGroup}><select value={assetKind} onChange={(event) => setAssetKind(event.target.value as MusicAssetKind)}><option value="stem">Stem</option><option value="master">Master</option><option value="mix">Mix</option><option value="reference">Reference</option><option value="agreement">Agreement</option><option value="lyrics">Lyrics</option><option value="other">Other</option></select><label className={styles.uploadButton}>Upload file<input type="file" onChange={(event) => void uploadAsset(event)} /></label></div></div>
            <div className={styles.fileGrid}>{assets.length === 0 ? <div className={styles.empty}><h3>No project files yet.</h3></div> : assets.map((asset) => <article key={asset.id} className={styles.fileCard}><span className={styles.fileKind}>{asset.kind}</span><h3>{asset.label}</h3><p>{formatBytes(asset.byte_size)} · {asset.mime_type ?? "file"}</p>{asset.mime_type?.startsWith("audio/") && <button onClick={() => void loadAudio(asset.storage_path, asset.label, null)}>Play</button>}<button className={styles.secondary} onClick={() => void run(async () => { const blob = await downloadPrivateFile(asset.storage_path); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = asset.original_name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 5000); }, "Private file downloaded.")}>Download</button></article>)}</div>
          </section>}

          {tab === "compare" && <section className={styles.compareLayout}>
            <div className={styles.sectionCard}><span className={styles.kicker}>Audio-first comparison</span><h2>A/B two versions, then keep the best parts.</h2><div className={styles.abGrid}><div><label>Version A<select value={versionAId} onChange={(event) => setVersionAId(event.target.value)}>{versions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>)}</select></label>{versionA && <button onClick={() => void loadAudio(versionA.storage_path, `A · ${versionA.label}`, versionA.id)}>Play A</button>}</div><div><label>Version B<select value={versionBId} onChange={(event) => setVersionBId(event.target.value)}>{versions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>)}</select></label>{versionB && <button onClick={() => void loadAudio(versionB.storage_path, `B · ${versionB.label}`, versionB.id)}>Play B</button>}</div></div><div className={styles.choiceGrid}>{[["drums","Drums"],["atmosphere","Atmosphere"],["vocal","Vocal space"],["lowEnd","Low end"]].map(([key,label]) => <label key={key}>{label}<select value={compareChoices[key]} onChange={(event) => setCompareChoices({ ...compareChoices, [key]: event.target.value as Choice })}><option value="a">Version A</option><option value="b">Version B</option><option value="tie">Use both / tie</option></select></label>)}</div><label className={styles.fullLabel}>Comparison notes<textarea value={compareNotes} onChange={(event) => setCompareNotes(event.target.value)} placeholder="What specifically makes one version better?" /></label><div className={styles.blendDirection}><strong>Revision direction</strong><p>{blendDirection()}</p></div><button onClick={() => void saveComparison()}>Save A/B decision</button></div>
            <div className={styles.sectionCard}><span className={styles.kicker}>Saved decisions</span><h2>Comparison history</h2>{comparisons.length === 0 ? <p className={styles.muted}>No A/B decisions saved yet.</p> : comparisons.map((comparison) => <div className={styles.savedComparison} key={comparison.id}><strong>{new Date(comparison.created_at).toLocaleString()}</strong><p>Drums: {comparison.drums_choice?.toUpperCase()} · Atmosphere: {comparison.atmosphere_choice?.toUpperCase()} · Vocal space: {comparison.vocal_space_choice?.toUpperCase()} · Low end: {comparison.low_end_choice?.toUpperCase()}</p>{comparison.notes && <span>{comparison.notes}</span>}</div>)}</div>
          </section>}

          {tab === "release" && <section className={styles.releaseLayout}>
            <div className={styles.sectionCard}><span className={styles.kicker}>Release Center</span><h2>Ownership, metadata, identifiers, delivery.</h2><div className={styles.releaseForm}><label>Artist name<input value={releaseDraft.artist_name} onChange={(event) => setReleaseDraft({ ...releaseDraft, artist_name: event.target.value })} /></label><label>Release date<input type="date" value={releaseDraft.release_date} onChange={(event) => setReleaseDraft({ ...releaseDraft, release_date: event.target.value })} /></label><label>ISRC<input value={releaseDraft.isrc} onChange={(event) => setReleaseDraft({ ...releaseDraft, isrc: event.target.value })} /></label><label>UPC<input value={releaseDraft.upc} onChange={(event) => setReleaseDraft({ ...releaseDraft, upc: event.target.value })} /></label><label>Distributor<input value={releaseDraft.distributor} onChange={(event) => setReleaseDraft({ ...releaseDraft, distributor: event.target.value })} /></label><label>Master ownership<input value={releaseDraft.master_ownership} onChange={(event) => setReleaseDraft({ ...releaseDraft, master_ownership: event.target.value })} placeholder="Who owns the master?" /></label><label>Publishing ownership<input value={releaseDraft.publishing_ownership} onChange={(event) => setReleaseDraft({ ...releaseDraft, publishing_ownership: event.target.value })} placeholder="Who owns publishing?" /></label><label className={styles.fullLabel}>AI / provenance notes<textarea value={releaseDraft.ai_note} onChange={(event) => setReleaseDraft({ ...releaseDraft, ai_note: event.target.value })} placeholder="Document AI-assisted elements, source files, recreations, licenses, samples, or other provenance notes." /></label><label className={styles.checkbox}><input type="checkbox" checked={releaseDraft.explicit} onChange={(event) => setReleaseDraft({ ...releaseDraft, explicit: event.target.checked })} /> Explicit release</label></div><button onClick={() => void saveRelease()}>Save release record</button></div>
            <div className={styles.sectionCard}><span className={styles.kicker}>Release checklist</span><h2>{releaseCompleted}/{RELEASE_CHECKLIST.length} complete</h2><div className={styles.checklist}>{RELEASE_CHECKLIST.map(([key,label]) => <button key={key} className={release?.checklist?.[key] ? styles.checked : ""} onClick={() => void toggleReleaseItem(key)}><span>{release?.checklist?.[key] ? "✓" : "○"}</span>{label}</button>)}</div></div>
          </section>}

          {tab === "ask" && <section className={styles.askLayout}><div className={styles.sectionCard}><span className={styles.kicker}>Ask Music</span><h2>Project-aware help, tied to this song.</h2><p className={styles.muted}>This first Phase 2 assistant uses the project data already stored in Music OS. It does not invent audio measurements that have not been run.</p><form className={styles.askForm} onSubmit={askMusic}><textarea value={askInput} onChange={(event) => setAskInput(event.target.value)} placeholder="What should I do next? Why does my mix sound muddy? Which version leaves more room for vocals?" /><button>Ask about this project</button></form><div className={styles.answer}><strong>Music OS</strong><p>{askAnswer}</p></div></div><div className={styles.sectionCard}><span className={styles.kicker}>Try asking</span><div className={styles.promptList}>{["What should I do next?","Why does this mix sound muddy?","Separate my ad-libs.","Which version leaves more room for my voice?","What is missing before release?"].map((prompt) => <button key={prompt} onClick={() => setAskInput(prompt)}>{prompt}</button>)}</div></div></section>}
        </>
      )}

      {playerUrl && <section className={styles.playerBar}>
        <div className={styles.playerInfo}><span>Now playing</span><strong>{playerLabel}</strong></div>
        <audio ref={audioRef} src={playerUrl} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={() => setCurrentTime(0)} controls />
        <div className={styles.waveform} onClick={(event) => { if (!audioRef.current || !duration) return; const rect = event.currentTarget.getBoundingClientRect(); const next = ((event.clientX - rect.left) / rect.width) * duration; audioRef.current.currentTime = next; setCurrentTime(next); }} role="slider" aria-label="Audio playback timeline" aria-valuemin={0} aria-valuemax={duration || 0} aria-valuenow={currentTime} tabIndex={0}>{waveform.map((peak,index) => <i key={index} style={{ height: `${Math.max(8, peak * 42)}px`, opacity: duration && index / waveform.length <= currentTime / duration ? 1 : .35 }} />)}</div>
        <div className={styles.timecode}>{formatTime(currentTime)} / {formatTime(duration)}</div>
        <form className={styles.noteForm} onSubmit={(event) => void addTimestampNote(event)}><input value={noteInput} onChange={(event) => setNoteInput(event.target.value)} placeholder={`Add note at ${formatTime(currentTime)}`} /><button>Save note</button></form>
        <div className={styles.commentStrip}>{comments.filter((comment) => !playerVersionId || comment.version_id === playerVersionId).slice(0, 6).map((comment) => <button key={comment.id} onClick={() => { if (audioRef.current) audioRef.current.currentTime = comment.timestamp_ms / 1000; }}><strong>{formatTime(comment.timestamp_ms / 1000)}</strong><span>{comment.body}</span></button>)}</div>
      </section>}
    </main>
  );
}
