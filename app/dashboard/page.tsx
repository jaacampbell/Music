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
  AgentMessageRow,
  CloudUser,
  ComparisonRow,
  MusicAssetKind,
  MusicAssetRow,
  MusicProjectRow,
  MusicReleaseRow,
  MusicTaskRow,
  MusicVersionRow,
  ProducerAgreement,
  ProjectHistoryRow,
  SongwriterSplit,
  WaveformCommentRow
} from "@/lib/persistence/types";
import styles from "./dashboard.module.css";

type DashboardTab = "overview" | "versions" | "files" | "compare" | "release" | "ask";
type Choice = "a" | "b" | "tie";
type Side = "a" | "b";

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

const emptyChecklist = Object.fromEntries(RELEASE_CHECKLIST.map(([key]) => [key, false])) as Record<string, boolean>;

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

async function audioDuration(file: File): Promise<number | null> {
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
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
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
      return Math.max(0.04, Math.min(1, peak));
    });
    await context.close();
    return peaks;
  } catch {
    return [];
  }
}

function projectNextStep(project: MusicProjectRow, versions: MusicVersionRow[], tasks: MusicTaskRow[], release: MusicReleaseRow | null): string {
  if (versions.length === 0) return "Upload the current demo or mix as Version 1 so the song has a playable source.";
  if (tasks.some((task) => task.status !== "done" && task.priority === "high")) return "Finish the high-priority production task before creating another version.";
  if (project.readiness < 50) return "Compare the current versions, leave timestamped notes, and turn the best choices into the next revision.";
  const complete = release ? Object.values(release.checklist ?? {}).filter(Boolean).length : 0;
  if (!release || complete < 6) return "Work through the Release Center while the mix is being finalized.";
  if (project.readiness < 85) return "Finish mix/master decisions and clear the remaining release items.";
  return "Save a final checkpoint, verify metadata and agreements, then prepare distributor delivery.";
}

const newSplit = (): SongwriterSplit => ({ id: crypto.randomUUID(), name: "", role: "Songwriter", pro: "", ipi: "", percentage: 0 });
const newAgreement = (): ProducerAgreement => ({ id: crypto.randomUUID(), producer: "", agreementType: "ownership", fee: "", points: "", publishing: "", status: "draft", notes: "" });

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
  const [agentMessages, setAgentMessages] = useState<AgentMessageRow[]>([]);
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
  const [abUrls, setAbUrls] = useState<Record<Side, string | null>>({ a: null, b: null });
  const [abPeaks, setAbPeaks] = useState<Record<Side, number[]>>({ a: [], b: [] });
  const [abActive, setAbActive] = useState<Side>("a");
  const [abTime, setAbTime] = useState(0);
  const [abDuration, setAbDuration] = useState(0);
  const [askInput, setAskInput] = useState("");
  const [askAnswer, setAskAnswer] = useState("Ask about this song, next steps, versions, mix decisions, stems, rights, or release readiness.");
  const [releaseDraft, setReleaseDraft] = useState({ artist_name: "", release_date: "", isrc: "", upc: "", distributor: "", master_ownership: "", publishing_ownership: "", ai_note: "", explicit: false, splits: [] as SongwriterSplit[], producer_agreements: [] as ProducerAgreement[] });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abARef = useRef<HTMLAudioElement | null>(null);
  const abBRef = useRef<HTMLAudioElement | null>(null);
  const playerUrlRef = useRef<string | null>(null);
  const artworkUrlRef = useRef<string | null>(null);
  const abUrlRef = useRef<Record<Side, string | null>>({ a: null, b: null });

  const activeProject = useMemo(() => projects.find((project) => project.id === activeProjectId) ?? null, [projects, activeProjectId]);
  const versionA = versions.find((version) => version.id === versionAId) ?? null;
  const versionB = versions.find((version) => version.id === versionBId) ?? null;
  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const releaseCompleted = release ? RELEASE_CHECKLIST.filter(([key]) => Boolean(release.checklist?.[key])).length : 0;
  const splitTotal = releaseDraft.splits.reduce((sum, split) => sum + (Number(split.percentage) || 0), 0);
  const projectQuery = activeProject ? `?projectId=${encodeURIComponent(activeProject.id)}` : "";

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

  async function loadProjects(preferredId?: string | null): Promise<void> {
    const rows = await supabaseRest<MusicProjectRow[]>("music_projects", { query: "select=*&order=updated_at.desc" });
    setProjects(rows);
    const requested = preferredId ?? new URLSearchParams(window.location.search).get("projectId");
    const next = requested ?? activeProjectId ?? rows[0]?.id ?? null;
    setActiveProjectId(next && rows.some((row) => row.id === next) ? next : rows[0]?.id ?? null);
  }

  async function loadProjectData(projectId: string): Promise<void> {
    const [versionRows, assetRows, taskRows, commentRows, releaseRows, historyRows, comparisonRows, messageRows] = await Promise.all([
      supabaseRest<MusicVersionRow[]>("music_versions", { query: `select=*&project_id=eq.${projectId}&order=version_number.desc` }),
      supabaseRest<MusicAssetRow[]>("music_assets", { query: `select=*&project_id=eq.${projectId}&order=created_at.desc` }),
      supabaseRest<MusicTaskRow[]>("music_tasks", { query: `select=*&project_id=eq.${projectId}&order=created_at.desc` }),
      supabaseRest<WaveformCommentRow[]>("music_waveform_comments", { query: `select=*&project_id=eq.${projectId}&order=timestamp_ms.asc` }),
      supabaseRest<MusicReleaseRow[]>("music_releases", { query: `select=*&project_id=eq.${projectId}&limit=1` }),
      supabaseRest<ProjectHistoryRow[]>("music_project_history", { query: `select=*&project_id=eq.${projectId}&order=created_at.desc&limit=8` }),
      supabaseRest<ComparisonRow[]>("music_comparisons", { query: `select=*&project_id=eq.${projectId}&order=created_at.desc&limit=12` }),
      supabaseRest<AgentMessageRow[]>("music_agent_messages", { query: `select=*&project_id=eq.${projectId}&order=created_at.asc&limit=40` }).catch(() => [])
    ]);
    setVersions(versionRows);
    setAssets(assetRows);
    setTasks(taskRows);
    setComments(commentRows);
    setRelease(releaseRows[0] ?? null);
    setHistory(historyRows);
    setComparisons(comparisonRows);
    setAgentMessages(messageRows);
    if (versionRows.length > 0) {
      setVersionAId((current) => current && versionRows.some((row) => row.id === current) ? current : versionRows[0].id);
      setVersionBId((current) => current && versionRows.some((row) => row.id === current) ? current : versionRows[1]?.id ?? versionRows[0].id);
    } else {
      setVersionAId("");
      setVersionBId("");
    }
  }

  useEffect(() => {
    if (!isCloudConfigured()) { setStatus("Cloud persistence is not configured. Add the Supabase environment variables first."); return; }
    void getCurrentUser().then(async (currentUser) => {
      if (!currentUser) { window.location.replace("/login"); return; }
      setUser(currentUser);
      await loadProjects();
      setStatus("Private library connected.");
    }).catch(() => window.location.replace("/login"));
  }, []);

  useEffect(() => {
    if (!activeProject) {
      setDraftProject(null); setVersions([]); setAssets([]); setTasks([]); setComments([]); setRelease(null); setHistory([]); setComparisons([]); setAgentMessages([]); return;
    }
    setDraftProject(activeProject);
    void loadProjectData(activeProject.id).catch((error) => setStatus(error instanceof Error ? error.message : "Could not load project details."));
    void supabaseRest<MusicProjectRow[]>("music_projects", { method: "PATCH", query: `id=eq.${activeProject.id}`, body: { last_opened_at: new Date().toISOString() } }).catch(() => undefined);
  }, [activeProject?.id]);

  useEffect(() => {
    if (!release) {
      setReleaseDraft({ artist_name: "", release_date: "", isrc: "", upc: "", distributor: "", master_ownership: "", publishing_ownership: "", ai_note: "", explicit: false, splits: [], producer_agreements: [] });
      return;
    }
    const firstAi = release.ai_provenance?.[0];
    setReleaseDraft({
      artist_name: release.artist_name ?? "", release_date: release.release_date ?? "", isrc: release.isrc ?? "", upc: release.upc ?? "", distributor: release.distributor ?? "",
      master_ownership: release.master_ownership ?? "", publishing_ownership: release.publishing_ownership ?? "", ai_note: firstAi?.note ? String(firstAi.note) : "", explicit: release.explicit,
      splits: Array.isArray(release.splits) ? release.splits : [], producer_agreements: Array.isArray(release.producer_agreements) ? release.producer_agreements : []
    });
  }, [release?.id, release?.updated_at]);

  useEffect(() => {
    if (!draftProject || !activeProject || draftProject.id !== activeProject.id) return;
    const changed = draftProject.title !== activeProject.title || draftProject.brief !== activeProject.brief || draftProject.bpm !== activeProject.bpm || draftProject.song_key !== activeProject.song_key || draftProject.status !== activeProject.status || draftProject.readiness !== activeProject.readiness;
    if (!changed) return;
    const timeout = window.setTimeout(() => {
      void run(async () => {
        const planning = activeProject.planning_state ? { ...activeProject.planning_state, title: draftProject.title, brief: draftProject.brief, updatedAt: new Date().toISOString(), songDna: { ...activeProject.planning_state.songDna, bpm: draftProject.bpm, key: draftProject.song_key }, manifest: { ...activeProject.planning_state.manifest, title: draftProject.title, bpm: draftProject.bpm, key: draftProject.song_key } } : null;
        const rows = await supabaseRest<MusicProjectRow[]>("music_projects", {
          method: "PATCH", query: `id=eq.${draftProject.id}`,
          body: { title: draftProject.title, brief: draftProject.brief, bpm: draftProject.bpm, song_key: draftProject.song_key, status: draftProject.status, readiness: draftProject.readiness, planning_state: planning, last_synced_at: new Date().toISOString() }
        });
        if (rows[0]) setProjects((current) => current.map((row) => row.id === rows[0].id ? rows[0] : row));
      }, "Autosaved to your private library.");
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [draftProject?.title, draftProject?.brief, draftProject?.bpm, draftProject?.song_key, draftProject?.status, draftProject?.readiness]);

  useEffect(() => {
    if (!activeProject?.artwork_path) { if (artworkUrlRef.current) URL.revokeObjectURL(artworkUrlRef.current); artworkUrlRef.current = null; setArtworkUrl(null); return; }
    void downloadPrivateFile(activeProject.artwork_path).then((blob) => {
      if (artworkUrlRef.current) URL.revokeObjectURL(artworkUrlRef.current);
      const url = URL.createObjectURL(blob); artworkUrlRef.current = url; setArtworkUrl(url);
    }).catch(() => setArtworkUrl(null));
  }, [activeProject?.artwork_path]);

  useEffect(() => () => {
    if (playerUrlRef.current) URL.revokeObjectURL(playerUrlRef.current);
    if (artworkUrlRef.current) URL.revokeObjectURL(artworkUrlRef.current);
    for (const url of Object.values(abUrlRef.current)) if (url) URL.revokeObjectURL(url);
  }, []);

  async function createProject(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!user || !newTitle.trim()) return;
    await run(async () => {
      const rows = await supabaseRest<MusicProjectRow[]>("music_projects", { method: "POST", body: { user_id: user.id, title: newTitle.trim(), brief: newBrief.trim(), readiness: 10 } });
      const created = rows[0]; if (!created) throw new Error("Project could not be created.");
      setNewTitle(""); setNewBrief(""); await loadProjects(created.id); setTab("overview");
    }, "Song project created. Guided, Studio, Dashboard, and Stem Studio will use this same project ID.");
  }

  async function loadAudio(path: string | null, label: string, versionId: string | null): Promise<void> {
    if (!path) { setStatus("This version does not have an uploaded audio file yet."); return; }
    await run(async () => {
      const blob = await downloadPrivateFile(path); const peaks = await waveformFromBlob(blob);
      if (playerUrlRef.current) URL.revokeObjectURL(playerUrlRef.current);
      const url = URL.createObjectURL(blob); playerUrlRef.current = url; setPlayerUrl(url); setPlayerLabel(label); setPlayerVersionId(versionId); setWaveform(peaks); setCurrentTime(0);
      window.setTimeout(() => void audioRef.current?.play().catch(() => undefined), 60);
    }, `Loaded ${label}.`);
  }

  async function uploadVersion(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]; if (!file || !activeProject || !user) return; event.target.value = "";
    await run(async () => {
      const durationSec = await audioDuration(file); const path = await uploadPrivateFile(activeProject.id, file, "versions");
      const nextNumber = versions.reduce((max, version) => Math.max(max, version.version_number), 0) + 1;
      await supabaseRest<MusicVersionRow[]>("music_versions", { method: "POST", body: { user_id: user.id, project_id: activeProject.id, version_number: nextNumber, label: `Version ${nextNumber}`, storage_path: path, original_name: file.name, mime_type: file.type || null, byte_size: file.size, duration_sec: durationSec } });
      await supabaseRest<MusicProjectRow[]>("music_projects", { method: "PATCH", query: `id=eq.${activeProject.id}`, body: { status: "in-progress", readiness: Math.max(activeProject.readiness, 25), source_audio_path: activeProject.source_audio_path ?? path } });
      await Promise.all([loadProjects(activeProject.id), loadProjectData(activeProject.id)]);
    }, `${file.name} uploaded as a persistent version.`);
  }

  async function uploadArtwork(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]; if (!file || !activeProject || !user) return; event.target.value = "";
    await run(async () => {
      const path = await uploadPrivateFile(activeProject.id, file, "artwork");
      await supabaseRest<MusicAssetRow[]>("music_assets", { method: "POST", body: { user_id: user.id, project_id: activeProject.id, kind: "artwork", label: "Project artwork", storage_path: path, original_name: file.name, mime_type: file.type || null, byte_size: file.size } });
      await supabaseRest<MusicProjectRow[]>("music_projects", { method: "PATCH", query: `id=eq.${activeProject.id}`, body: { artwork_path: path } });
      await Promise.all([loadProjects(activeProject.id), loadProjectData(activeProject.id)]);
    }, "Artwork uploaded.");
  }

  async function uploadAsset(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]; if (!file || !activeProject || !user) return; event.target.value = "";
    await run(async () => {
      const durationSec = await audioDuration(file); const path = await uploadPrivateFile(activeProject.id, file, assetKind);
      await supabaseRest<MusicAssetRow[]>("music_assets", { method: "POST", body: { user_id: user.id, project_id: activeProject.id, kind: assetKind, label: file.name, storage_path: path, original_name: file.name, mime_type: file.type || null, byte_size: file.size, duration_sec: durationSec } });
      await loadProjectData(activeProject.id);
    }, `${file.name} saved in the project library.`);
  }

  async function addTask(event: FormEvent): Promise<void> {
    event.preventDefault(); if (!activeProject || !user || !newTask.trim()) return;
    await run(async () => { await supabaseRest<MusicTaskRow[]>("music_tasks", { method: "POST", body: { project_id: activeProject.id, user_id: user.id, title: newTask.trim(), priority: "normal" } }); setNewTask(""); await loadProjectData(activeProject.id); }, "Task added.");
  }

  async function toggleTask(task: MusicTaskRow): Promise<void> {
    if (!activeProject) return;
    await run(async () => { await supabaseRest<MusicTaskRow[]>("music_tasks", { method: "PATCH", query: `id=eq.${task.id}`, body: { status: task.status === "done" ? "todo" : "done" } }); await loadProjectData(activeProject.id); });
  }

  async function addTimestampNote(event: FormEvent): Promise<void> {
    event.preventDefault(); if (!activeProject || !user || !noteInput.trim()) return;
    await run(async () => { await supabaseRest<WaveformCommentRow[]>("music_waveform_comments", { method: "POST", body: { project_id: activeProject.id, version_id: playerVersionId, user_id: user.id, timestamp_ms: Math.round(currentTime * 1000), body: noteInput.trim(), kind: "mix-note" } }); setNoteInput(""); await loadProjectData(activeProject.id); }, `Note saved at ${formatTime(currentTime)}.`);
  }

  async function loadAB(): Promise<void> {
    if (!versionA?.storage_path || !versionB?.storage_path || versionA.id === versionB.id) { setStatus("Choose two different audio versions first."); return; }
    await run(async () => {
      const [blobA, blobB] = await Promise.all([downloadPrivateFile(versionA.storage_path!), downloadPrivateFile(versionB.storage_path!)]);
      const [peaksA, peaksB] = await Promise.all([waveformFromBlob(blobA), waveformFromBlob(blobB)]);
      for (const url of Object.values(abUrlRef.current)) if (url) URL.revokeObjectURL(url);
      const a = URL.createObjectURL(blobA); const b = URL.createObjectURL(blobB); abUrlRef.current = { a, b }; setAbUrls({ a, b }); setAbPeaks({ a: peaksA, b: peaksB }); setAbTime(0); setAbDuration(0); setAbActive("a");
    }, `Loaded ${versionA.label} and ${versionB.label} into synchronized A/B.`);
  }

  function seekAB(next: number): void {
    const safe = Math.max(0, Math.min(abDuration || next, next)); setAbTime(safe);
    if (abARef.current) abARef.current.currentTime = safe;
    if (abBRef.current) abBRef.current.currentTime = safe;
  }

  async function switchAB(side: Side): Promise<void> {
    const current = abActive === "a" ? abARef.current : abBRef.current;
    const next = side === "a" ? abARef.current : abBRef.current;
    const wasPlaying = Boolean(current && !current.paused);
    const time = current?.currentTime ?? abTime;
    current?.pause(); if (next) next.currentTime = time; setAbActive(side); setAbTime(time);
    if (wasPlaying) await next?.play().catch(() => undefined);
  }

  async function toggleABPlay(): Promise<void> {
    const active = abActive === "a" ? abARef.current : abBRef.current; if (!active) return;
    if (active.paused) await active.play().catch(() => undefined); else active.pause();
  }

  async function saveComparison(): Promise<void> {
    if (!activeProject || !user || !versionA || !versionB || versionA.id === versionB.id) { setStatus("Choose two different versions first."); return; }
    await run(async () => {
      await supabaseRest<ComparisonRow[]>("music_comparisons", { method: "POST", body: { project_id: activeProject.id, user_id: user.id, version_a_id: versionA.id, version_b_id: versionB.id, drums_choice: compareChoices.drums, atmosphere_choice: compareChoices.atmosphere, vocal_space_choice: compareChoices.vocal, low_end_choice: compareChoices.lowEnd, notes: compareNotes.trim() } });
      await loadProjectData(activeProject.id);
    }, "A/B decision saved.");
  }

  function blendDirection(): string {
    if (!versionA || !versionB) return "Choose two versions to build a blended revision direction.";
    const label = (choice: Choice, category: string) => choice === "tie" ? `keep the strongest ${category} elements from both` : `use ${choice === "a" ? versionA.label : versionB.label} for ${category}`;
    return `Next revision: ${label(compareChoices.drums, "drums")}; ${label(compareChoices.atmosphere, "atmosphere")}; ${label(compareChoices.vocal, "vocal space")}; ${label(compareChoices.lowEnd, "low end")}. ${compareNotes.trim()}`.trim();
  }

  async function saveCheckpoint(): Promise<void> {
    if (!activeProject || !user) return;
    await run(async () => { await supabaseRest<ProjectHistoryRow[]>("music_project_history", { method: "POST", body: { project_id: activeProject.id, user_id: user.id, label: `Checkpoint · ${new Date().toLocaleString()}`, snapshot: { project: activeProject, versions, tasks, release, comparisons: comparisons.slice(0, 5) } } }); await loadProjectData(activeProject.id); }, "Project checkpoint saved.");
  }

  async function saveRelease(): Promise<void> {
    if (!activeProject || !user) return;
    const checklist = { ...(release?.checklist ?? emptyChecklist), splits: releaseDraft.splits.length > 0 && Math.abs(splitTotal - 100) < 0.01, producer_agreements: releaseDraft.producer_agreements.length === 0 || releaseDraft.producer_agreements.every((agreement) => agreement.status === "signed" || agreement.status === "not-needed") };
    const body = { project_id: activeProject.id, user_id: user.id, release_title: activeProject.title, artist_name: releaseDraft.artist_name || null, release_date: releaseDraft.release_date || null, explicit: releaseDraft.explicit, isrc: releaseDraft.isrc || null, upc: releaseDraft.upc || null, distributor: releaseDraft.distributor || null, master_ownership: releaseDraft.master_ownership || null, publishing_ownership: releaseDraft.publishing_ownership || null, ai_provenance: releaseDraft.ai_note.trim() ? [{ note: releaseDraft.ai_note.trim() }] : [], splits: releaseDraft.splits, producer_agreements: releaseDraft.producer_agreements, checklist, artwork_path: activeProject.artwork_path };
    await run(async () => { if (release) await supabaseRest<MusicReleaseRow[]>("music_releases", { method: "PATCH", query: `id=eq.${release.id}`, body }); else await supabaseRest<MusicReleaseRow[]>("music_releases", { method: "POST", body }); await loadProjectData(activeProject.id); }, "Release record, splits, and producer agreements saved.");
  }

  async function toggleReleaseItem(key: string): Promise<void> {
    if (!activeProject || !user) return;
    const checklist = { ...(release?.checklist ?? emptyChecklist), [key]: !(release?.checklist?.[key] ?? false) };
    await run(async () => { if (release) await supabaseRest<MusicReleaseRow[]>("music_releases", { method: "PATCH", query: `id=eq.${release.id}`, body: { checklist } }); else await supabaseRest<MusicReleaseRow[]>("music_releases", { method: "POST", body: { project_id: activeProject.id, user_id: user.id, release_title: activeProject.title, checklist } }); await loadProjectData(activeProject.id); });
  }

  async function askMusic(event: FormEvent): Promise<void> {
    event.preventDefault(); if (!activeProject || !user || !askInput.trim()) return;
    const question = askInput.trim(); setAskInput(""); setAskAnswer("Thinking with this project’s current context…");
    await run(async () => {
      await supabaseRest<AgentMessageRow[]>("music_agent_messages", { method: "POST", body: { project_id: activeProject.id, user_id: user.id, role: "user", body: question } }).catch(() => undefined);
      const response = await fetch("/api/music-assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, context: { project: activeProject, versions: versions.map(({ id, label, notes, bpm, song_key, duration_sec, created_at }) => ({ id, label, notes, bpm, song_key, duration_sec, created_at })), tasks, comments: comments.slice(-20), comparisons: comparisons.slice(0, 8), release } }) });
      const payload = (await response.json().catch(() => ({}))) as { answer?: string; model?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error ?? `Ask Music failed (${response.status}).`);
      setAskAnswer(payload.answer);
      await supabaseRest<AgentMessageRow[]>("music_agent_messages", { method: "POST", body: { project_id: activeProject.id, user_id: user.id, role: "assistant", body: payload.answer, model: payload.model ?? null } }).catch(() => undefined);
      await loadProjectData(activeProject.id);
    });
  }

  async function leave(): Promise<void> { await signOut(); window.location.assign("/login"); }

  if (!isCloudConfigured()) return <main className={styles.setup}><h1>Connect Music OS to Supabase</h1><p>Run <code>db/music-os-phase2.sql</code> and <code>db/music-os-phase3.sql</code>, then add the Supabase variables from <code>.env.example</code>.</p><Link href="/">Back to Music OS</Link></main>;

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}><span>M</span><div><strong>Music OS</strong><small>One song · one persistent project</small></div></div>
        <div className={styles.topActions}>
          <Link href={`/${projectQuery}`}>Guided / Studio</Link>
          <Link href={`/stem-studio${projectQuery}`}>Stem Studio</Link>
          <span className={styles.userEmail}>{user?.email ?? "Private account"}</span><button onClick={() => void leave()}>Sign out</button>
        </div>
      </header>

      <section className={styles.libraryBar}>
        <div><span className={styles.kicker}>My music</span><select value={activeProjectId ?? ""} onChange={(event) => { const id = event.target.value || null; setActiveProjectId(id); if (id) window.history.replaceState(null, "", `/dashboard?projectId=${encodeURIComponent(id)}`); }}><option value="">New song…</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></div>
        {activeProject && <div className={styles.readiness}><span>Readiness</span><div><i style={{ width: `${activeProject.readiness}%` }} /></div><strong>{activeProject.readiness}%</strong></div>}
      </section>

      {!activeProject ? (
        <section className={styles.createProject}><div><span className={styles.kicker}>Create a private song project</span><h1>Start once. Keep the whole record together.</h1><p>Guided Mode, Studio, stems, versions, agreements, release metadata, and notes all use the same project UUID.</p></div><form onSubmit={(event) => void createProject(event)}><label>Song title<input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Untitled song" required /></label><label>Creative brief<textarea value={newBrief} onChange={(event) => setNewBrief(event.target.value)} placeholder="Describe the sound, mood, tempo, references, vocal approach, and goal." /></label><button disabled={busy}>Create project</button></form></section>
      ) : (
        <>
          <section className={styles.songHero}>
            <div className={styles.artwork}>{artworkUrl ? <img src={artworkUrl} alt={`${activeProject.title} artwork`} /> : <div className={styles.artworkPlaceholder}>♪</div>}<label className={styles.uploadMini}>Artwork<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadArtwork(event)} /></label></div>
            <div className={styles.songIdentity}><span className={styles.kicker}>Current song</span><input className={styles.titleInput} value={draftProject?.title ?? ""} onChange={(event) => draftProject && setDraftProject({ ...draftProject, title: event.target.value })} /><textarea value={draftProject?.brief ?? ""} onChange={(event) => draftProject && setDraftProject({ ...draftProject, brief: event.target.value })} /><div className={styles.heroMeta}><label>BPM<input type="number" min="1" max="400" value={draftProject?.bpm ?? ""} onChange={(event) => draftProject && setDraftProject({ ...draftProject, bpm: event.target.value ? Number(event.target.value) : null })} /></label><label>Key<input value={draftProject?.song_key ?? ""} onChange={(event) => draftProject && setDraftProject({ ...draftProject, song_key: event.target.value || null })} placeholder="e.g. D minor" /></label><label>Status<select value={draftProject?.status ?? "draft"} onChange={(event) => draftProject && setDraftProject({ ...draftProject, status: event.target.value as MusicProjectRow["status"] })}><option value="draft">Draft</option><option value="in-progress">In production</option><option value="mixing">Mixing</option><option value="ready-for-release">Ready for release</option><option value="released">Released</option><option value="archived">Archived</option></select></label><label>Readiness<input type="range" min="0" max="100" value={draftProject?.readiness ?? 0} onChange={(event) => draftProject && setDraftProject({ ...draftProject, readiness: Number(event.target.value) })} /><span>{draftProject?.readiness ?? 0}%</span></label></div><div className={styles.autosave}>● Cloud autosave · {status}</div></div>
          </section>

          <nav className={styles.tabs} aria-label="Song dashboard sections">{(["overview", "versions", "files", "compare", "release", "ask"] as DashboardTab[]).map((item) => <button key={item} className={tab === item ? styles.activeTab : ""} onClick={() => setTab(item)}>{item === "ask" ? "Ask Music" : item[0].toUpperCase() + item.slice(1)}</button>)}</nav>

          {tab === "overview" && <section className={styles.dashboardGrid}>
            <article className={`${styles.card} ${styles.nextCard}`}><span className={styles.kicker}>Continue where you left off</span><h2>{projectNextStep(activeProject, versions, tasks, release)}</h2><div className={styles.actionRow}><button onClick={() => setTab(versions.length === 0 ? "versions" : activeProject.readiness >= 50 ? "release" : "compare")}>Continue →</button><Link className={styles.secondary} href={`/${projectQuery}`}>Open production workspace</Link><Link className={styles.secondary} href={`/stem-studio${projectQuery}`}>Open Stem Studio</Link></div></article>
            <article className={styles.card}><span className={styles.kicker}>Project snapshot</span><div className={styles.stats}><div><strong>{versions.length}</strong><span>Versions</span></div><div><strong>{assets.length}</strong><span>Files</span></div><div><strong>{openTasks}</strong><span>Open tasks</span></div><div><strong>{releaseCompleted}/{RELEASE_CHECKLIST.length}</strong><span>Release</span></div></div></article>
            <article className={styles.card}><span className={styles.kicker}>Tasks</span><h2>What needs attention</h2><form className={styles.inlineForm} onSubmit={(event) => void addTask(event)}><input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add a task…" /><button>Add</button></form><div className={styles.taskList}>{tasks.length === 0 ? <p className={styles.muted}>No tasks yet.</p> : tasks.slice(0, 8).map((task) => <button key={task.id} className={task.status === "done" ? styles.taskDone : styles.task} onClick={() => void toggleTask(task)}><span>{task.status === "done" ? "✓" : "○"}</span>{task.title}</button>)}</div></article>
            <article className={styles.card}><span className={styles.kicker}>History</span><h2>Saved checkpoints</h2><button className={styles.secondary} onClick={() => void saveCheckpoint()}>Save checkpoint</button>{history.length === 0 ? <p className={styles.muted}>Save a checkpoint before a major revision, mix, or release handoff.</p> : <div className={styles.historyList}>{history.map((item) => <div key={item.id}><strong>{item.label}</strong><span>{new Date(item.created_at).toLocaleString()}</span></div>)}</div>}</article>
          </section>}

          {tab === "versions" && <section className={styles.sectionCard}><div className={styles.sectionHead}><div><span className={styles.kicker}>Song versions</span><h2>Never overwrite a meaningful bounce.</h2><p>Each demo, revision, mix, or master is a separate private version.</p></div><label className={styles.uploadButton}>＋ Upload new version<input type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff" onChange={(event) => void uploadVersion(event)} /></label></div><div className={styles.versionList}>{versions.length === 0 ? <div className={styles.empty}><h3>No audio versions yet.</h3><p>Upload the current demo or mix as Version 1.</p></div> : versions.map((version) => <article key={version.id} className={styles.versionCard}><div><span className={styles.versionNumber}>V{version.version_number}</span><h3>{version.label}</h3><p>{version.original_name ?? "No source file"}</p></div><div className={styles.versionMeta}><span>{version.duration_sec ? formatTime(version.duration_sec) : "—"}</span><span>{formatBytes(version.byte_size)}</span><span>{new Date(version.created_at).toLocaleDateString()}</span></div><button onClick={() => void loadAudio(version.storage_path, version.label, version.id)}>Play</button></article>)}</div></section>}

          {tab === "files" && <section className={styles.sectionCard}><div className={styles.sectionHead}><div><span className={styles.kicker}>Private project files</span><h2>Stems, masters, artwork, agreements, lyrics, and references.</h2></div><div className={styles.uploadGroup}><select value={assetKind} onChange={(event) => setAssetKind(event.target.value as MusicAssetKind)}><option value="stem">Stem</option><option value="master">Master</option><option value="mix">Mix</option><option value="reference">Reference</option><option value="agreement">Agreement</option><option value="lyrics">Lyrics</option><option value="other">Other</option></select><label className={styles.uploadButton}>Upload file<input type="file" onChange={(event) => void uploadAsset(event)} /></label></div></div><div className={styles.fileGrid}>{assets.length === 0 ? <div className={styles.empty}><h3>No project files yet.</h3></div> : assets.map((asset) => <article key={asset.id} className={styles.fileCard}><span className={styles.fileKind}>{asset.kind}</span><h3>{asset.label}</h3><p>{formatBytes(asset.byte_size)} · {asset.mime_type ?? "file"}</p>{asset.mime_type?.startsWith("audio/") && <button onClick={() => void loadAudio(asset.storage_path, asset.label, null)}>Play</button>}<button className={styles.secondary} onClick={() => void run(async () => { const blob = await downloadPrivateFile(asset.storage_path); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = asset.original_name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 5000); }, "Private file downloaded.")}>Download</button></article>)}</div></section>}

          {tab === "compare" && <section className={styles.compareLayout}>
            <div className={styles.sectionCard}><span className={styles.kicker}>Synchronized A/B</span><h2>Switch versions without losing your place.</h2><div className={styles.abGrid}><label>Version A<select value={versionAId} onChange={(event) => setVersionAId(event.target.value)}>{versions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>)}</select></label><label>Version B<select value={versionBId} onChange={(event) => setVersionBId(event.target.value)}>{versions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>)}</select></label></div><button onClick={() => void loadAB()}>Load synchronized A/B</button>{abUrls.a && abUrls.b && <div style={{ display: "grid", gap: 10, marginTop: 18 }}><audio ref={abARef} src={abUrls.a} onLoadedMetadata={(event) => setAbDuration((current) => Math.max(current, event.currentTarget.duration || 0))} onTimeUpdate={(event) => { if (abActive === "a") setAbTime(event.currentTarget.currentTime); }} /><audio ref={abBRef} src={abUrls.b} onLoadedMetadata={(event) => setAbDuration((current) => Math.max(current, event.currentTarget.duration || 0))} onTimeUpdate={(event) => { if (abActive === "b") setAbTime(event.currentTarget.currentTime); }} /><div className={styles.actionRow}><button onClick={() => void switchAB("a")} aria-pressed={abActive === "a"}>A · {versionA?.label}</button><button onClick={() => void switchAB("b")} aria-pressed={abActive === "b"}>B · {versionB?.label}</button><button className={styles.secondary} onClick={() => void toggleABPlay()}>Play / pause</button><strong>{formatTime(abTime)} / {formatTime(abDuration)}</strong></div>{(["a", "b"] as Side[]).map((side) => <div key={side} onClick={(event) => { if (!abDuration) return; const rect = event.currentTarget.getBoundingClientRect(); seekAB(((event.clientX - rect.left) / rect.width) * abDuration); }} style={{ display: "flex", gap: 2, alignItems: "center", minHeight: 48, padding: 8, borderRadius: 10, cursor: "pointer", border: abActive === side ? "1px solid rgba(255,255,255,.55)" : "1px solid rgba(255,255,255,.12)" }}><strong style={{ width: 18, flex: "0 0 auto" }}>{side.toUpperCase()}</strong><div style={{ display: "flex", gap: 1, alignItems: "center", flex: 1, height: 42 }}>{abPeaks[side].length ? abPeaks[side].map((peak, index) => <i key={index} style={{ display: "block", flex: 1, height: `${Math.max(3, peak * 38)}px`, background: "currentColor", opacity: abDuration && index / abPeaks[side].length <= abTime / abDuration ? .95 : .25 }} />) : <span className={styles.muted}>Waveform could not be decoded; audio is still available.</span>}</div></div>)}</div>}<div className={styles.choiceGrid}>{[["drums","Drums"],["atmosphere","Atmosphere"],["vocal","Vocal space"],["lowEnd","Low end"]].map(([key,label]) => <label key={key}>{label}<select value={compareChoices[key]} onChange={(event) => setCompareChoices({ ...compareChoices, [key]: event.target.value as Choice })}><option value="a">Version A</option><option value="b">Version B</option><option value="tie">Use both / tie</option></select></label>)}</div><label className={styles.fullLabel}>Comparison notes<textarea value={compareNotes} onChange={(event) => setCompareNotes(event.target.value)} placeholder="What specifically makes one version better?" /></label><div className={styles.blendDirection}><strong>Revision direction</strong><p>{blendDirection()}</p></div><button onClick={() => void saveComparison()}>Save A/B decision</button></div>
            <div className={styles.sectionCard}><span className={styles.kicker}>Saved decisions</span><h2>Comparison history</h2>{comparisons.length === 0 ? <p className={styles.muted}>No A/B decisions saved yet.</p> : comparisons.map((comparison) => <div className={styles.savedComparison} key={comparison.id}><strong>{new Date(comparison.created_at).toLocaleString()}</strong><p>Drums: {comparison.drums_choice?.toUpperCase()} · Atmosphere: {comparison.atmosphere_choice?.toUpperCase()} · Vocal space: {comparison.vocal_space_choice?.toUpperCase()} · Low end: {comparison.low_end_choice?.toUpperCase()}</p>{comparison.notes && <span>{comparison.notes}</span>}</div>)}</div>
          </section>}

          {tab === "release" && <section className={styles.releaseLayout}>
            <div className={styles.sectionCard}><span className={styles.kicker}>Release Center</span><h2>Metadata, ownership, provenance, and delivery.</h2><div className={styles.releaseForm}><label>Artist name<input value={releaseDraft.artist_name} onChange={(event) => setReleaseDraft({ ...releaseDraft, artist_name: event.target.value })} /></label><label>Release date<input type="date" value={releaseDraft.release_date} onChange={(event) => setReleaseDraft({ ...releaseDraft, release_date: event.target.value })} /></label><label>ISRC<input value={releaseDraft.isrc} onChange={(event) => setReleaseDraft({ ...releaseDraft, isrc: event.target.value })} /></label><label>UPC<input value={releaseDraft.upc} onChange={(event) => setReleaseDraft({ ...releaseDraft, upc: event.target.value })} /></label><label>Distributor<input value={releaseDraft.distributor} onChange={(event) => setReleaseDraft({ ...releaseDraft, distributor: event.target.value })} /></label><label>Master ownership<input value={releaseDraft.master_ownership} onChange={(event) => setReleaseDraft({ ...releaseDraft, master_ownership: event.target.value })} /></label><label>Publishing ownership<input value={releaseDraft.publishing_ownership} onChange={(event) => setReleaseDraft({ ...releaseDraft, publishing_ownership: event.target.value })} /></label><label className={styles.fullLabel}>AI / provenance notes<textarea value={releaseDraft.ai_note} onChange={(event) => setReleaseDraft({ ...releaseDraft, ai_note: event.target.value })} placeholder="Document AI-assisted elements, source files, recreations, licenses, samples, and provenance." /></label><label className={styles.checkbox}><input type="checkbox" checked={releaseDraft.explicit} onChange={(event) => setReleaseDraft({ ...releaseDraft, explicit: event.target.checked })} /> Explicit release</label></div>
              <hr style={{ opacity: .15, margin: "24px 0" }} /><div className={styles.sectionHead}><div><span className={styles.kicker}>Songwriter splits</span><h3>Total: {splitTotal.toFixed(2)}% {Math.abs(splitTotal - 100) < .01 ? "✓" : "— must equal 100%"}</h3></div><button className={styles.secondary} onClick={() => setReleaseDraft({ ...releaseDraft, splits: [...releaseDraft.splits, newSplit()] })}>＋ Songwriter</button></div><div style={{ display: "grid", gap: 10 }}>{releaseDraft.splits.map((split, index) => <div key={split.id} className={styles.releaseForm}><label>Name<input value={split.name} onChange={(event) => { const next = [...releaseDraft.splits]; next[index] = { ...split, name: event.target.value }; setReleaseDraft({ ...releaseDraft, splits: next }); }} /></label><label>Role<input value={split.role} onChange={(event) => { const next = [...releaseDraft.splits]; next[index] = { ...split, role: event.target.value }; setReleaseDraft({ ...releaseDraft, splits: next }); }} /></label><label>PRO<input value={split.pro} onChange={(event) => { const next = [...releaseDraft.splits]; next[index] = { ...split, pro: event.target.value }; setReleaseDraft({ ...releaseDraft, splits: next }); }} /></label><label>IPI<input value={split.ipi} onChange={(event) => { const next = [...releaseDraft.splits]; next[index] = { ...split, ipi: event.target.value }; setReleaseDraft({ ...releaseDraft, splits: next }); }} /></label><label>Split %<input type="number" min="0" max="100" step="0.01" value={split.percentage} onChange={(event) => { const next = [...releaseDraft.splits]; next[index] = { ...split, percentage: Number(event.target.value) }; setReleaseDraft({ ...releaseDraft, splits: next }); }} /></label><button className={styles.secondary} onClick={() => setReleaseDraft({ ...releaseDraft, splits: releaseDraft.splits.filter((item) => item.id !== split.id) })}>Remove</button></div>)}</div>
              <hr style={{ opacity: .15, margin: "24px 0" }} /><div className={styles.sectionHead}><div><span className={styles.kicker}>Producer agreements</span><h3>Track ownership and deal status.</h3></div><button className={styles.secondary} onClick={() => setReleaseDraft({ ...releaseDraft, producer_agreements: [...releaseDraft.producer_agreements, newAgreement()] })}>＋ Producer</button></div><div style={{ display: "grid", gap: 10 }}>{releaseDraft.producer_agreements.map((agreement, index) => <div key={agreement.id} className={styles.releaseForm}><label>Producer<input value={agreement.producer} onChange={(event) => { const next = [...releaseDraft.producer_agreements]; next[index] = { ...agreement, producer: event.target.value }; setReleaseDraft({ ...releaseDraft, producer_agreements: next }); }} /></label><label>Agreement<select value={agreement.agreementType} onChange={(event) => { const next = [...releaseDraft.producer_agreements]; next[index] = { ...agreement, agreementType: event.target.value as ProducerAgreement["agreementType"] }; setReleaseDraft({ ...releaseDraft, producer_agreements: next }); }}><option value="ownership">Ownership</option><option value="work-for-hire">Work for hire</option><option value="license">License</option><option value="other">Other</option></select></label><label>Fee<input value={agreement.fee} onChange={(event) => { const next = [...releaseDraft.producer_agreements]; next[index] = { ...agreement, fee: event.target.value }; setReleaseDraft({ ...releaseDraft, producer_agreements: next }); }} /></label><label>Points<input value={agreement.points} onChange={(event) => { const next = [...releaseDraft.producer_agreements]; next[index] = { ...agreement, points: event.target.value }; setReleaseDraft({ ...releaseDraft, producer_agreements: next }); }} /></label><label>Publishing<input value={agreement.publishing} onChange={(event) => { const next = [...releaseDraft.producer_agreements]; next[index] = { ...agreement, publishing: event.target.value }; setReleaseDraft({ ...releaseDraft, producer_agreements: next }); }} /></label><label>Status<select value={agreement.status} onChange={(event) => { const next = [...releaseDraft.producer_agreements]; next[index] = { ...agreement, status: event.target.value as ProducerAgreement["status"] }; setReleaseDraft({ ...releaseDraft, producer_agreements: next }); }}><option value="draft">Draft</option><option value="signed">Signed</option><option value="not-needed">Not needed</option></select></label><label className={styles.fullLabel}>Notes<textarea value={agreement.notes} onChange={(event) => { const next = [...releaseDraft.producer_agreements]; next[index] = { ...agreement, notes: event.target.value }; setReleaseDraft({ ...releaseDraft, producer_agreements: next }); }} /></label><button className={styles.secondary} onClick={() => setReleaseDraft({ ...releaseDraft, producer_agreements: releaseDraft.producer_agreements.filter((item) => item.id !== agreement.id) })}>Remove</button></div>)}</div><button style={{ marginTop: 20 }} onClick={() => void saveRelease()}>Save complete release record</button></div>
            <div className={styles.sectionCard}><span className={styles.kicker}>Release checklist</span><h2>{releaseCompleted}/{RELEASE_CHECKLIST.length} complete</h2><div className={styles.checklist}>{RELEASE_CHECKLIST.map(([key,label]) => <button key={key} className={release?.checklist?.[key] ? styles.checked : ""} onClick={() => void toggleReleaseItem(key)}><span>{release?.checklist?.[key] ? "✓" : "○"}</span>{label}</button>)}</div></div>
          </section>}

          {tab === "ask" && <section className={styles.askLayout}><div className={styles.sectionCard}><span className={styles.kicker}>Ask Music</span><h2>AI help with this project’s actual context.</h2><p className={styles.muted}>The server sends project metadata, versions, tasks, notes, comparisons, and release state to the configured Music OS model. It is instructed not to invent audio measurements or rights facts.</p><form className={styles.askForm} onSubmit={(event) => void askMusic(event)}><textarea value={askInput} onChange={(event) => setAskInput(event.target.value)} placeholder="What should I do next? Why does my mix sound muddy? Which version leaves more room for vocals?" /><button disabled={busy}>Ask about this project</button></form><div className={styles.answer}><strong>Music OS</strong><p>{askAnswer}</p></div>{agentMessages.length > 0 && <div style={{ display: "grid", gap: 8, marginTop: 18 }}>{agentMessages.slice(-8).map((message) => <div key={message.id} style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,.04)" }}><strong>{message.role === "user" ? "You" : "Music OS"}</strong><p>{message.body}</p></div>)}</div>}</div><div className={styles.sectionCard}><span className={styles.kicker}>Try asking</span><div className={styles.promptList}>{["What should I do next?","Why does this mix sound muddy?","Separate my ad-libs.","Which version leaves more room for my voice?","What is missing before release?"].map((prompt) => <button key={prompt} onClick={() => setAskInput(prompt)}>{prompt}</button>)}</div></div></section>}
        </>
      )}

      {playerUrl && <section className={styles.playerBar}><div className={styles.playerInfo}><span>Now playing</span><strong>{playerLabel}</strong></div><audio ref={audioRef} src={playerUrl} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={() => setCurrentTime(0)} controls /><div className={styles.waveform} onClick={(event) => { if (!audioRef.current || !duration) return; const rect = event.currentTarget.getBoundingClientRect(); const next = ((event.clientX - rect.left) / rect.width) * duration; audioRef.current.currentTime = next; setCurrentTime(next); }} role="slider" aria-label="Audio playback timeline" aria-valuemin={0} aria-valuemax={duration || 0} aria-valuenow={currentTime} tabIndex={0}>{waveform.length ? waveform.map((peak,index) => <i key={index} style={{ height: `${Math.max(8, peak * 42)}px`, opacity: duration && index / waveform.length <= currentTime / duration ? 1 : .35 }} />) : <span className={styles.muted}>Waveform decode unavailable.</span>}</div><div className={styles.timecode}>{formatTime(currentTime)} / {formatTime(duration)}</div><form className={styles.noteForm} onSubmit={(event) => void addTimestampNote(event)}><input value={noteInput} onChange={(event) => setNoteInput(event.target.value)} placeholder={`Add note at ${formatTime(currentTime)}`} /><button>Save note</button></form><div className={styles.commentStrip}>{comments.filter((comment) => !playerVersionId || comment.version_id === playerVersionId).slice(0, 6).map((comment) => <button key={comment.id} onClick={() => { if (audioRef.current) audioRef.current.currentTime = comment.timestamp_ms / 1000; }}><strong>{formatTime(comment.timestamp_ms / 1000)}</strong><span>{comment.body}</span></button>)}</div></section>}
    </main>
  );
}
