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
  organization?: { root: string; strategy: string; families: string[] };
}

const jsonApi = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
  });
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
  const [mode, setMode] = useState<"core" | "deep">("deep");
  const [selectedTargets, setSelectedTargets] = useState<string[]>(PRESETS.vocals);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("Ready — choose stems and upload a track.");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const project = useMemo(
    () => (projectId ? loadStoredProjects().find((item) => item.id === projectId) ?? null : null),
    [projectId, manifest]
  );

  const workerOnline = health?.status === "ok";
  const deepReady = health?.samAudio.installed === true;

  const loadHealth = async (): Promise<void> => {
    try {
      const response = await fetch(`${SEPARATOR_URL}/health`);
      if (!response.ok) throw new Error("worker offline");
      setHealth((await response.json()) as WorkerHealth);
    } catch {
      setHealth(null);
    }
  };

  const handleManifest = async (next: Manifest, persist = true): Promise<void> => {
    setManifest(next);
    if (projectId && persist) await saveSeparationSnapshot(projectId, next.mode, next);
    const mixable = next.stems.filter((stem) => stem.mixable);
    setStatus(`Separated ${next.stems.length} outputs. Loading ${mixable.length} Core 6 channels…`);
    try {
      await player.loadStems(SEPARATOR_URL, mixable);
      const deepCount = next.stems.filter((stem) => stem.group !== "Core 6").length;
      setStatus(`Ready · ${next.model} core · ${deepCount} deep targets · recon ${next.alignment.reconErrorDb} dB.`);
    } catch {
      setStatus("Saved manifest loaded, but its worker audio expired. Re-run the saved project source to regenerate files.");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedProject = params.get("projectId");
    setProjectId(linkedProject);
    void loadHealth();
    if (linkedProject) {
      const localProject = loadStoredProjects().find((item) => item.id === linkedProject);
      setAttachedFileName(localProject?.sourceAudio?.name ?? null);
      if (localProject) {
        void jsonApi<{ imported: number }>("/api/projects/import", {
          method: "POST",
          body: JSON.stringify({ projects: [localProject] })
        }).catch(() => undefined);
      }
      void loadSeparationSnapshot<Manifest>(linkedProject, "deep").then((saved) => {
        if (saved) void handleManifest(saved, false);
      });
    }
  }, []);

  const parseError = async (response: Response): Promise<string> => {
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    return body.detail ?? `separation failed (${response.status})`;
  };

  const saveProjectResult = async (file: File, next: Manifest): Promise<void> => {
    if (!projectId) return;
    await attachProjectAudio(projectId, file);
    const analysis = await analyzeAudioFile(file);
    const source: SourceAudioAttachment = {
      name: file.name,
      size: file.size,
      type: file.type || "audio/*",
      lastModified: file.lastModified,
      attachedAt: new Date().toISOString(),
      storage: "browser-indexeddb"
    };
    const result = await jsonApi<{ project: Project }>(`/api/projects/${projectId}/live-audio`, {
      method: "POST",
      body: JSON.stringify({
        source,
        analysis,
        stems: next.stems,
        mode: next.mode,
        model: next.model,
        zipUrl: next.zipUrl
      })
    });
    saveStoredProject(result.project);
    setAttachedFileName(file.name);
  };

  const separateFile = async (file: File): Promise<void> => {
    if (!workerOnline) {
      setStatus("The separator worker is not reachable.");
      return;
    }
    if (mode === "deep" && !deepReady) {
      setStatus("Deep 60+ requires the GPU deep-isolation engine. Core 6 is still available.");
      return;
    }
    if (mode === "deep" && selectedTargets.length === 0) {
      setStatus("Choose at least one deep target, or switch to Core 6.");
      return;
    }

    setBusy(true);
    const targetCount = mode === "deep" ? selectedTargets.length : 0;
    setStatus(`Uploading ${file.name} · Core 6${targetCount ? ` + ${targetCount} deep targets` : ""}…`);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mode", mode);
      form.append("targets", JSON.stringify(mode === "deep" ? selectedTargets : []));
      const response = await fetch(`${SEPARATOR_URL}/separate`, { method: "POST", body: form });
      if (!response.ok) throw new Error(await parseError(response));
      const next = (await response.json()) as Manifest;
      await handleManifest(next);
      if (projectId) {
        setStatus("Writing measured audio DNA and separated stems back to the linked project…");
        await saveProjectResult(file, next);
        setStatus(`Project updated · ${next.stems.length} outputs saved · ${next.failedTargets.length} failed targets.`);
      }
      await loadHealth();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected separation error");
    } finally {
      setBusy(false);
      setDragging(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const runAttachedAudio = async (): Promise<void> => {
    if (!projectId) return;
    const file = await getProjectAudio(projectId);
    if (!file) {
      setStatus("The saved project source is not available in this browser. Choose it again.");
      return;
    }
    await separateFile(file);
  };

  const toggleTarget = (id: string): void => {
    setSelectedTargets((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const choosePreset = (name: "vocals" | "drums" | "beat" | "instruments" | "all"): void => {
    setSelectedTargets([...PRESETS[name]]);
    setMode("deep");
  };

  const stemMeta = (name: string): StemInfo | undefined => manifest?.stems.find((stem) => stem.name === name);
  const deepOutputs = manifest?.stems.filter((stem) => stem.group !== "Core 6") ?? [];
  const coreDownloads = manifest?.stems.filter((stem) => stem.group === "Core 6" && !stem.mixable) ?? [];
  const projectQuery = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";

  return (
    <main className="stemStudio">
      <div className="studioTopbar">
        <div className="studioBrand"><span className="studioMark">S</span><span>Stem Studio</span></div>
        <div style={{ display: "flex", gap: ".8rem", alignItems: "center" }}>
          <Link className="studioNavLink" href="/">Beat Lab</Link>
          <Link className="studioNavLink" href={`/stem-lab${projectQuery}`}>Stem Lab</Link>
          {project && <span className="studioChip">{project.title}</span>}
        </div>
      </div>

      <div className="studioShell">
        <section className="studioHero">
          <div>
            <p className="studioEyebrow">Production stem workstation</p>
            <h1>Core 6 + <span>Deep 60+ isolation</span></h1>
            <p className="studioHeroCopy">Run real Demucs Core 6 separation, optionally isolate dozens of named vocal and instrument targets, audition the synchronized core mixer, and save the whole result back into your Beat Lab project.</p>
          </div>
          <div className="studioHeroStat">
            <div className="studioStat"><strong>6</strong><span>mixable core stems</span></div>
            <div className="studioStat"><strong>{STEM_TARGETS.length}</strong><span>deep target types</span></div>
            <div className="studioStat"><strong>{projectId ? "ON" : "—"}</strong><span>project handoff</span></div>
          </div>
        </section>

        <section className="studioWorkspace">
          <div className="studioPanel studioUploadPanel">
            <div className={`studioDropzone ${dragging ? "isDragging" : ""}`} onClick={() => fileRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) void separateFile(file); }}>
              <div>
                <div className="studioDropIcon">↥</div>
                <h2>{attachedFileName ? `Project source: ${attachedFileName}` : "Drop your song here"}</h2>
                <p>{mode === "core" ? "Core 6: vocals, drums, bass, guitar, piano, other + instrumental." : `Deep mode: Core 6 plus ${selectedTargets.length} selected named isolates.`}</p>
                <div className="studioActions" style={{ justifyContent: "center" }}>
                  {attachedFileName && <button className="studioButton" onClick={(event) => { event.stopPropagation(); void runAttachedAudio(); }} disabled={busy}>Run saved project audio</button>}
                  <button className="studioGhostButton" onClick={(event) => { event.stopPropagation(); fileRef.current?.click(); }} disabled={busy}>Choose audio</button>
                </div>
                <input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff" style={{ display: "none" }} onChange={(event) => { const file = event.target.files?.[0]; if (file) void separateFile(file); }} />
              </div>
            </div>
          </div>

          <aside className="studioPanel studioControlPanel">
            <p className="studioSectionLabel">Separation mode</p>
            <div className="studioModeSwitch"><button className={`studioModeButton ${mode === "core" ? "active" : ""}`} onClick={() => setMode("core")}>Core 6</button><button className={`studioModeButton ${mode === "deep" ? "active" : ""}`} onClick={() => setMode("deep")}>Deep 60+</button></div>
            <p className="studioModeDescription">{mode === "core" ? "Fastest production path with six non-overlapping channels." : `${selectedTargets.length} deep targets selected. Deep isolates can overlap and should not all be summed together.`}</p>
            <p className="studioSectionLabel">Engine health</p>
            <div className="studioHealthGrid">
              <div className="studioHealthRow"><span>Core worker</span><strong className={workerOnline ? "studioGood" : "studioWarn"}>{workerOnline ? "online" : "offline"}</strong></div>
              <div className="studioHealthRow"><span>Deep engine</span><strong className={deepReady ? "studioGood" : "studioWarn"}>{deepReady ? "ready" : "GPU required"}</strong></div>
              <div className="studioHealthRow"><span>CUDA</span><strong>{health?.samAudio.cudaAvailable ? "yes" : "no / unknown"}</strong></div>
              <div className="studioHealthRow"><span>API</span><span className="studioEndpoint">{SEPARATOR_URL}</span></div>
            </div>
          </aside>
        </section>

        {mode === "deep" && (
          <section className="studioPanel studioSection">
            <div className="studioSectionHeader">
              <div><h2>Choose deep stems</h2><p>Each checked target is an independent isolation request. Start focused; use All only when you truly need the full catalog.</p></div>
              <span className="studioCount">{selectedTargets.length}</span>
            </div>
            <div className="studioChips" style={{ marginBottom: ".8rem" }}><button className="studioChip" onClick={() => choosePreset("vocals")}>Vocals</button><button className="studioChip" onClick={() => choosePreset("drums")}>Drums</button><button className="studioChip" onClick={() => choosePreset("beat")}>Beat</button><button className="studioChip" onClick={() => choosePreset("instruments")}>Instruments</button><button className="studioChip" onClick={() => choosePreset("all")}>All {STEM_TARGETS.length}</button><button className="studioChip" onClick={() => setSelectedTargets([])}>Clear</button></div>
            {selectedTargets.length > 12 && <div className="studioNotice">Large deep jobs can take a long time because targets are isolated separately. Use focused presets when speed matters.</div>}
            <div className="studioGroupGrid">{STEM_GROUPS.map((group) => <div className="studioGroup" key={group}><h3>{group}</h3><div className="studioTargetGrid">{STEM_TARGETS.filter((target) => target.group === group).map((target) => { const checked = selectedTargets.includes(target.id); return <label key={target.id} className={`studioTarget ${checked ? "selected" : ""}`}><input type="checkbox" checked={checked} onChange={() => toggleTarget(target.id)} /><span>{target.label}</span></label>; })}</div></div>)}</div>
          </section>
        )}

        <section className="studioResultsGrid">
          <section className="studioPanel studioSection">
            <div className="studioSectionHeader"><div><h2>Core 6 mixer</h2><p>Only non-overlapping Core 6 channels are loaded into this synchronized mixer.</p></div></div>
            {player.stems.length === 0 ? <div className="studioEmpty">Run a separation to load the mixer.</div> : (
              <>
                <div className="studioTransport"><button className="studioMiniButton primary" onClick={player.play} disabled={player.isLoading}>▶ Play</button><button className="studioMiniButton" onClick={player.stop}>■ Stop</button><button className="studioMiniButton" onClick={player.karaoke}>Instrumental</button><button className="studioMiniButton" onClick={player.acapella}>Vocals only</button><button className="studioMiniButton" onClick={player.reset}>Reset</button></div>
                <div className="studioMixerGrid">{player.stems.map((ui) => { const meta = stemMeta(ui.name); return <article className="studioChannel" key={ui.name}><div className="studioChannelTop"><div><h3>{meta?.label ?? ui.name}</h3><div className="studioChannelPath">{meta?.family ?? "Core 6"} · {meta?.file ?? ""}</div></div><span className="studioDb">{meta?.integratedDb ?? "—"} dB</span></div><div className="studioSoloMute"><button className={ui.solo ? "activeSolo" : ""} onClick={() => player.setSolo(ui.name, !ui.solo)}>Solo</button><button className={ui.muted ? "activeMute" : ""} onClick={() => player.setMuted(ui.name, !ui.muted)}>Mute</button></div><input className="studioRange" type="range" min={0} max={1} step={0.01} value={ui.gain} onChange={(event) => player.setGain(ui.name, Number(event.target.value))} aria-label={`${ui.name} gain`} /></article>; })}</div>
                {coreDownloads.map((stem) => <div className="studioDownloadRow" key={stem.name} style={{ marginTop: ".65rem" }}><strong>{stem.label ?? stem.name}</strong> <span style={{ color: "var(--studio-muted)" }}>· {stem.family}</span> <a className="studioLink" href={`${SEPARATOR_URL}${stem.url}`} download={stem.downloadName ?? true}>Download WAV</a></div>)}
              </>
            )}
          </section>

          <section className="studioPanel studioSection">
            <div className="studioSectionHeader"><div><h2>Deep isolated outputs</h2><p>Named target isolates are previewable and downloadable individually.</p></div></div>
            {!manifest ? <div className="studioEmpty">No separation yet.</div> : deepOutputs.length === 0 ? <div className="studioEmpty">No deep outputs in this job.</div> : <div className="studioDeepList">{STEM_GROUPS.map((group) => { const stems = deepOutputs.filter((stem) => stem.group === group); if (!stems.length) return null; return <div className="studioDeepGroup" key={group}><h3 className="studioDeepGroupTitle">{group}</h3>{stems.map((stem) => <article className="studioDeepStem" key={`${stem.name}-${stem.url}`}><div className="studioDeepStemHead"><div><strong>{stem.label ?? stem.name}</strong><div className="studioChannelPath">{stem.family ?? stem.group} · {stem.file}</div></div><a className="studioLink" href={`${SEPARATOR_URL}${stem.url}`} download={stem.downloadName ?? true}>WAV</a></div><audio controls preload="none" src={`${SEPARATOR_URL}${stem.url}`} /></article>)}</div>; })}</div>}
          </section>
        </section>

        {manifest && (
          <section className="studioPanel studioSection">
            <div className="studioSectionHeader"><div><h2>Project handoff + job manifest</h2><p>{projectId ? "This result is linked back to the current Beat Lab project." : "Open Stem Studio from a Beat Lab project to attach results automatically."}</p></div>{manifest.zipUrl && <a className="studioButton" style={{ textDecoration: "none" }} href={`${SEPARATOR_URL}${manifest.zipUrl}`} download="Organized_Stems.zip">Download organized ZIP</a>}</div>
            <div className="studioManifestGrid"><div className="studioManifestCard"><h3>Source</h3><div>{manifest.source.filename}<br />{manifest.durationSec}s · {manifest.sampleRate / 1000} kHz · {manifest.channels}ch</div></div><div className="studioManifestCard"><h3>Engines</h3><div>Core: {manifest.engines.core}<br />Deep: {manifest.engines.deep}</div></div><div className="studioManifestCard"><h3>Quality</h3><div>Recon {manifest.alignment.reconErrorDb} dB<br />Failed targets: {manifest.failedTargets.length}</div></div></div>
            {manifest.failedTargets.length > 0 && <div className="studioNotice" style={{ marginTop: ".8rem" }}>Failed targets: {manifest.failedTargets.map((item) => item.id).join(", ")}. Other completed stems remain valid.</div>}
          </section>
        )}

        <ProducerDnaPanel trackName={manifest?.source.filename} />
      </div>

      <div className="studioStatusBar" aria-live="polite"><span className={`studioStatusDot ${busy || player.isLoading ? "busy" : ""}`} /><span>{busy || player.isLoading ? "Working · " : ""}{status}</span></div>
    </main>
  );
}
