"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ProducerDnaPanel } from "@/app/components/ProducerDnaPanel";
import type { Project } from "@/lib/types";
import "./beatLab.css";

const SEPARATOR_URL =
  process.env.NEXT_PUBLIC_SEPARATOR_URL ?? "http://localhost:8000";

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
  "Final Export"
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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
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
  const [statusText, setStatusText] = useState("Ready");
  const [cacheEntries, setCacheEntries] = useState(0);
  const [busy, setBusy] = useState(false);
  const [workerHealth, setWorkerHealth] = useState<WorkerHealth | null>(null);
  const [liveManifest, setLiveManifest] = useState<LiveManifest | null>(null);
  const [liveBusy, setLiveBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const loadProjects = async (): Promise<void> => {
    const data = await api<{ projects: Project[] }>("/api/projects");
    setProjects(data.projects);
    if (!activeProjectId && data.projects.length > 0) {
      setActiveProjectId(data.projects[0].id);
    }
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
    void Promise.all([loadProjects(), loadCacheStats()]);
    void loadWorkerHealth();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setBriefInput(selectedProject.brief);
    setMixNotesInput(selectedProject.mixNotes);
    setRevisionInput(selectedProject.revisionPrompt);
    setExportPlanInput(selectedProject.exportPlan);
  }, [selectedProject?.id]);

  const withBusy = async (task: () => Promise<void>): Promise<void> => {
    setBusy(true);
    try {
      await task();
      await Promise.all([loadProjects(), loadCacheStats()]);
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
      setActiveProjectId(data.project.id);
      setStatusText(`Project created: ${data.project.title}. Planning workspace is ready.`);
    });

  const runAgentLoop = async (): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      const data = await api<{
        result: { decision: { stemMode: number; modelProfile: string }; jobIds: string[] };
      }>("/api/agent/run", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProject.id,
          command: commandInput
        })
      });
      setStatusText(
        `Planning loop completed: ${data.result.jobIds.length} modeled jobs · stem plan ${data.result.decision.stemMode} · ${data.result.decision.modelProfile}.`
      );
    });
  };

  const runMultitask = async (): Promise<void> => {
    if (!selectedProject) return;
    const commands = commandInput
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    if (commands.length === 0) {
      setStatusText("Add one planning command per line to run a batch.");
      return;
    }
    await withBusy(async () => {
      const data = await api<{
        result: { totalCommands: number; totalJobs: number; totalTokensSaved: number };
      }>("/api/agent/multitask", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProject.id,
          commands
        })
      });
      setStatusText(
        `Planning batch finished: ${data.result.totalCommands} commands · ${data.result.totalJobs} modeled jobs · ${data.result.totalTokensSaved} cached tokens.`
      );
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
      setStatusText("Project state saved for this running app session.");
    });
  };

  const separateLiveAudio = async (file: File): Promise<void> => {
    setLiveBusy(true);
    setStatusText(`Uploading ${file.name} to the live Core 6 separator…`);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mode", "core");
      form.append("targets", "[]");
      const response = await fetch(`${SEPARATOR_URL}/separate`, {
        method: "POST",
        body: form
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `Live separator failed (${response.status})`);
      }
      const manifest = (await response.json()) as LiveManifest;
      setLiveManifest(manifest);
      setActiveTab("Stem Library");
      setStatusText(
        `Live audio ready: ${manifest.stems.length} outputs · ${manifest.model} · ${manifest.durationSec}s.`
      );
      await loadWorkerHealth();
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Live separation failed");
    } finally {
      setLiveBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const renderLiveStemLibrary = (): React.JSX.Element => {
    if (!liveManifest) {
      return (
        <div className="abl-empty">
          <div>
            <strong>No live audio loaded yet.</strong>
            <p>Use the Live Audio panel above. That sends an actual audio file to the separator worker.</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="abl-panel-head">
          <div>
            <h2>Live stem library</h2>
            <p>
              {liveManifest.source.filename} · {liveManifest.durationSec}s · {liveManifest.sampleRate / 1000} kHz · {liveManifest.model}
            </p>
          </div>
          {liveManifest.zipUrl && (
            <a
              className="abl-link-button secondary"
              href={`${SEPARATOR_URL}${liveManifest.zipUrl}`}
              download="Stem_Studio_Organized_Stems.zip"
            >
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
                <a
                  className="abl-download"
                  href={`${SEPARATOR_URL}${stem.url}`}
                  download={stem.downloadName ?? true}
                >
                  WAV
                </a>
              </div>
              <div className="abl-mono" style={{ marginTop: ".5rem" }}>{stem.file ?? stem.url}</div>
              <audio controls preload="none" src={`${SEPARATOR_URL}${stem.url}`} />
            </article>
          ))}
        </div>
        <div className="abl-card" style={{ marginTop: ".75rem" }}>
          <strong>Core reconstruction</strong>
          <p className="abl-muted" style={{ marginBottom: 0 }}>
            Error {liveManifest.alignment.reconErrorDb} dB. {liveManifest.alignment.note}
          </p>
        </div>
      </div>
    );
  };

  const renderMainContent = (): React.JSX.Element => {
    if (activeTab === "Producer DNA") {
      return <ProducerDnaPanel />;
    }

    if (activeTab === "Stem Library" && liveManifest) {
      return renderLiveStemLibrary();
    }

    if (!selectedProject) {
      if (activeTab === "Stem Library") return renderLiveStemLibrary();
      return (
        <div className="abl-empty">
          <div>
            <strong>No planning project selected.</strong>
            <p>Create a project above, or upload audio if you only need live stem separation.</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "Song Brief":
        return (
          <div className="abl-content-grid">
            <div className="abl-card">
              <h3>Song brief</h3>
              <p>{selectedProject.brief}</p>
            </div>
            <div className="abl-card">
              <h3>Planning command</h3>
              <p className="abl-muted">{commandInput}</p>
              <div className="abl-mono">Prompt cache entries: {cacheEntries}</div>
            </div>
          </div>
        );
      case "Song DNA":
        return (
          <div className="abl-content-grid">
            <div className="abl-card">
              <h3>Core profile</h3>
              <p className="abl-muted">
                BPM {selectedProject.songDna.bpm} · Key {selectedProject.songDna.key} · Vocal space {selectedProject.songDna.vocalSpace}
              </p>
              <div className="abl-chips">
                {selectedProject.songDna.mood.map((value) => (
                  <span className="abl-chip" key={value}>{value}</span>
                ))}
              </div>
            </div>
            <div className="abl-card">
              <h3>Palette / structure</h3>
              <ul className="abl-list">
                {selectedProject.songDna.palette.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        );
      case "Prompt Pack":
        return (
          <div className="abl-card">
            <h3>Prompt variants</h3>
            {selectedProject.promptPack.length === 0 ? (
              <p className="abl-muted">Run the planning loop to create prompt directions.</p>
            ) : (
              <ul className="abl-list">
                {selectedProject.promptPack.map((prompt) => <li key={prompt}>{prompt}</li>)}
              </ul>
            )}
          </div>
        );
      case "Generations":
        return (
          <div className="abl-content-grid">
            {selectedProject.generations.length === 0 && (
              <div className="abl-card"><p className="abl-muted">No modeled generations yet. Run the planning loop.</p></div>
            )}
            {selectedProject.generations.map((generation) => (
              <div className="abl-card" key={generation.id}>
                <h3>{generation.name} {generation.selected ? "✓" : ""}</h3>
                <p className="abl-muted">{generation.strategy} · modeled score {generation.score}</p>
                <div className="abl-mono">
                  Strengths: {generation.strengths.join(", ")}{"\n"}
                  Weaknesses: {generation.weaknesses.join(", ")}
                </div>
              </div>
            ))}
          </div>
        );
      case "Stem Library":
        return renderLiveStemLibrary();
      case "Beat Breakdown":
        return (
          <div className="abl-content-grid">
            <div className="abl-card">
              <h3>Planned markers</h3>
              <ul className="abl-list">
                {selectedProject.manifest.markers.map((marker) => (
                  <li key={`${marker.bar}-${marker.label}`}>Bar {marker.bar}: {marker.label}</li>
                ))}
              </ul>
            </div>
            <div className="abl-card">
              <h3>Planned chord map</h3>
              <ul className="abl-list">
                {selectedProject.manifest.chords.map((chord) => (
                  <li key={`${chord.bar}-${chord.chord}`}>Bar {chord.bar}: {chord.chord}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      case "Scorecards":
        return (
          <div className="abl-content-grid">
            {selectedProject.scorecards.length === 0 && (
              <div className="abl-card"><p className="abl-muted">No modeled scorecards yet. Run the planning loop.</p></div>
            )}
            {selectedProject.scorecards.map((score) => (
              <div className="abl-card" key={score.id}>
                <h3>{score.summary}</h3>
                <p className="abl-muted">
                  Emotion {score.emotionalAlignment}/10 · Originality {score.originality}/10 · Release {score.releaseReadiness}/10
                </p>
              </div>
            ))}
          </div>
        );
      case "Mix Notes":
        return (
          <div className="abl-card">
            <h3>Mix notes</h3>
            <p>{selectedProject.mixNotes || "No notes yet."}</p>
          </div>
        );
      case "Revision Loop":
        return (
          <div className="abl-card">
            <h3>Revision prompt</h3>
            <p>{selectedProject.revisionPrompt || "No revision prompt generated yet."}</p>
            <div className="abl-mono">
              Last telemetry: {selectedProject.promptTelemetry.length > 0
                ? JSON.stringify(selectedProject.promptTelemetry[selectedProject.promptTelemetry.length - 1])
                : "none"}
            </div>
          </div>
        );
      case "Final Export":
        return (
          <div className="abl-content-grid">
            <div className="abl-card">
              <h3>DAW handoff plan</h3>
              <p>{selectedProject.exportPlan || "No planned export yet."}</p>
              <p className="abl-muted">Planning artifacts below are metadata contracts, not downloadable audio files.</p>
            </div>
            <div className="abl-card">
              <h3>Live audio export</h3>
              {liveManifest?.zipUrl ? (
                <a className="abl-link-button" href={`${SEPARATOR_URL}${liveManifest.zipUrl}`} download>
                  Download real organized stem ZIP
                </a>
              ) : (
                <p className="abl-muted">Upload a track above to create a real downloadable stem package.</p>
              )}
            </div>
            <div className="abl-card">
              <h3>Planned artifacts</h3>
              <ul className="abl-list">
                {selectedProject.manifest.exports.length === 0 && <li>No modeled exports yet.</li>}
                {selectedProject.manifest.exports.map((artifact) => (
                  <li key={artifact.id}>{artifact.type} ({artifact.files.length} planned files)</li>
                ))}
              </ul>
            </div>
          </div>
        );
      default:
        return <div />;
    }
  };

  const workerOnline = workerHealth?.status === "ok";
  const deepReady = workerHealth?.samAudio.installed === true;

  return (
    <main className="abl-shell">
      <div className="abl-wrap">
        <nav className="abl-topbar" aria-label="Music OS navigation">
          <div className="abl-brand"><span className="abl-mark">A</span> Agentic Beat Lab OS</div>
          <div className="abl-nav">
            <a href="/">Command Center</a>
            <a href="/stem-lab">Stem Lab</a>
            <a href="/stem-studio">Stem Studio 60+</a>
          </div>
        </nav>

        <section className="abl-hero">
          <div className="abl-hero-main">
            <p className="abl-kicker">Production command center</p>
            <h1>Plan the record. Separate the audio. Move it into the DAW.</h1>
            <p className="abl-lede">
              The OS now makes a hard distinction between its planning layer and the live audio layer. Strategy, prompt packs, modeled scorecards, and revision planning happen in the command center; actual stem audio is created by the same separator worker that powers Stem Studio.
            </p>
            <div className="abl-chips">
              <span className="abl-chip">11 workflow views</span>
              <span className="abl-chip">Real Core 6 audio</span>
              <span className="abl-chip">60+ deep stems in Studio</span>
              <span className="abl-chip">Organized DAW ZIP</span>
            </div>
          </div>

          <aside className="abl-panel abl-reality">
            <div className="abl-panel-head"><div><h3>What is actually live?</h3><p>Reality map for this build.</p></div></div>
            <div className="abl-reality-card">
              <strong><span className={`abl-dot ${workerOnline ? "live" : ""}`} /> Audio separator</strong>
              <p>{workerOnline ? `${workerHealth?.coreModel} worker is reachable.` : "Worker is not reachable from this browser yet."}</p>
            </div>
            <div className="abl-reality-card">
              <strong><span className="abl-dot plan" /> Agent / A&R loop</strong>
              <p>Deterministic planning engine today. It models strategy, scoring, prompts, revisions, and export plans; it is not calling a live LLM.</p>
            </div>
            <div className="abl-reality-card">
              <strong><span className="abl-dot" /> Project persistence</strong>
              <p>Session memory only right now. A Netlify restart/serverless cold start can clear projects until database persistence is added.</p>
            </div>
            <div className="abl-reality-card">
              <strong><span className={`abl-dot ${deepReady ? "live" : ""}`} /> Deep 60+</strong>
              <p>{deepReady ? "Deep target engine is available in Stem Studio." : "Deep targets require the GPU worker / SAM-Audio runtime."}</p>
            </div>
          </aside>
        </section>

        <section className="abl-workflow" aria-label="How Agentic Beat Lab works">
          <div className="abl-step"><span className="abl-step-number">01</span><strong>Create a project</strong><p>Capture the song brief, direction, mix notes, and release intent.</p></div>
          <div className="abl-step"><span className="abl-step-number">02</span><strong>Run the planning loop</strong><p>Generate strategy directions, prompt packs, modeled versions, A&R scorecards, and revision priorities.</p></div>
          <div className="abl-step"><span className="abl-step-number">03</span><strong>Upload the actual track</strong><p>The file goes to the live separator worker and returns real synchronized stems.</p></div>
          <div className="abl-step"><span className="abl-step-number">04</span><strong>Export / refine</strong><p>Download the organized ZIP, inspect in Stem Lab, or use Deep 60+ in Stem Studio.</p></div>
        </section>

        <section className="abl-command-grid">
          <div className="abl-panel">
            <div className="abl-panel-head">
              <div><h2>Project + planning controls</h2><p>This side manages the production plan, not the audio inference engine.</p></div>
              <span className="abl-reality-badge"><span className="abl-dot plan" /> Planning</span>
            </div>
            <div className="abl-form-grid">
              <div><div className="abl-label">Project title</div><input className="abl-input" value={titleInput} onChange={(event) => setTitleInput(event.target.value)} /></div>
              <div><div className="abl-label">Song brief</div><textarea className="abl-textarea" value={briefInput} onChange={(event) => setBriefInput(event.target.value)} /></div>
              <div><div className="abl-label">Agent / producer command</div><textarea className="abl-textarea" value={commandInput} onChange={(event) => setCommandInput(event.target.value)} /></div>
              <div className="abl-content-grid">
                <div><div className="abl-label">Mix notes</div><textarea className="abl-textarea" value={mixNotesInput} onChange={(event) => setMixNotesInput(event.target.value)} /></div>
                <div><div className="abl-label">Revision override</div><textarea className="abl-textarea" value={revisionInput} onChange={(event) => setRevisionInput(event.target.value)} /></div>
              </div>
              <div><div className="abl-label">Export / DAW handoff notes</div><textarea className="abl-textarea" value={exportPlanInput} onChange={(event) => setExportPlanInput(event.target.value)} /></div>
            </div>
            <div className="abl-actions">
              <button className="abl-button" onClick={() => void createProject()} disabled={busy}>Create Project</button>
              <button className="abl-button secondary" onClick={() => void runAgentLoop()} disabled={busy || !selectedProject}>Run Planning Loop</button>
              <button className="abl-button secondary" onClick={() => void runMultitask()} disabled={busy || !selectedProject}>Batch Commands</button>
              <button className="abl-button secondary" onClick={() => void saveState()} disabled={busy || !selectedProject}>Save Session State</button>
            </div>
          </div>

          <div className="abl-panel">
            <div className="abl-panel-head">
              <div><h2>Live audio</h2><p>Actual file processing through the separator worker.</p></div>
              <span className="abl-reality-badge"><span className={`abl-dot ${workerOnline ? "live" : ""}`} /> {workerOnline ? "Live" : "Offline"}</span>
            </div>
            <div className="abl-upload">
              <div>
                <strong>Upload a mix for real Core 6 separation</strong>
                <p>WAV, MP3, FLAC, M4A, AIFF. For 60+ granular targets, continue into Stem Studio.</p>
                <button className="abl-button" onClick={() => fileRef.current?.click()} disabled={liveBusy || !workerOnline}>
                  {liveBusy ? "Separating…" : "Choose audio file"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void separateLiveAudio(file);
                  }}
                />
              </div>
            </div>
            <div className="abl-actions">
              <a className="abl-link-button secondary" href="/stem-lab">Open Stem Lab</a>
              <a className="abl-link-button secondary" href="/stem-studio">Open Deep 60+</a>
              {liveManifest?.zipUrl && <a className="abl-link-button" href={`${SEPARATOR_URL}${liveManifest.zipUrl}`} download>Download Stems ZIP</a>}
            </div>
          </div>
        </section>

        <section className="abl-main-grid">
          <aside className="abl-panel abl-sidebar">
            <div className="abl-project-meta">
              <div className="abl-label">Planning projects</div>
              <select className="abl-select" value={activeProjectId ?? ""} onChange={(event) => setActiveProjectId(event.target.value || null)}>
                <option value="">No project selected</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
              </select>
              <div className="abl-muted" style={{ fontSize: ".78rem", marginTop: ".45rem" }}>{projects.length} project{projects.length === 1 ? "" : "s"} in current server session</div>
            </div>
            <div className="abl-tab-list">
              {TABS.map((tab) => (
                <button key={tab} className={`abl-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
              ))}
            </div>
          </aside>

          <section className="abl-panel abl-content">
            <div className="abl-panel-head">
              <div><h2>{activeTab}</h2><p>{activeTab === "Stem Library" ? "Real separator results appear here when you upload audio." : "Production planning workspace."}</p></div>
              {activeTab === "Stem Library" && <span className="abl-reality-badge"><span className={`abl-dot ${liveManifest ? "live" : ""}`} /> {liveManifest ? "Real audio" : "Waiting"}</span>}
            </div>
            {renderMainContent()}
          </section>
        </section>
      </div>

      <div className="abl-status" role="status" aria-live="polite">
        {busy || liveBusy ? "Working · " : ""}{statusText}
      </div>
    </main>
  );
}
