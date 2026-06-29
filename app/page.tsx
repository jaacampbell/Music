"use client";

import { useEffect, useMemo, useState } from "react";

import type { Project } from "@/lib/types";
import type {
  ConfidenceTierDefinition,
  ProducerDnaBatch,
  ProducerDnaCapsule,
  ProducerDnaSourceOption,
  ProducerDnaTableDefinition,
  ResearchConfidenceTier
} from "@/lib/producer-dna";

const TABS = [
  "Song Brief",
  "Song DNA",
  "Prompt Pack",
  "Generations",
  "Stem Library",
  "Beat Breakdown",
  "Scorecards",
  "Producer DNA",
  "Mix Notes",
  "Revision Loop",
  "Final Export"
] as const;

type TabName = (typeof TABS)[number];

type ProducerDnaResponse = {
  architecture: {
    sources: ProducerDnaSourceOption[];
    tables: ProducerDnaTableDefinition[];
    confidenceTiers: ConfidenceTierDefinition[];
    taxonomy: {
      eras: string[];
      genreScenes: string[];
      producerRoles: string[];
    };
    scoringRubric: string[];
    operatingOrder: string[];
  };
  batch: ProducerDnaBatch;
  exampleCapsule: ProducerDnaCapsule;
  nextBatches: string[];
  search: {
    query: string;
    confidenceTier: ResearchConfidenceTier | null;
    resultCount: number;
  };
};

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
    "Separate into 10 stems and export for REAPER"
  );
  const [mixNotesInput, setMixNotesInput] = useState("");
  const [revisionInput, setRevisionInput] = useState("");
  const [exportPlanInput, setExportPlanInput] = useState("");
  const [statusText, setStatusText] = useState("Ready");
  const [cacheEntries, setCacheEntries] = useState(0);
  const [producerDna, setProducerDna] = useState<ProducerDnaResponse | null>(null);
  const [producerDnaQuery, setProducerDnaQuery] = useState("");
  const [producerDnaConfidence, setProducerDnaConfidence] = useState<
    ResearchConfidenceTier | ""
  >("");
  const [busy, setBusy] = useState(false);

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

  const loadProducerDna = async (): Promise<void> => {
    const params = new URLSearchParams();
    if (producerDnaQuery.trim()) {
      params.set("query", producerDnaQuery.trim());
    }
    if (producerDnaConfidence) {
      params.set("confidence", producerDnaConfidence);
    }
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const data = await api<ProducerDnaResponse>(`/api/producer-dna${suffix}`);
    setProducerDna(data);
  };

  useEffect(() => {
    void Promise.all([loadProjects(), loadCacheStats()]);
  }, []);

  useEffect(() => {
    void loadProducerDna();
  }, [producerDnaQuery, producerDnaConfidence]);

  useEffect(() => {
    if (!selectedProject) return;
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
      setStatusText(`Project created: ${data.project.title}`);
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
        `Agent ran ${data.result.jobIds.length} jobs (mode ${data.result.decision.stemMode}, ${data.result.decision.modelProfile}).`
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
      setStatusText("Add one command per line to run multitask.");
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
        `Multitask finished: ${data.result.totalCommands} commands, ${data.result.totalJobs} jobs, ${data.result.totalTokensSaved} tokens saved.`
      );
    });
  };

  const runExtraction = async (mode: 2 | 4 | 6 | 10): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      const data = await api<{ job: { id: string } }>(
        `/api/projects/${selectedProject.id}/extract`,
        {
          method: "POST",
          body: JSON.stringify({ mode })
        }
      );
      setStatusText(`Extraction job completed: ${data.job.id}`);
    });
  };

  const runAnalysis = async (): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      const data = await api<{ job: { id: string } }>(
        `/api/projects/${selectedProject.id}/analyze`,
        { method: "POST", body: JSON.stringify({}) }
      );
      setStatusText(`Analysis job completed: ${data.job.id}`);
    });
  };

  const runExport = async (type: string): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      const data = await api<{ job: { id: string } }>(
        `/api/projects/${selectedProject.id}/export`,
        { method: "POST", body: JSON.stringify({ type }) }
      );
      setStatusText(`Export created (${type}) job: ${data.job.id}`);
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
      setStatusText("Project state saved.");
    });
  };

  const renderProducerDna = (): React.JSX.Element => {
    if (!producerDna) {
      return (
        <div className="card">
          <h3>Producer DNA Research Base</h3>
          <p className="meta">Loading research architecture...</p>
        </div>
      );
    }
    return (
      <div className="stack">
        <div className="card">
          <h3>Producer DNA Research Base</h3>
          <p>
            Three-layer research base: verified facts, audible/creative analysis, and rights-safe
            creative direction are stored separately, then exposed as searchable fields.
          </p>
          <div className="meta">
            Batch {producerDna.batch.batchNumber}: {producerDna.search.resultCount} /{" "}
            {producerDna.batch.producerCount} seed producers shown
          </div>
          <div className="filters">
            <input
              value={producerDnaQuery}
              onChange={(event) => setProducerDnaQuery(event.target.value)}
              placeholder="Search producer, scene, role, or DNA trait"
            />
            <select
              value={producerDnaConfidence}
              onChange={(event) =>
                setProducerDnaConfidence(event.target.value as ResearchConfidenceTier | "")
              }
            >
              <option value="">All confidence</option>
              {producerDna.architecture.confidenceTiers.map((item) => (
                <option key={item.tier} value={item.tier}>
                  Tier {item.tier}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid">
          {(["verified-metadata", "analytical-dna", "creative-direction"] as const).map(
            (layer) => (
              <div className="card" key={layer}>
                <h3>{layer}</h3>
                <p className="meta">
                  {producerDna.architecture.tables.filter((table) => table.layer === layer).length}{" "}
                  tables
                </p>
                <ul className="list">
                  {producerDna.architecture.tables
                    .filter((table) => table.layer === layer)
                    .slice(0, 4)
                    .map((table) => (
                      <li key={table.tableName}>
                        {table.tableName}: {table.searchableFields.slice(0, 4).join(", ")}
                      </li>
                    ))}
                </ul>
              </div>
            )
          )}
        </div>

        <div className="grid">
          <div className="card">
            <h3>Metadata source stack</h3>
            <ul className="list">
              {producerDna.architecture.sources.map((source) => (
                <li key={source.id}>
                  {source.name}: {source.role}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Confidence system</h3>
            <ul className="list">
              {producerDna.architecture.confidenceTiers.map((item) => (
                <li key={item.tier}>
                  Tier {item.tier}: {item.meaning}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid">
          {producerDna.batch.seeds.map((producer) => (
            <div className="card" key={producer.id}>
              <h3>
                {producer.id} - {producer.name}
              </h3>
              <p>{producer.coreDnaAngle}</p>
              <p className="meta">{producer.regionScene}</p>
              <div>
                <span className="pill">metadata {producer.metadataConfidence}</span>
                <span className="pill">analysis {producer.analysisConfidence}</span>
              </div>
              <div className="meta">{producer.taxonomyTags.join(" / ")}</div>
            </div>
          ))}
        </div>

        <div className="grid">
          <div className="card">
            <h3>Compressed capsule example: {producerDna.exampleCapsule.name}</h3>
            <div className="mono">
              {[
                producerDna.exampleCapsule.signatureSoundSummary,
                producerDna.exampleCapsule.rhythmicDna,
                producerDna.exampleCapsule.typeBeatInspiredDirection,
                producerDna.exampleCapsule.researchConfidence
              ].join("\n\n")}
            </div>
          </div>
          <div className="card">
            <h3>Operating order</h3>
            <ol className="list">
              {producerDna.architecture.operatingOrder.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <div className="meta">
              Scoring fields: {producerDna.architecture.scoringRubric.join(", ")}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMainContent = (): React.JSX.Element => {
    if (activeTab === "Producer DNA") {
      return renderProducerDna();
    }

    if (!selectedProject) {
      return (
        <div className="card">
          <h3>No project selected</h3>
          <p className="meta">Create a project from the left controls to start the loop.</p>
        </div>
      );
    }

    switch (activeTab) {
      case "Song Brief":
        return (
          <div className="grid">
            <div className="card">
              <h3>Song brief</h3>
              <p>{selectedProject.brief}</p>
            </div>
            <div className="card">
              <h3>Agent command</h3>
              <p className="meta">{commandInput}</p>
            <div className="meta">Tip: one command per line for Multitask.</div>
              <div className="meta">Prompt cache entries: {cacheEntries}</div>
            </div>
          </div>
        );
      case "Song DNA":
        return (
          <div className="grid">
            <div className="card">
              <h3>Core profile</h3>
              <p className="meta">
                BPM: {selectedProject.songDna.bpm} | Key: {selectedProject.songDna.key} | Vocal
                space: {selectedProject.songDna.vocalSpace}
              </p>
              {selectedProject.songDna.mood.map((value) => (
                <span className="pill" key={value}>
                  {value}
                </span>
              ))}
            </div>
            <div className="card">
              <h3>Palette / structure</h3>
              <ul className="list">
                {selectedProject.songDna.palette.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      case "Prompt Pack":
        return (
          <div className="card">
            <h3>Prompt variants</h3>
            <ul className="list">
              {selectedProject.promptPack.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </div>
        );
      case "Generations":
        return (
          <div className="grid">
            {selectedProject.generations.map((generation) => (
              <div className="card" key={generation.id}>
                <h3>
                  {generation.name} {generation.selected ? "✓" : ""}
                </h3>
                <p className="meta">
                  {generation.strategy} | Score {generation.score}
                </p>
                <div className="mono">
                  Strengths: {generation.strengths.join(", ")}
                  {"\n"}
                  Weaknesses: {generation.weaknesses.join(", ")}
                </div>
              </div>
            ))}
          </div>
        );
      case "Stem Library":
        return (
          <div className="grid">
            {selectedProject.stems.map((stem) => (
              <div className="card" key={stem.id}>
                <h3>{stem.name}</h3>
                <p className="meta">
                  {stem.sampleRate} Hz | {stem.channels}ch | {stem.durationSec.toFixed(1)}s
                </p>
                <div className="mono">
                  LUFS: {stem.lufs.toFixed(1)} | Confidence: {(stem.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        );
      case "Beat Breakdown":
        return (
          <div className="grid">
            <div className="card">
              <h3>Markers</h3>
              <ul className="list">
                {selectedProject.manifest.markers.map((marker) => (
                  <li key={`${marker.bar}-${marker.label}`}>
                    Bar {marker.bar}: {marker.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3>Chord map</h3>
              <ul className="list">
                {selectedProject.manifest.chords.map((chord) => (
                  <li key={`${chord.bar}-${chord.chord}`}>
                    Bar {chord.bar}: {chord.chord}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case "Scorecards":
        return (
          <div className="grid">
            {selectedProject.scorecards.map((score) => (
              <div className="card" key={score.id}>
                <h3>{score.summary}</h3>
                <p className="meta">
                  Emotion {score.emotionalAlignment}/10 | Originality {score.originality}/10 |
                  Release {score.releaseReadiness}/10
                </p>
              </div>
            ))}
          </div>
        );
      case "Mix Notes":
        return (
          <div className="card">
            <h3>Mix notes</h3>
            <p>{selectedProject.mixNotes || "No notes yet."}</p>
          </div>
        );
      case "Revision Loop":
        return (
          <div className="card">
            <h3>Revision prompt</h3>
            <p>{selectedProject.revisionPrompt || "No revision prompt generated yet."}</p>
            <div className="meta">
              Last telemetry:{" "}
              {selectedProject.promptTelemetry.length > 0
                ? JSON.stringify(
                    selectedProject.promptTelemetry[selectedProject.promptTelemetry.length - 1]
                  )
                : "none"}
            </div>
          </div>
        );
      case "Final Export":
        return (
          <div className="grid">
            <div className="card">
              <h3>Export plan</h3>
              <p>{selectedProject.exportPlan || "No export plan yet."}</p>
            </div>
            <div className="card">
              <h3>Export artifacts</h3>
              <ul className="list">
                {selectedProject.manifest.exports.map((artifact) => (
                  <li key={artifact.id}>
                    {artifact.type} ({artifact.files.length} files)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      default:
        return <div />;
    }
  };

  return (
    <main className="page">
      <header className="header">
        <h1>Agentic Beat Lab OS</h1>
        <p>Parallel interface + agent workflow + token saver command center</p>
      </header>
      <section className="controls">
        <div>
          <input
            value={titleInput}
            onChange={(event) => setTitleInput(event.target.value)}
            placeholder="Project title"
          />
          <textarea
            value={briefInput}
            onChange={(event) => setBriefInput(event.target.value)}
            placeholder="Song brief"
          />
          <textarea
            value={commandInput}
            onChange={(event) => setCommandInput(event.target.value)}
            placeholder="Agent command"
          />
          <textarea
            value={mixNotesInput}
            onChange={(event) => setMixNotesInput(event.target.value)}
            placeholder="Mix notes"
          />
          <textarea
            value={revisionInput}
            onChange={(event) => setRevisionInput(event.target.value)}
            placeholder="Revision prompt override"
          />
          <textarea
            value={exportPlanInput}
            onChange={(event) => setExportPlanInput(event.target.value)}
            placeholder="Export plan notes"
          />
        </div>
        <div className="buttons">
          <button onClick={() => void createProject()} disabled={busy}>
            Create Project
          </button>
          <button onClick={() => void runAgentLoop()} disabled={busy || !selectedProject}>
            Run Agent Loop
          </button>
          <button onClick={() => void runMultitask()} disabled={busy || !selectedProject}>
            Multitask (Batch)
          </button>
          <button
            className="secondary"
            onClick={() => void runExtraction(4)}
            disabled={busy || !selectedProject}
          >
            Extract 4 Stems
          </button>
          <button
            className="secondary"
            onClick={() => void runAnalysis()}
            disabled={busy || !selectedProject}
          >
            Analyze Audio
          </button>
          <button
            className="secondary"
            onClick={() => void runExport("wav-zip")}
            disabled={busy || !selectedProject}
          >
            Export WAV ZIP
          </button>
          <button
            className="secondary"
            onClick={() => void runExport("reaper-rpp")}
            disabled={busy || !selectedProject}
          >
            Export REAPER
          </button>
          <button className="secondary" onClick={() => void saveState()} disabled={busy || !selectedProject}>
            Save State
          </button>
        </div>
      </section>

      <section className="layout">
        <aside className="panel sidebar">
          <div className="meta" style={{ marginBottom: "0.65rem" }}>
            Projects: {projects.length}
          </div>
          <select
            value={activeProjectId ?? ""}
            onChange={(event) => setActiveProjectId(event.target.value)}
            style={{
              width: "100%",
              marginBottom: "0.65rem",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "#0f1220",
              color: "var(--text)",
              padding: "0.45rem"
            }}
          >
            <option value="" disabled>
              Select project
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <div className="tab-list">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`tab-item ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </aside>
        <section className="panel main">{renderMainContent()}</section>
      </section>

      <div className="status">{busy ? "Working..." : statusText}</div>
    </main>
  );
}
