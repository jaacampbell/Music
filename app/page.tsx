"use client";

import { useEffect, useMemo, useState } from "react";

import type { Project, ProducerCapsule, ProducerTaxonomy } from "@/lib/types";

const TABS = [
  "Song Brief",
  "Song DNA",
  "Prompt Pack",
  "Generations",
  "Stem Library",
  "Beat Breakdown",
  "Scorecards",
  "Mix Notes",
  "Revision Loop",
  "Final Export",
  "Producer DNA"
] as const;

const selectStyle: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "#0f1220",
  color: "var(--text)",
  padding: "0.45rem"
};

type TabName = (typeof TABS)[number];

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
  const [busy, setBusy] = useState(false);

  const [producers, setProducers] = useState<ProducerCapsule[]>([]);
  const [producerTaxonomy, setProducerTaxonomy] = useState<ProducerTaxonomy | null>(null);
  const [producerQuery, setProducerQuery] = useState("");
  const [eraFilter, setEraFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [selectedProducer, setSelectedProducer] = useState<ProducerCapsule | null>(null);
  const [promptExport, setPromptExport] = useState<{
    prompts: string[];
    originalityWarnings: string[];
    confidenceNote: string;
  } | null>(null);

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

  const loadProducers = async (): Promise<void> => {
    const params = new URLSearchParams();
    if (producerQuery.trim()) params.set("query", producerQuery.trim());
    if (eraFilter) params.set("era", eraFilter);
    if (genreFilter) params.set("genre", genreFilter);
    if (roleFilter) params.set("role", roleFilter);
    if (confidenceFilter) params.set("confidence", confidenceFilter);
    const data = await api<{
      producers: ProducerCapsule[];
      total: number;
      taxonomy: ProducerTaxonomy;
    }>(`/api/producers?${params.toString()}`);
    setProducers(data.producers);
    setProducerTaxonomy(data.taxonomy);
  };

  const selectProducer = async (producerId: string): Promise<void> => {
    setPromptExport(null);
    try {
      const data = await api<{ producer: ProducerCapsule }>(`/api/producers/${producerId}`);
      setSelectedProducer(data.producer);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unable to load producer");
    }
  };

  const generateProducerPrompt = async (): Promise<void> => {
    if (!selectedProducer) return;
    try {
      const data = await api<{
        result: { prompts: string[]; originalityWarnings: string[]; confidenceNote: string };
      }>(`/api/producers/${selectedProducer.id}/prompt-export`, {
        method: "POST",
        body: JSON.stringify({})
      });
      setPromptExport(data.result);
      setStatusText(`Prompt export generated for ${selectedProducer.name}.`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Prompt export failed");
    }
  };

  useEffect(() => {
    void Promise.all([loadProjects(), loadCacheStats(), loadProducers()]);
  }, []);

  useEffect(() => {
    void loadProducers();
  }, [producerQuery, eraFilter, genreFilter, roleFilter, confidenceFilter]);

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

  const eraLabel = (slug: string): string =>
    producerTaxonomy?.eras.find((era) => era.slug === slug)?.label ?? slug;
  const genreLabel = (slug: string): string =>
    producerTaxonomy?.genres.find((genre) => genre.slug === slug)?.label ?? slug;
  const roleLabel = (slug: string): string =>
    producerTaxonomy?.roles.find((role) => role.slug === slug)?.label ?? slug;
  const dimensionLabel = (slug: string): string =>
    producerTaxonomy?.scoringDimensions.find((dim) => dim.slug === slug)?.label ?? slug;

  const renderProducerDetail = (producer: ProducerCapsule): React.JSX.Element => {
    const scoreEntries = Object.entries(producer.scores);
    return (
      <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <div className="card">
          <button className="tab-item" style={{ width: "auto" }} onClick={() => setSelectedProducer(null)}>
            ← Back to list
          </button>
          <h3 style={{ marginTop: "0.6rem" }}>
            {producer.name} <span className="meta">({producer.id})</span>
          </h3>
          <p className="meta">
            {producer.realName ? `${producer.realName} · ` : ""}
            {producer.region} · {eraLabel(producer.era)}
          </p>
          <div>
            <span className="pill">Analysis tier: {producer.analysisConfidence}</span>
            <span className="pill">Facts: {producer.factStatus}</span>
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            {producer.genres.map((slug) => (
              <span className="pill" key={`g-${slug}`}>
                {genreLabel(slug)}
              </span>
            ))}
          </div>
          <div>
            {producer.roles.map((slug) => (
              <span className="pill" key={`r-${slug}`}>
                {roleLabel(slug)}
              </span>
            ))}
          </div>
          <p style={{ marginBottom: 0 }}>
            <strong>Core DNA angle (D-tier):</strong> {producer.coreDnaAngle}
          </p>
        </div>

        {producer.profile ? (
          <div className="card">
            <h3>Analytical DNA Layer</h3>
            <div className="mono">
              {`Signature: ${producer.profile.signatureSummary}\n\n`}
              {`Artistic DNA: ${producer.profile.artisticDna}\n\n`}
              {`Technical DNA: ${producer.profile.technicalDna}\n\n`}
              {`Sonic DNA: ${producer.profile.sonicDna}\n\n`}
              {`Rhythmic DNA: ${producer.profile.rhythmicDna}\n\n`}
              {`Melodic/Harmonic DNA: ${producer.profile.melodicHarmonicDna}\n\n`}
              {`Arrangement DNA: ${producer.profile.arrangementDna}\n\n`}
              {`Mixing DNA: ${producer.profile.mixingDna}\n\n`}
              {`Sampling DNA: ${producer.profile.samplingDna}`}
            </div>
          </div>
        ) : (
          <div className="card">
            <h3>Analytical DNA Layer</h3>
            <p className="meta">
              Full DNA profile not yet expanded. This capsule holds the audible core DNA angle
              (D-tier); verified facts still need citation before this entry is promoted.
            </p>
          </div>
        )}

        {producer.profile ? (
          <div className="card">
            <h3>Style nuance map</h3>
            <ul className="list">
              <li>Casual listeners: {producer.profile.styleNuanceMap.casualListeners}</li>
              <li>Producers: {producer.profile.styleNuanceMap.producers}</li>
              <li>Engineers: {producer.profile.styleNuanceMap.engineers}</li>
              <li>Artists: {producer.profile.styleNuanceMap.artists}</li>
              <li>DJs: {producer.profile.styleNuanceMap.djs}</li>
              <li>Beginners misunderstand: {producer.profile.styleNuanceMap.beginnersMisunderstand}</li>
            </ul>
          </div>
        ) : null}

        {producer.profile ? (
          <div className="card">
            <h3>Creative Direction Layer</h3>
            <p>
              <strong>Inspired direction:</strong> {producer.profile.inspiredDirection}
            </p>
            <p>
              <strong>Originality twist:</strong> {producer.profile.originalityTwist}
            </p>
            <strong>Fusion paths</strong>
            <ul className="list">
              {producer.profile.fusionPaths.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ul>
            <strong>Originality warnings (do-not-copy)</strong>
            <ul className="list">
              {producer.profile.originalityWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {scoreEntries.length > 0 ? (
          <div className="card">
            <h3>DNA scoring (1–10, not a popularity ranking)</h3>
            <div className="grid">
              {scoreEntries.map(([dimension, value]) => (
                <div className="meta" key={dimension}>
                  {dimensionLabel(dimension)}: <strong>{value}</strong>/10
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="card">
          <h3>Prompt exports</h3>
          <button className="tab-item" style={{ width: "auto" }} onClick={() => void generateProducerPrompt()}>
            Generate reference-safe prompts
          </button>
          {promptExport ? (
            <div style={{ marginTop: "0.6rem" }}>
              <ul className="list">
                {promptExport.prompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>
              <strong>Originality warnings</strong>
              <ul className="list">
                {promptExport.originalityWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <p className="meta">{promptExport.confidenceNote}</p>
            </div>
          ) : (
            <p className="meta">
              Generates ethical type-beat translation prompts with do-not-copy safeguards.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderProducerDna = (): React.JSX.Element => {
    if (selectedProducer) {
      return renderProducerDetail(selectedProducer);
    }
    return (
      <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <div className="card">
          <h3>Producer DNA Research base</h3>
          <p className="meta">
            Verified facts and audible/creative analysis as searchable, confidence-labeled fields.
            Showing {producers.length} of Batch 001.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <input
              value={producerQuery}
              onChange={(event) => setProducerQuery(event.target.value)}
              placeholder="Search name, region, scene, DNA angle..."
              style={selectStyle}
            />
            <select value={eraFilter} onChange={(e) => setEraFilter(e.target.value)} style={selectStyle}>
              <option value="">All eras</option>
              {producerTaxonomy?.eras.map((era) => (
                <option key={era.slug} value={era.slug}>
                  {era.label}
                </option>
              ))}
            </select>
            <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} style={selectStyle}>
              <option value="">All genres/scenes</option>
              {producerTaxonomy?.genres.map((genre) => (
                <option key={genre.slug} value={genre.slug}>
                  {genre.label}
                </option>
              ))}
            </select>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={selectStyle}>
              <option value="">All roles</option>
              {producerTaxonomy?.roles.map((role) => (
                <option key={role.slug} value={role.slug}>
                  {role.label}
                </option>
              ))}
            </select>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="">All confidence tiers</option>
              {producerTaxonomy?.confidenceTiers.map((tier) => (
                <option key={tier.tier} value={tier.tier}>
                  {tier.tier} — {tier.meaning.slice(0, 40)}…
                </option>
              ))}
            </select>
          </div>
        </div>
        {producers.length === 0 ? (
          <div className="card">
            <h3>No matches</h3>
            <p className="meta">Adjust the search or filters to see Batch 001 producers.</p>
          </div>
        ) : (
          <div className="grid">
            {producers.map((producer) => (
              <button
                key={producer.id}
                className="card"
                style={{ textAlign: "left", cursor: "pointer" }}
                onClick={() => void selectProducer(producer.id)}
              >
                <h3>
                  {producer.name} {producer.profile ? "★" : ""}
                </h3>
                <p className="meta">
                  {producer.id} · {producer.region} · {eraLabel(producer.era)}
                </p>
                <div className="mono">{producer.coreDnaAngle}</div>
                <div style={{ marginTop: "0.4rem" }}>
                  <span className="pill">{producer.analysisConfidence}-tier</span>
                  {producer.genres.slice(0, 3).map((slug) => (
                    <span className="pill" key={`${producer.id}-${slug}`}>
                      {genreLabel(slug)}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
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
