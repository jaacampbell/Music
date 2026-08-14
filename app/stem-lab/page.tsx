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
import { useRealStemPlayer, type StemInfo } from "../stem-studio/useRealStemPlayer";
import "./stemLab.css";

const SEPARATOR_URL = process.env.NEXT_PUBLIC_SEPARATOR_URL ?? "http://localhost:8000";

interface WorkerHealth {
  status: string;
  version: string;
  coreModel: string;
  deepTargetCount: number;
  samAudio: { installed: boolean; model: string; cudaAvailable: boolean; hfTokenPresent: boolean };
}

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
  zipUrl?: string;
  alignment: { reconErrorDb: number; note: string };
  warnings: string[];
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

export default function StemLabPage(): React.JSX.Element {
  const player = useRealStemPlayer();
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("Ready — upload a real track to inspect the Core 6 separation.");
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
      if (!response.ok) throw new Error(`health failed (${response.status})`);
      setHealth((await response.json()) as WorkerHealth);
    } catch {
      setHealth(null);
    }
  };

  const handleManifest = async (next: Manifest, persist = true): Promise<void> => {
    setManifest(next);
    if (projectId && persist) await saveSeparationSnapshot(projectId, "core", next);
    const mixable = next.stems.filter((stem) => stem.mixable);
    setStatus(`Loading ${mixable.length} synchronized stems into the QA mixer…`);
    try {
      await player.loadStems(SEPARATOR_URL, mixable);
      setStatus(`Ready · ${next.source.filename} · ${next.model} · recon ${next.alignment.reconErrorDb} dB.`);
    } catch {
      setStatus("Saved separation metadata loaded, but the worker audio files are no longer available. Re-run the attached source.");
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
      void loadSeparationSnapshot<Manifest>(linkedProject, "core").then((saved) => {
        if (saved) void handleManifest(saved, false);
      });
    }
  }, []);

  const parseError = async (response: Response): Promise<string> => {
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    return body.detail ?? `separator failed (${response.status})`;
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
      body: JSON.stringify({ source, analysis, stems: next.stems, mode: "core", model: next.model, zipUrl: next.zipUrl })
    });
    saveStoredProject(result.project);
    setAttachedFileName(file.name);
  };

  const separateFile = async (file: File): Promise<void> => {
    setBusy(true);
    setStatus(`Uploading ${file.name} and running real Core 6 separation…`);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mode", "core");
      form.append("targets", "[]");
      const response = await fetch(`${SEPARATOR_URL}/separate`, { method: "POST", body: form });
      if (!response.ok) throw new Error(await parseError(response));
      const next = (await response.json()) as Manifest;
      await handleManifest(next);
      if (projectId) {
        setStatus("Saving analysis and stem metadata back to the linked Beat Lab project…");
        await saveProjectResult(file, next);
        setStatus(`Project updated · ${next.source.filename} · recon ${next.alignment.reconErrorDb} dB.`);
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
      setStatus("The project source is not available in this browser. Choose the audio file again.");
      return;
    }
    await separateFile(file);
  };

  const separateDemo = async (): Promise<void> => {
    setBusy(true);
    setStatus("Running the synthetic QA mix through the real Core 6 engine…");
    try {
      const response = await fetch(`${SEPARATOR_URL}/separate/demo`, { method: "POST" });
      if (!response.ok) throw new Error(await parseError(response));
      await handleManifest((await response.json()) as Manifest, false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Demo separation failed");
    } finally {
      setBusy(false);
    }
  };

  const stemMeta = (name: string): StemInfo | undefined => manifest?.stems.find((stem) => stem.name === name);
  const mixableStems = manifest?.stems.filter((stem) => stem.mixable) ?? [];
  const projectQuery = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";

  return (
    <main className="sl-shell">
      <div className="sl-wrap">
        <nav className="sl-topbar" aria-label="Music OS navigation">
          <div className="sl-brand">Stem Lab · Live QA</div>
          <div className="sl-nav">
            <Link href="/">Agentic Beat Lab</Link>
            <Link href={`/stem-lab${projectQuery}`}>Stem Lab</Link>
            <Link href={`/stem-studio${projectQuery}`}>Stem Studio 60+</Link>
          </div>
        </nav>

        <section className="sl-hero">
          <div className="sl-hero-main">
            <p className="sl-kicker">Real audio inspection workspace</p>
            <h1>QA the actual stems attached to your production project.</h1>
            <p className="sl-lede">
              Stem Lab runs Core 6 on real audio, loads synchronized channels into a mixer, verifies reconstruction, and writes the results back to the linked Beat Lab project when you arrive with a project ID.
            </p>
            <div className="sl-actions">
              {project && <span className="sl-badge">Linked: {project.title}</span>}
              {attachedFileName && <button className="sl-button" onClick={() => void runAttachedAudio()} disabled={busy || !workerOnline}>Run saved project audio</button>}
              <button className="sl-button secondary" onClick={() => fileRef.current?.click()} disabled={busy || !workerOnline}>Choose different audio</button>
              <Link className="sl-link-button secondary" href={`/stem-studio${projectQuery}`}>Open Deep 60+</Link>
            </div>
          </div>

          <aside className="sl-panel sl-status-grid">
            <div className="sl-panel-head"><div><h3>Engine status</h3><p>What Stem Lab can do right now.</p></div></div>
            <div className="sl-status-card"><strong><span className={`sl-dot ${workerOnline ? "live" : ""}`} /> Core separator</strong><p>{workerOnline ? `${health?.coreModel} is reachable.` : "Separator worker is not reachable."}</p></div>
            <div className="sl-status-card"><strong><span className={`sl-dot ${deepReady ? "live" : ""}`} /> Deep engine</strong><p>{deepReady ? `${health?.deepTargetCount ?? 0} targets available in Stem Studio.` : "Deep target runtime is not available."}</p></div>
            <div className="sl-status-card"><strong>Project handoff</strong><p>{projectId ? "Results from this page are saved back into the linked project." : "Open Stem Lab from a Beat Lab project to keep results attached."}</p></div>
          </aside>
        </section>

        <section className="sl-upload-panel">
          <div className="sl-panel">
            <div className={`sl-drop ${dragging ? "drag" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file && !busy && workerOnline) void separateFile(file); }}>
              <div>
                <strong>{attachedFileName ? `Project source: ${attachedFileName}` : "Drop a mix here"}</strong>
                <p>WAV, MP3, FLAC, M4A, or AIFF. Core 6 returns vocals, drums, bass, guitar, piano, other, and an instrumental mixdown.</p>
                <div className="sl-actions" style={{ justifyContent: "center" }}>
                  <button className="sl-button" onClick={() => fileRef.current?.click()} disabled={busy || !workerOnline}>Choose audio</button>
                  <button className="sl-button secondary" onClick={() => void separateDemo()} disabled={busy || !workerOnline}>Run test mix</button>
                </div>
                <input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff" style={{ display: "none" }} onChange={(event) => { const file = event.target.files?.[0]; if (file) void separateFile(file); }} />
              </div>
            </div>
          </div>

          <div className="sl-panel">
            <div className="sl-panel-head"><div><h2>Job inspector</h2><p>Real metadata returned by the worker.</p></div></div>
            {!manifest ? <div className="sl-empty"><div><strong>No job yet.</strong><p>Upload audio or run the saved source.</p></div></div> : (
              <div className="sl-info-list">
                <div className="sl-info-row"><span>Source</span><strong>{manifest.source.filename}</strong></div>
                <div className="sl-info-row"><span>Model</span><strong>{manifest.model}</strong></div>
                <div className="sl-info-row"><span>Duration</span><strong>{manifest.durationSec}s</strong></div>
                <div className="sl-info-row"><span>Format</span><strong>{manifest.sampleRate / 1000} kHz · {manifest.channels}ch</strong></div>
                <div className="sl-info-row"><span>Core stems</span><strong>{mixableStems.length}</strong></div>
                <div className="sl-info-row"><span>Recon error</span><strong>{manifest.alignment.reconErrorDb} dB</strong></div>
                <div className="sl-info-row"><span>Job</span><span className="sl-mono">{manifest.jobId}</span></div>
                {manifest.zipUrl && <a className="sl-link-button" href={`${SEPARATOR_URL}${manifest.zipUrl}`} download="Organized_Stems.zip">Download organized ZIP</a>}
              </div>
            )}
          </div>
        </section>

        <section className="sl-workspace">
          <section className="sl-panel">
            <div className="sl-panel-head"><div><h2>Core 6 mixer</h2><p>Synchronized, non-overlapping stems from the real worker.</p></div><span className="sl-badge">{player.stems.length} channels loaded</span></div>
            {player.stems.length === 0 ? <div className="sl-empty"><div><strong>No channels loaded.</strong><p>Run a separation first.</p></div></div> : (
              <>
                <div className="sl-mixer-actions"><button className="sl-button" onClick={player.play} disabled={player.isLoading}>▶ Play</button><button className="sl-button secondary" onClick={player.stop}>■ Stop</button><button className="sl-button secondary" onClick={player.karaoke}>Instrumental</button><button className="sl-button secondary" onClick={player.acapella}>Vocals only</button><button className="sl-button secondary" onClick={player.reset}>Reset mix</button></div>
                <div className="sl-mixer">{player.stems.map((ui) => { const meta = stemMeta(ui.name); return <article className="sl-channel" key={ui.name}><h3>{meta?.label ?? ui.name}</h3><div className="sl-channel-meta">{meta?.family ?? "Core 6"} · {meta?.integratedDb ?? "—"} dB<br/><span className="sl-mono">{meta?.file ?? ""}</span></div><div className="sl-channel-controls"><button className={`sl-pill ${ui.solo ? "active-solo" : ""}`} onClick={() => player.setSolo(ui.name, !ui.solo)}>Solo</button><button className={`sl-pill ${ui.muted ? "active-mute" : ""}`} onClick={() => player.setMuted(ui.name, !ui.muted)}>Mute</button></div><input type="range" min={0} max={1} step={0.01} value={ui.gain} onChange={(event) => player.setGain(ui.name, Number(event.target.value))} aria-label={`${ui.name} gain`} /></article>; })}</div>
              </>
            )}
          </section>

          <section className="sl-panel">
            <div className="sl-panel-head"><div><h2>Outputs + QA</h2><p>Preview, verify names/families, and download individual files.</p></div>{manifest && <span className="sl-badge">recon {manifest.alignment.reconErrorDb} dB</span>}</div>
            {!manifest ? <div className="sl-empty"><div><strong>Nothing to inspect yet.</strong><p>Separated outputs appear here.</p></div></div> : (
              <div className="sl-output-list">{manifest.stems.map((stem) => <article className="sl-output" key={`${stem.name}-${stem.url}`}><div className="sl-output-head"><div><h3>{stem.label ?? stem.name}</h3><p>{stem.family ?? stem.group ?? "Core"} · {stem.integratedDb} dB</p><div className="sl-mono">{stem.file ?? stem.url}</div></div><a className="sl-download" href={`${SEPARATOR_URL}${stem.url}`} download={stem.downloadName ?? true}>Download WAV</a></div><audio controls preload="none" src={`${SEPARATOR_URL}${stem.url}`} /></article>)}</div>
            )}
          </section>
        </section>
      </div>
      <div className="sl-footer-status" aria-live="polite">{busy || player.isLoading ? "Working · " : ""}{status}</div>
    </main>
  );
}
