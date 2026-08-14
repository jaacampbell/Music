"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ProducerDnaPanel } from "@/app/components/ProducerDnaPanel";
import { analyzeAudioFile } from "@/lib/browser-audio-analysis";
import {
  attachProjectAudio,
  getProjectAudio,
  loadActiveProjectId,
  loadSeparationSnapshot,
  loadStoredProjects,
  saveActiveProjectId,
  saveSeparationSnapshot,
  saveStoredProjects
} from "@/lib/browser-project-storage";
import type { LiveAudioAnalysis, Project, SourceAudioAttachment } from "@/lib/types";
import "./beatLab.css";

const SEPARATOR_URL = process.env.NEXT_PUBLIC_SEPARATOR_URL ?? "http://localhost:8000";

const TABS = [
  "Song Brief",
  "Song DNA",
  "Producer DNA",
  "Prompt Pack",
  "Generations",
  "Stem Library",
  "Beat Breakdown",
  "Scorecards",
  "Mix Notes",
  "Revision Loop",
  "Final Export",
  "History"
] as const;

type TabName = (typeof TABS)[number];

interface WorkerHealth {
  status: string;
  version: string;
  coreModel: string;
  deepTargetCount: number;
  samAudio: {
    installed: boolean;
    model: string;
    cudaAvailable: boolean;
    hfTokenPresent: boolean;
  };
}

interface LiveStem {
  name: string;
  label?: string;
  family?: string;
  group?: string;
  file?: string;
  downloadName?: string;
  url: string;
  integratedDb: number;
  engine?: string;
  mixable?: boolean;
}

interface LiveManifest {
  jobId: string;
  source: { filename: string };
  model: string;
  device?: string;
  mode: "core" | "deep";
  sampleRate: number;
  channels: number;
  durationSec: number;
  stems: LiveStem[];
  zipUrl?: string;
  alignment: { reconErrorDb: number; note: string };
  warnings: string[];
}

const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string; detail?: string };
    throw new Error(error.error ?? error.detail ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function HomePage(): React.JSX.Element {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("Song Brief");
  const [titleInput, setTitleInput] = useState("Location Drop");
  const [briefInput, setBriefInput] = useState(
    "Dark melodic rap at 98 BPM with trap-soul bounce, smooth 808s, and hotel hallway tension."
  );
  const [commandInput, setCommandInput] = useState(
    "Build a production strategy, evaluate the song, and prepare a DAW handoff plan."
  );
  const [mixNotesInput, setMixNotesInput] = useState("");
  const [revisionInput, setRevisionInput] = useState("");
  const [exportPlanInput, setExportPlanInput] = useState("");
  const [statusText, setStatusText] = useState("Loading production workspace…");
  const [cacheEntries, setCacheEntries] = useState(0);
  const [busy, setBusy] = useState(false);
  const [workerHealth, setWorkerHealth] = useState<WorkerHealth | null>(null);
  const [liveManifest, setLiveManifest] = useState<LiveManifest | null>(null);
  const [liveBusy, setLiveBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const refreshProjects = async (preferredId?: string | null): Promise<Project[]> => {
    const data = await api<{ projects: Project[] }>("/api/projects");
    setProjects(data.projects);
    saveStoredProjects(data.projects);
    const requested = preferredId ?? activeProjectId ?? loadActiveProjectId();
    if (requested && data.projects.some((project) => project.id === requested)) {
      setActiveProjectId(requested);
    } else if (data.projects.length > 0) {
      setActiveProjectId(data.projects[0].id);
    }
    return data.projects;
  };

  const loadCacheStats = async (): Promise<void> => {
    const data = await api<{ cache: { entries: number } }>("/api/cache/stats");
    setCacheEntries(data.cache.entries);
  };

  const loadWorkerHealth = async (): Promise<void> => {
    try {
      const response = await fetch(`${SEPARATOR_URL}/health`);
      if (!response.ok) throw new Error("worker offline");
      setWorkerHealth((await response.json()) as WorkerHealth);
    } catch {
      setWorkerHealth(null);
    }
  };

  useEffect(() => {
    void (async () => {
      const stored = loadStoredProjects();
      if (stored.length > 0) {
        try {
          await api<{ imported: number }>("/api/projects/import", {
            method: "POST",
            body: JSON.stringify({ projects: stored })
          });
        } catch {
          setStatusText("Could not restore saved projects to the server session; local copies are still safe.");
        }
      }
      try {
        await Promise.all([refreshProjects(loadActiveProjectId()), loadCacheStats(), loadWorkerHealth()]);
        setStatusText(stored.length > 0 ? `Restored ${stored.length} saved project${stored.length === 1 ? "" : "s"}.` : "Ready.");
      } catch (error) {
        setProjects(stored);
        if (stored.length > 0) setActiveProjectId(loadActiveProjectId() ?? stored[0].id);
        setStatusText(error instanceof Error ? error.message : "Workspace initialization failed.");
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    saveActiveProjectId(activeProjectId);
    if (!activeProjectId) {
      setLiveManifest(null);
      return;
    }
    void loadSeparationSnapshot<LiveManifest>(activeProjectId, "core").then(setLiveManifest);
  }, [activeProjectId]);

  useEffect(() => {
    if (!selectedProject) return;
    setBriefInput(selectedProject.brief);
    setMixNotesInput(selectedProject.mixNotes);
    setRevisionInput(selectedProject.revisionPrompt);
    setExportPlanInput(selectedProject.exportPlan);
  }, [selectedProject?.id]);

  const withBusy = async (task: () => Promise<string | null | void>): Promise<void> => {
    setBusy(true);
    try {
      const preferred = await task();
      await Promise.all([refreshProjects(typeof preferred === "string" ? preferred : undefined), loadCacheStats()]);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const createProject = async (): Promise<void> =>
    withBusy(async () => {
      const data = await api<{ project: Project }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ title: titleInput, brief: briefInput })
      });
      setStatusText(`Project created: ${data.project.title}. It will be restored from this browser on future visits.`);
      return data.project.id;
    });

  const runAgentLoop = async (): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      const data = await api<{
        result: { decision: { stemMode: number; modelProfile: string }; jobIds: string[] };
      }>("/api/agent/run", {
        method: "POST",
        body: JSON.stringify({ projectId: selectedProject.id, command: commandInput })
      });
      setStatusText(
        `Planning loop completed: ${data.result.jobIds.length} modeled jobs · ${data.result.decision.modelProfile}.`
      );
      return selectedProject.id;
    });
  };

  const runMultitask = async (): Promise<void> => {
    if (!selectedProject) return;
    const commands = commandInput.split("\n").map((value) => value.trim()).filter(Boolean);
    if (commands.length === 0) {
      setStatusText("Add one planning command per line to run a batch.");
      return;
    }
    await withBusy(async () => {
      const data = await api<{
        result: { totalCommands: number; totalJobs: number; totalTokensSaved: number };
      }>("/api/agent/multitask", {
        method: "POST",
        body: JSON.stringify({ projectId: selectedProject.id, commands })
      });
      setStatusText(
        `Planning batch finished: ${data.result.totalCommands} commands · ${data.result.totalJobs} modeled jobs · ${data.result.totalTokensSaved} cached tokens.`
      );
      return selectedProject.id;
    });
  };

  const saveState = async (): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      await api<{ project: Project }>(`/api/projects/${selectedProject.id}/state`, {
        method: "PATCH",
        body: JSON.stringify({
          brief: briefInput,
          mixNotes: mixNotesInput,
          revisionPrompt: revisionInput,
          exportPlan: exportPlanInput
        })
      });
      setStatusText("Project notes saved and copied to browser persistence.");
      return selectedProject.id;
    });
  };

  const attachAndSeparate = async (file: File): Promise<void> => {
    if (!selectedProject) {
      setStatusText("Create or select a project before attaching audio.");
      return;
    }

    setLiveBusy(true);
    setStatusText(`Saving ${file.name}, analyzing the audio, and running Core 6…`);
    try {
      await attachProjectAudio(selectedProject.id, file);

      const form = new FormData();
      form.append("file", file);
      form.append("mode", "core");
      form.append("targets", "[]");

      const [analysis, response] = await Promise.all([
        analyzeAudioFile(file),
        fetch(`${SEPARATOR_URL}/separate`, { method: "POST", body: form })
      ]);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `Live separator failed (${response.status})`);
      }

      const manifest = (await response.json()) as LiveManifest;
      const source: SourceAudioAttachment = {
        name: file.name,
        size: file.size,
        type: file.type || "audio/*",
        lastModified: file.lastModified,
        attachedAt: new Date().toISOString(),
        storage: "browser-indexeddb"
      };

      await api<{ project: Project }>(`/api/projects/${selectedProject.id}/live-audio`, {
        method: "POST",
        body: JSON.stringify({
          source,
          analysis,
          stems: manifest.stems,
          mode: "core",
          model: manifest.model,
          zipUrl: manifest.zipUrl
        })
      });

      await saveSeparationSnapshot(selectedProject.id, "core", manifest);
      setLiveManifest(manifest);
      await refreshProjects(selectedProject.id);
      setActiveTab("Stem Library");
      setStatusText(
        `Real audio saved · ${analysis.bpm ?? "?"} BPM · ${analysis.key ?? "key pending"} · ${manifest.stems.length} outputs.`
      );
      await loadWorkerHealth();
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Live separation failed");
    } finally {
      setLiveBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const rerunAttachedAudio = async (): Promise<void> => {
    if (!selectedProject) return;
    const file = await getProjectAudio(selectedProject.id);
    if (!file) {
      setStatusText("The saved source file is not available in this browser. Attach it again.");
      return;
    }
    await attachAndSeparate(file);
  };

  const renderStemLibrary = (): React.JSX.Element => {
    if (!liveManifest) {
      return (
        <div className="abl-empty">
          <div>
            <strong>No real stems saved for this project yet.</strong>
            <p>Attach the song above to run Core 6. The source file is kept in this browser for re-runs.</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="abl-panel-head">
          <div>
            <h2>Real stem library</h2>
            <p>
              {liveManifest.source.filename} · {liveManifest.durationSec}s · {liveManifest.sampleRate / 1000} kHz · {liveManifest.model}
            </p>
          </div>
          {liveManifest.zipUrl && (
            <a className="abl-link-button secondary" href={`${SEPARATOR_URL}${liveManifest.zipUrl}`} download="Organized_Stems.zip">
              Download organized ZIP
            </a>
          )}
        </div>
        <div className="abl-live-stems">
          {liveManifest.stems.map((stem) => (
            <article className="abl-stem-card" key={`${stem.name}-${stem.url}`}>
              <div className="abl-stem-card-head">
                <div>
                  <h3>{stem.label ?? stem.name}</h3>
                  <div className="abl-muted" style={{ fontSize: ".78rem", marginTop: ".2rem" }}>
                    {stem.family ?? stem.group ?? "Core"} · {stem.integratedDb} dB
                  </div>
                </div>
                <a className="abl-download" href={`${SEPARATOR_URL}${stem.url}`} download={stem.downloadName ?? true}>WAV</a>
              </div>
              <div className="abl-mono" style={{ marginTop: ".5rem" }}>{stem.file ?? stem.url}</div>
              <audio controls preload="none" src={`${SEPARATOR_URL}${stem.url}`} />
            </article>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = (): React.JSX.Element => {
    if (activeTab === "Producer DNA") return <ProducerDnaPanel />;
    if (!selectedProject) {
      return <div className="abl-empty"><div><strong>No project selected.</strong><p>Create a project to start the production workflow.</p></div></div>;
    }

    switch (activeTab) {
      case "Song Brief":
        return (
          <div className="abl-content-grid">
            <div className="abl-card"><h3>Song brief</h3><p>{selectedProject.brief}</p></div>
            <div className="abl-card">
              <h3>Project state</h3>
              <p className="abl-muted">{selectedProject.sourceAudio ? `Audio attached: ${selectedProject.sourceAudio.name}` : "No source audio attached yet."}</p>
              <div className="abl-mono">Prompt cache entries: {cacheEntries}</div>
            </div>
          </div>
        );
      case "Song DNA": {
        const analysis = selectedProject.liveAnalysis;
        return (
          <div className="abl-content-grid">
            <div className="abl-card">
              <h3>{analysis ? "Measured audio DNA" : "Brief-derived starting DNA"}</h3>
              <p className="abl-muted">BPM {selectedProject.songDna.bpm ?? "—"} · Key {selectedProject.songDna.key ?? "—"}</p>
              {analysis && (
                <div className="abl-mono">
                  BPM confidence {(analysis.bpmConfidence * 100).toFixed(0)}% · key confidence {(analysis.keyConfidence * 100).toFixed(0)}%{"\n"}
                  RMS {analysis.rmsDb} dB · peak {analysis.peakDb} dB · {analysis.sampleRate / 1000} kHz · {analysis.channels}ch{"\n"}
                  {analysis.engine}
                </div>
              )}
            </div>
            <div className="abl-card"><h3>Palette / structure</h3><ul className="abl-list">{selectedProject.songDna.palette.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
        );
      }
      case "Prompt Pack":
        return <div className="abl-card"><h3>Prompt directions</h3>{selectedProject.promptPack.length ? <ul className="abl-list">{selectedProject.promptPack.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul> : <p className="abl-muted">Run the planning loop first.</p>}</div>;
      case "Generations":
        return <div className="abl-content-grid">{selectedProject.generations.length ? selectedProject.generations.map((generation) => <div className="abl-card" key={generation.id}><h3>{generation.name} {generation.selected ? "✓" : ""}</h3><p className="abl-muted">{generation.strategy} · modeled score {generation.score}</p><div className="abl-mono">Strengths: {generation.strengths.join(", ")}{"\n"}Weaknesses: {generation.weaknesses.join(", ")}</div></div>) : <div className="abl-card"><p className="abl-muted">No modeled generations yet.</p></div>}</div>;
      case "Stem Library":
        return renderStemLibrary();
      case "Beat Breakdown":
        return <div className="abl-content-grid"><div className="abl-card"><h3>Markers</h3><ul className="abl-list">{selectedProject.manifest.markers.map((marker) => <li key={`${marker.bar}-${marker.label}`}>Bar {marker.bar}: {marker.label}</li>)}</ul></div><div className="abl-card"><h3>Chord map</h3><ul className="abl-list">{selectedProject.manifest.chords.map((chord) => <li key={`${chord.bar}-${chord.chord}`}>Bar {chord.bar}: {chord.chord}</li>)}</ul></div></div>;
      case "Scorecards":
        return <div className="abl-content-grid">{selectedProject.scorecards.length ? selectedProject.scorecards.map((score) => <div className="abl-card" key={score.id}><h3>{score.summary}</h3><p className="abl-muted">Emotion {score.emotionalAlignment}/10 · Originality {score.originality}/10 · Release {score.releaseReadiness}/10</p></div>) : <div className="abl-card"><p className="abl-muted">Run the planning loop to create modeled A&R scorecards.</p></div>}</div>;
      case "Mix Notes":
        return <div className="abl-card"><h3>Mix notes</h3><p>{selectedProject.mixNotes || "No mix notes yet."}</p></div>;
      case "Revision Loop":
        return <div className="abl-card"><h3>Current revision direction</h3><p>{selectedProject.revisionPrompt || "No revision direction yet."}</p></div>;
      case "Final Export":
        return (
          <div className="abl-content-grid">
            <div className="abl-card"><h3>DAW handoff plan</h3><p>{selectedProject.exportPlan || "Save your project plan and use the organized stem ZIP as the real audio handoff."}</p></div>
            <div className="abl-card"><h3>Real audio export</h3>{liveManifest?.zipUrl ? <a className="abl-link-button" href={`${SEPARATOR_URL}${liveManifest.zipUrl}`} download="Organized_Stems.zip">Download organized stems</a> : <p className="abl-muted">Run Core 6 first.</p>}</div>
          </div>
        );
      case "History":
        return (
          <div className="abl-card">
            <h3>Project history</h3>
            {selectedProject.history.length === 0 ? <p className="abl-muted">No history yet.</p> : (
              <ul className="abl-list">
                {selectedProject.history.slice().reverse().map((entry) => (
                  <li key={entry.id}><strong>{new Date(entry.createdAt).toLocaleString()}</strong> · {entry.message}</li>
                ))}
              </ul>
            )}
          </div>
        );
      default:
        return <div />;
    }
  };

  const projectQuery = selectedProject ? `?projectId=${encodeURIComponent(selectedProject.id)}` : "";
  const workerOnline = workerHealth?.status === "ok";
  const deepReady = workerHealth?.samAudio.installed === true;

  return (
    <main className="abl-shell">
      <div className="abl-wrap">
        <header className="abl-topbar">
          <div className="abl-brand"><span className="abl-mark">A</span><span>Agentic Beat Lab OS</span></div>
          <nav className="abl-nav">
            <Link href={`/stem-lab${projectQuery}`}>Stem Lab</Link>
            <Link href={`/stem-studio${projectQuery}`}>Stem Studio 60+</Link>
          </nav>
        </header>

        <section className="abl-hero">
          <div className="abl-hero-main">
            <p className="abl-kicker">Production command center</p>
            <h1>One project. Real audio. Planning, stems, QA, and handoff.</h1>
            <p className="abl-lede">Projects now restore from this browser, source audio is kept in IndexedDB, measured BPM/key can replace brief guesses, and real separator output is written back into the same project.</p>
            <div className="abl-chips"><span className="abl-chip">Browser-persistent projects</span><span className="abl-chip">Real audio analysis</span><span className="abl-chip">Core 6 live</span><span className="abl-chip">Deep 60+ handoff</span></div>
          </div>
          <aside className="abl-panel abl-reality">
            <div className="abl-reality-card"><strong><span className={`abl-dot ${workerOnline ? "live" : ""}`} /> Live separator</strong><p>{workerOnline ? `${workerHealth?.coreModel} worker connected.` : "Worker not detected. Planning still works; audio separation does not."}</p></div>
            <div className="abl-reality-card"><strong><span className="abl-dot live" /> Project persistence</strong><p>Project JSON uses localStorage and source files use IndexedDB. This survives refreshes and server cold starts on this browser.</p></div>
            <div className="abl-reality-card"><strong><span className="abl-dot plan" /> Producer/A&R layer</strong><p>Still a deterministic planning engine. It does not generate finished audio yet.</p></div>
            <div className="abl-reality-card"><strong><span className={`abl-dot ${deepReady ? "live" : ""}`} /> Deep 60+</strong><p>{deepReady ? "Deep target engine detected." : "Requires the GPU deep-isolation worker."}</p></div>
          </aside>
        </section>

        <section className="abl-workflow">
          {[["01", "Create/select project", "Everything stays attached to one production record."],["02", "Attach the actual song", "The browser saves the source file and measures the audio."],["03", "Separate + inspect", "Core 6 is real; Stem Lab handles synchronized QA."],["04", "Go deeper + export", "Stem Studio performs Deep 60+ and organized handoff."]].map(([number, title, copy]) => <div className="abl-step" key={number}><span className="abl-step-number">{number}</span><strong>{title}</strong><p>{copy}</p></div>)}
        </section>

        <section className="abl-command-grid">
          <section className="abl-panel">
            <div className="abl-panel-head"><div><h2>Project + production plan</h2><p>Planning state is saved back into the selected project.</p></div></div>
            <div className="abl-form-grid">
              <label className="abl-label">Project title<input className="abl-input" value={titleInput} onChange={(event) => setTitleInput(event.target.value)} /></label>
              <label className="abl-label">Song brief<textarea className="abl-textarea" value={briefInput} onChange={(event) => setBriefInput(event.target.value)} /></label>
              <label className="abl-label">Agent command<textarea className="abl-textarea" value={commandInput} onChange={(event) => setCommandInput(event.target.value)} placeholder="One command, or one per line for batch." /></label>
              <label className="abl-label">Mix notes<textarea className="abl-textarea" value={mixNotesInput} onChange={(event) => setMixNotesInput(event.target.value)} /></label>
            </div>
            <div className="abl-actions">
              <button className="abl-button" onClick={() => void createProject()} disabled={busy || !titleInput.trim()}>Create project</button>
              <button className="abl-button secondary" onClick={() => void runAgentLoop()} disabled={busy || !selectedProject}>Run planning loop</button>
              <button className="abl-button secondary" onClick={() => void runMultitask()} disabled={busy || !selectedProject}>Batch planning</button>
              <button className="abl-button secondary" onClick={() => void saveState()} disabled={busy || !selectedProject}>Save state</button>
            </div>
          </section>

          <section className="abl-panel">
            <div className="abl-panel-head"><div><h2>Attach real audio</h2><p>{selectedProject ? `Attach to ${selectedProject.title}` : "Select a project first."}</p></div></div>
            <div className="abl-upload" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) void attachAndSeparate(file); }}>
              <div>
                <strong>{selectedProject?.sourceAudio ? selectedProject.sourceAudio.name : "Drop WAV, MP3, FLAC, M4A or AIFF"}</strong>
                <p>{selectedProject?.sourceAudio ? `${formatBytes(selectedProject.sourceAudio.size)} saved in this browser.` : "The source stays attached to this project for future re-runs."}</p>
                <button className="abl-button" onClick={() => fileRef.current?.click()} disabled={!selectedProject || liveBusy}>{liveBusy ? "Analyzing + separating…" : selectedProject?.sourceAudio ? "Replace source audio" : "Choose audio"}</button>
                {selectedProject?.sourceAudio && <button className="abl-button secondary" style={{ marginLeft: ".45rem" }} onClick={() => void rerunAttachedAudio()} disabled={liveBusy}>Re-run saved source</button>}
              </div>
              <input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff" style={{ display: "none" }} onChange={(event) => { const file = event.target.files?.[0]; if (file) void attachAndSeparate(file); }} />
            </div>
          </section>
        </section>

        <section className="abl-main-grid">
          <aside className="abl-panel abl-sidebar">
            <div className="abl-project-meta">
              <label className="abl-label">Project<select className="abl-select" value={activeProjectId ?? ""} onChange={(event) => setActiveProjectId(event.target.value || null)}><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
              <div className="abl-muted" style={{ marginTop: ".55rem", fontSize: ".8rem" }}>{hydrated ? `${projects.length} saved project${projects.length === 1 ? "" : "s"}` : "Restoring…"}</div>
            </div>
            <div className="abl-tab-list">{TABS.map((tab) => <button key={tab} className={`abl-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
          </aside>
          <section className="abl-panel abl-content">{renderContent()}</section>
        </section>
      </div>

      <div className="abl-status" aria-live="polite">{busy || liveBusy ? "Working · " : ""}{statusText}</div>
    </main>
  );
}
