"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { analyzeAudioFile } from "@/lib/browser-audio-analysis";
import {
  attachProjectAudio,
  getProjectAudio,
  loadSeparationSnapshot,
  loadStoredProjects,
  saveSeparationSnapshot,
  saveStoredProject
} from "@/lib/browser-project-storage";
import {
  getCurrentUser,
  isCloudConfigured,
  supabaseRest,
  uploadPrivateFile,
  uploadPrivateUrl
} from "@/lib/persistence/supabase-rest";
import type { CloudUser, MusicAssetRow, MusicProjectRow, MusicVersionRow } from "@/lib/persistence/types";
import type { Project, SourceAudioAttachment } from "@/lib/types";
import { ProducerDnaPanel } from "./ProducerDnaPanel";
import { PRESETS, STEM_GROUPS, STEM_TARGETS } from "./catalog";
import { useRealStemPlayer, type StemInfo } from "./useRealStemPlayer";
import "./stemStudio.css";

const SEPARATOR_URL = process.env.NEXT_PUBLIC_SEPARATOR_URL ?? "http://localhost:8000";

interface WorkerHealth {
  status: string;
  version: string;
  coreModel: string;
  deepTargetCount: number;
  samAudio: { installed: boolean; model: string; cudaAvailable: boolean; hfTokenPresent: boolean };
}
interface FailedTarget { id: string; error: string }
interface Manifest {
  jobId: string;
  source: { filename: string };
  model: string;
  device?: string;
  mode: "core" | "deep";
  sampleRate: number;
  channels: number;
  durationSec: number;
  stems: StemInfo[];
  requestedTargets: string[];
  failedTargets: FailedTarget[];
  alignment: { reconErrorDb: number; note: string };
  warnings: string[];
  engines: { core: string; deep: string };
  zipUrl?: string;
}

const jsonApi = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; detail?: string };
    throw new Error(body.error ?? body.detail ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
};

export default function StemStudioPage(): React.JSX.Element {
  const player = useRealStemPlayer();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [mode, setMode] = useState<"core" | "deep">("deep");
  const [selectedTargets, setSelectedTargets] = useState<string[]>(PRESETS.vocals);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("Ready — choose stems and upload a track.");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const project = useMemo(() => projectId ? loadStoredProjects().find((item) => item.id === projectId) ?? null : null, [projectId, manifest]);
  const workerOnline = health?.status === "ok";
  const deepReady = health?.samAudio.installed === true;
  const projectQuery = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";

  const loadHealth = async (): Promise<void> => {
    try {
      const response = await fetch(`${SEPARATOR_URL}/health`);
      if (!response.ok) throw new Error("worker offline");
      setHealth((await response.json()) as WorkerHealth);
    } catch { setHealth(null); }
  };

  const handleManifest = async (next: Manifest, persist = true): Promise<void> => {
    setManifest(next);
    if (projectId && persist) await saveSeparationSnapshot(projectId, next.mode, next);
    const mixable = next.stems.filter((stem) => stem.mixable);
    setStatus(`Separated ${next.stems.length} outputs. Loading ${mixable.length} synchronized Core 6 channels…`);
    try {
      await player.loadStems(SEPARATOR_URL, mixable);
      const deepCount = next.stems.filter((stem) => stem.group !== "Core 6").length;
      setStatus(`Ready · ${next.model} · ${deepCount} deep targets · recon ${next.alignment.reconErrorDb} dB.`);
    } catch {
      setStatus("The saved worker audio expired. Re-run the project source to regenerate it.");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedProject = params.get("projectId");
    setProjectId(linkedProject);
    void loadHealth();
    if (isCloudConfigured()) void getCurrentUser().then(setCloudUser).catch(() => setCloudUser(null));
    if (linkedProject) {
      const localProject = loadStoredProjects().find((item) => item.id === linkedProject);
      setAttachedFileName(localProject?.sourceAudio?.name ?? null);
      if (localProject) void jsonApi<{ imported: number }>("/api/projects/import", { method: "POST", body: JSON.stringify({ projects: [localProject] }) }).catch(() => undefined);
      void loadSeparationSnapshot<Manifest>(linkedProject, "deep").then((saved) => { if (saved) void handleManifest(saved, false); });
    }
  }, []);

  const parseError = async (response: Response): Promise<string> => {
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    return body.detail ?? `separation failed (${response.status})`;
  };

  const saveCloudOutputs = async (file: File, next: Manifest, updatedProject: Project, analysis: Awaited<ReturnType<typeof analyzeAudioFile>>): Promise<number> => {
    if (!projectId || !cloudUser || !isCloudConfigured()) return 0;
    const projectRows = await supabaseRest<MusicProjectRow[]>("music_projects", { query: `select=*&id=eq.${projectId}&limit=1` });
    let cloudProject = projectRows[0];
    if (!cloudProject) {
      const created = await supabaseRest<MusicProjectRow[]>("music_projects", {
        method: "POST",
        body: { id: projectId, user_id: cloudUser.id, title: updatedProject.title, brief: updatedProject.brief, status: "in-progress", bpm: analysis.bpm, song_key: analysis.key, readiness: 40, planning_state: updatedProject, live_analysis: analysis, last_synced_at: new Date().toISOString() }
      });
      cloudProject = created[0];
    }

    let sourcePath = cloudProject?.source_audio_path ?? null;
    if (!sourcePath) {
      sourcePath = await uploadPrivateFile(projectId, file, "source");
      const latest = await supabaseRest<MusicVersionRow[]>("music_versions", { query: `select=version_number&project_id=eq.${projectId}&order=version_number.desc&limit=1` });
      const versionNumber = (latest[0]?.version_number ?? 0) + 1;
      await supabaseRest<MusicVersionRow[]>("music_versions", {
        method: "POST",
        body: { project_id: projectId, user_id: cloudUser.id, version_number: versionNumber, label: versionNumber === 1 ? "Source / Version 1" : `Source / Version ${versionNumber}`, storage_path: sourcePath, original_name: file.name, mime_type: file.type || null, byte_size: file.size, duration_sec: analysis.durationSec, bpm: analysis.bpm, song_key: analysis.key }
      });
    }

    let saved = 0;
    for (const stem of next.stems) {
      if (!stem.url) continue;
      const filename = stem.downloadName ?? `${stem.name}.wav`;
      try {
        const remoteUrl = stem.url.startsWith("http") ? stem.url : `${SEPARATOR_URL}${stem.url}`;
        const uploaded = await uploadPrivateUrl(projectId, remoteUrl, filename, `stems/${next.jobId}`);
        await supabaseRest<MusicAssetRow[]>("music_assets", {
          method: "POST",
          body: { project_id: projectId, user_id: cloudUser.id, kind: "stem", label: stem.label ?? stem.name, storage_path: uploaded.path, original_name: uploaded.file.name, mime_type: uploaded.file.type || "audio/wav", byte_size: uploaded.file.size, duration_sec: next.durationSec }
        });
        saved += 1;
      } catch {
        // Keep completed stems even if an individual worker file expires during cloud copy.
      }
    }

    await supabaseRest<MusicProjectRow[]>("music_projects", {
      method: "PATCH",
      query: `id=eq.${projectId}`,
      body: { source_audio_path: sourcePath, live_analysis: analysis, planning_state: updatedProject, bpm: analysis.bpm, song_key: analysis.key, status: "in-progress", readiness: Math.max(cloudProject?.readiness ?? 0, 45), last_synced_at: new Date().toISOString() }
    });
    return saved;
  };

  const saveProjectResult = async (file: File, next: Manifest): Promise<number> => {
    if (!projectId) return 0;
    await attachProjectAudio(projectId, file);
    const analysis = await analyzeAudioFile(file);
    const source: SourceAudioAttachment = { name: file.name, size: file.size, type: file.type || "audio/*", lastModified: file.lastModified, attachedAt: new Date().toISOString(), storage: "browser-indexeddb" };
    const result = await jsonApi<{ project: Project }>(`/api/projects/${projectId}/live-audio`, {
      method: "POST",
      body: JSON.stringify({ source, analysis, stems: next.stems, mode: next.mode, model: next.model, zipUrl: next.zipUrl })
    });
    saveStoredProject(result.project);
    setAttachedFileName(file.name);
    return saveCloudOutputs(file, next, result.project, analysis);
  };

  const separateFile = async (file: File): Promise<void> => {
    if (!workerOnline) { setStatus("The separator worker is not reachable."); return; }
    if (mode === "deep" && !deepReady) { setStatus("Deep 60+ requires the GPU deep-isolation engine. Core 6 is still available."); return; }
    if (mode === "deep" && selectedTargets.length === 0) { setStatus("Choose at least one deep target, or switch to Core 6."); return; }
    setBusy(true);
    const targetCount = mode === "deep" ? selectedTargets.length : 0;
    setStatus(`Uploading ${file.name} · Core 6${targetCount ? ` + ${targetCount} deep targets` : ""}…`);
    try {
      const form = new FormData(); form.append("file", file); form.append("mode", mode); form.append("targets", JSON.stringify(mode === "deep" ? selectedTargets : []));
      const response = await fetch(`${SEPARATOR_URL}/separate`, { method: "POST", body: form });
      if (!response.ok) throw new Error(await parseError(response));
      const next = (await response.json()) as Manifest;
      await handleManifest(next);
      if (projectId) {
        setStatus("Saving measured audio DNA and generated stems into this project…");
        const cloudSaved = await saveProjectResult(file, next);
        setStatus(`Project updated · ${next.stems.length} outputs · ${cloudSaved} copied to private cloud storage · ${next.failedTargets.length} failed targets.`);
      }
      await loadHealth();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unexpected separation error"); }
    finally { setBusy(false); setDragging(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const runAttachedAudio = async (): Promise<void> => {
    if (!projectId) return;
    const file = await getProjectAudio(projectId);
    if (!file) { setStatus("The saved source is not available in this browser. If it exists in the cloud library, download it from the Dashboard or choose the source again here."); return; }
    await separateFile(file);
  };

  const toggleTarget = (id: string): void => setSelectedTargets((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const choosePreset = (name: "vocals" | "drums" | "beat" | "instruments" | "all"): void => { setSelectedTargets([...PRESETS[name]]); setMode("deep"); };
  const stemMeta = (name: string): StemInfo | undefined => manifest?.stems.find((stem) => stem.name === name);
  const deepOutputs = manifest?.stems.filter((stem) => stem.group !== "Core 6") ?? [];
  const coreDownloads = manifest?.stems.filter((stem) => stem.group === "Core 6" && !stem.mixable) ?? [];

  return (
    <main className="stemStudio">
      <div className="studioTopbar"><div className="studioBrand"><span className="studioMark">S</span><span>Stem Studio</span></div><div style={{ display: "flex", gap: ".8rem", alignItems: "center" }}><Link className="studioNavLink" href={`/${projectQuery}`}>Studio</Link><Link className="studioNavLink" href={`/dashboard${projectQuery}`}>Dashboard</Link><Link className="studioNavLink" href={`/stem-lab${projectQuery}`}>Stem Lab</Link>{project && <span className="studioChip">{project.title}</span>}</div></div>
      <div className="studioShell">
        <section className="studioHero"><div><p className="studioEyebrow">Production stem workstation</p><h1>Core 6 + <span>Deep 60+ isolation</span></h1><p className="studioHeroCopy">Separate real audio, audition synchronized Core 6 stems, isolate specific parts, and automatically save generated WAVs back into the same private song project.</p></div><div className="studioHeroStat"><div className="studioStat"><strong>6</strong><span>mixable core stems</span></div><div className="studioStat"><strong>{STEM_TARGETS.length}</strong><span>deep target types</span></div><div className="studioStat"><strong>{projectId ? "ON" : "—"}</strong><span>project handoff</span></div></div></section>
        <section className="studioWorkspace"><div className="studioPanel studioUploadPanel"><div className={`studioDropzone ${dragging ? "isDragging" : ""}`} onClick={() => fileRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) void separateFile(file); }}><div><div className="studioDropIcon">↥</div><h2>{attachedFileName ? `Project source: ${attachedFileName}` : "Drop your song here"}</h2><p>{mode === "core" ? "Core 6: vocals, drums, bass, guitar, piano, other + instrumental." : `Deep mode: Core 6 plus ${selectedTargets.length} selected named isolates.`}</p><div className="studioActions" style={{ justifyContent: "center" }}>{attachedFileName && <button className="studioButton" onClick={(event) => { event.stopPropagation(); void runAttachedAudio(); }} disabled={busy}>Run saved project audio</button>}<button className="studioGhostButton" onClick={(event) => { event.stopPropagation(); fileRef.current?.click(); }} disabled={busy}>Choose audio</button></div><input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff" style={{ display: "none" }} onChange={(event) => { const file = event.target.files?.[0]; if (file) void separateFile(file); }} /></div></div></div><aside className="studioPanel studioControlPanel"><p className="studioSectionLabel">Separation mode</p><div className="studioModeSwitch"><button className={`studioModeButton ${mode === "core" ? "active" : ""}`} onClick={() => setMode("core")}>Core 6</button><button className={`studioModeButton ${mode === "deep" ? "active" : ""}`} onClick={() => setMode("deep")}>Deep 60+</button></div><p className="studioModeDescription">{mode === "core" ? "Fastest production path with six non-overlapping channels." : `${selectedTargets.length} deep targets selected. Deep isolates can overlap.`}</p><p className="studioSectionLabel">Engine health</p><div className="studioHealthGrid"><div className="studioHealthRow"><span>Core worker</span><strong className={workerOnline ? "studioGood" : "studioWarn"}>{workerOnline ? "online" : "offline"}</strong></div><div className="studioHealthRow"><span>Deep engine</span><strong className={deepReady ? "studioGood" : "studioWarn"}>{deepReady ? "ready" : "GPU required"}</strong></div><div className="studioHealthRow"><span>Cloud save</span><strong className={cloudUser ? "studioGood" : "studioWarn"}>{cloudUser ? "private project" : "sign in"}</strong></div></div></aside></section>
        {mode === "deep" && <section className="studioPanel studioSection"><div className="studioSectionHeader"><div><h2>Choose deep stems</h2><p>Start focused. Every completed output can be copied into the project library.</p></div><span className="studioCount">{selectedTargets.length}</span></div><div className="studioChips" style={{ marginBottom: ".8rem" }}><button className="studioChip" onClick={() => choosePreset("vocals")}>Vocals</button><button className="studioChip" onClick={() => choosePreset("drums")}>Drums</button><button className="studioChip" onClick={() => choosePreset("beat")}>Beat</button><button className="studioChip" onClick={() => choosePreset("instruments")}>Instruments</button><button className="studioChip" onClick={() => choosePreset("all")}>All {STEM_TARGETS.length}</button><button className="studioChip" onClick={() => setSelectedTargets([])}>Clear</button></div><div className="studioGroupGrid">{STEM_GROUPS.map((group) => <div className="studioGroup" key={group}><h3>{group}</h3><div className="studioTargetGrid">{STEM_TARGETS.filter((target) => target.group === group).map((target) => { const checked = selectedTargets.includes(target.id); return <label key={target.id} className={`studioTarget ${checked ? "selected" : ""}`}><input type="checkbox" checked={checked} onChange={() => toggleTarget(target.id)} /><span>{target.label}</span></label>; })}</div></div>)}</div></section>}
        <section className="studioResultsGrid"><section className="studioPanel studioSection"><div className="studioSectionHeader"><div><h2>Core 6 mixer</h2><p>Synchronized, non-overlapping production channels.</p></div></div>{player.stems.length === 0 ? <div className="studioEmpty">Run a separation to load the mixer.</div> : <><div className="studioTransport"><button className="studioMiniButton primary" onClick={player.play} disabled={player.isLoading}>▶ Play</button><button className="studioMiniButton" onClick={player.stop}>■ Stop</button><button className="studioMiniButton" onClick={player.karaoke}>Instrumental</button><button className="studioMiniButton" onClick={player.acapella}>Vocals only</button><button className="studioMiniButton" onClick={player.reset}>Reset</button></div><div className="studioMixerGrid">{player.stems.map((ui) => { const meta = stemMeta(ui.name); return <article className="studioChannel" key={ui.name}><div className="studioChannelTop"><div><h3>{meta?.label ?? ui.name}</h3><div className="studioChannelPath">{meta?.family ?? "Core 6"}</div></div><span className="studioDb">{meta?.integratedDb ?? "—"} dB</span></div><div className="studioSoloMute"><button className={ui.solo ? "activeSolo" : ""} onClick={() => player.setSolo(ui.name, !ui.solo)}>Solo</button><button className={ui.muted ? "activeMute" : ""} onClick={() => player.setMuted(ui.name, !ui.muted)}>Mute</button></div><input className="studioRange" type="range" min={0} max={1} step={0.01} value={ui.gain} onChange={(event) => player.setGain(ui.name, Number(event.target.value))} /></article>; })}</div>{coreDownloads.map((stem) => <div className="studioDownloadRow" key={stem.name}><strong>{stem.label ?? stem.name}</strong> <a className="studioLink" href={`${SEPARATOR_URL}${stem.url}`} download={stem.downloadName ?? true}>WAV</a></div>)}</>}</section><section className="studioPanel studioSection"><div className="studioSectionHeader"><div><h2>Deep isolated outputs</h2><p>Preview or download specific parts.</p></div></div>{!manifest ? <div className="studioEmpty">No separation yet.</div> : deepOutputs.length === 0 ? <div className="studioEmpty">No deep outputs in this job.</div> : <div className="studioDeepList">{deepOutputs.map((stem) => <article className="studioDeepStem" key={`${stem.name}-${stem.url}`}><div className="studioDeepStemHead"><div><strong>{stem.label ?? stem.name}</strong><div className="studioChannelPath">{stem.family ?? stem.group}</div></div><a className="studioLink" href={`${SEPARATOR_URL}${stem.url}`} download={stem.downloadName ?? true}>WAV</a></div><audio controls preload="none" src={`${SEPARATOR_URL}${stem.url}`} /></article>)}</div>}</section></section>
        {manifest && <section className="studioPanel studioSection"><div className="studioSectionHeader"><div><h2>Project handoff</h2><p>{projectId ? cloudUser ? "Local planning state and generated stems are saved into the same private project." : "Local project updated. Sign in to copy generated stems into private cloud storage." : "Open Stem Studio from a project to keep outputs attached to that song."}</p></div>{manifest.zipUrl && <a className="studioButton" style={{ textDecoration: "none" }} href={`${SEPARATOR_URL}${manifest.zipUrl}`} download="Organized_Stems.zip">Download ZIP</a>}</div><div className="studioManifestGrid"><div className="studioManifestCard"><h3>Source</h3><div>{manifest.source.filename}<br />{manifest.durationSec}s · {manifest.sampleRate / 1000} kHz</div></div><div className="studioManifestCard"><h3>Engines</h3><div>Core: {manifest.engines.core}<br />Deep: {manifest.engines.deep}</div></div><div className="studioManifestCard"><h3>Quality</h3><div>Recon {manifest.alignment.reconErrorDb} dB<br />Failed targets: {manifest.failedTargets.length}</div></div></div></section>}
        <ProducerDnaPanel trackName={manifest?.source.filename} />
      </div>
      <div className="studioStatusBar" aria-live="polite"><span className={`studioStatusDot ${busy || player.isLoading ? "busy" : ""}`} /><span>{busy || player.isLoading ? "Working · " : ""}{status}</span></div>
    </main>
  );
}
