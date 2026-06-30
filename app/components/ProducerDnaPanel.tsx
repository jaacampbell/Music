"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProducerDnaRecord } from "@/lib/producer-dna/types";

interface ProducerSummary {
  id: string;
  name: string;
  region?: string;
  country?: string;
  batchId?: string;
  coreDnaAngle?: string;
  primaryGenres: string[];
  signatureSoundSummary?: string;
  researchConfidence?: string;
}

interface SearchResult {
  producerId: string;
  name: string;
  region?: string;
  coreDnaAngle?: string;
  matchedFields: string[];
  matchedLayer: string;
  confidence: string;
  snippet: string;
}

interface BatchInfo {
  batchNumber: string;
  title: string;
  genreSceneFocus: string;
  regionFocus: string;
  eraFocus: string;
  producerCount: number;
  status?: string;
}

interface BatchingProgress {
  totalProducers: number;
  seededBatches: number;
  plannedBatches: number;
  researchedBatches: number;
  nextBatchToSeed?: string;
  nextBatchToResearch?: string;
}

interface BatchQueueItem {
  batchNumber: string;
  title: string;
  producerCount: number;
  status?: string;
}

interface StoreStats {
  totalProducers: number;
  totalBatches: number;
  seededBatches: number;
  verifiedClaims: number;
  analyticalClaims: number;
  creativeClaims: number;
}

interface ParallelAgentTask {
  id: string;
  agentId: string;
  step: string;
  producerId?: string;
  status: string;
  message: string;
  confidenceTier?: string;
}

interface ParallelWorkBatch {
  id: string;
  name: string;
  status: string;
  progress: number;
  message: string;
  concurrency: number;
  tasks: ParallelAgentTask[];
  result?: {
    completedTasks: number;
    failedTasks: number;
    totalTokensSaved?: number;
  };
}

interface ParallelStats {
  totalBatches: number;
  runningBatches: number;
  completedTasks: number;
  failedTasks: number;
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

export function ProducerDnaPanel(): React.JSX.Element {
  const [producers, setProducers] = useState<ProducerSummary[]>([]);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [roadmapTarget, setRoadmapTarget] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProducerDnaRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLayer, setSearchLayer] = useState("all");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [parallelBusy, setParallelBusy] = useState(false);
  const [parallelConcurrency, setParallelConcurrency] = useState(5);
  const [parallelBatchSize, setParallelBatchSize] = useState(5);
  const [latestParallelBatch, setLatestParallelBatch] = useState<ParallelWorkBatch | null>(null);
  const [parallelStats, setParallelStats] = useState<ParallelStats | null>(null);
  const [parallelError, setParallelError] = useState<string | null>(null);
  const [batchingProgress, setBatchingProgress] = useState<BatchingProgress | null>(null);
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const [catalogueBusy, setCatalogueBusy] = useState(false);
  const [catalogueMessage, setCatalogueMessage] = useState<string | null>(null);
  const [selectedCatalogueBatch, setSelectedCatalogueBatch] = useState("002");

  const loadBase = async (): Promise<void> => {
    const [dnaData, batchData, parallelData, queueData] = await Promise.all([
      api<{ producers: ProducerSummary[]; stats: StoreStats; batching: BatchingProgress }>(
        "/api/producer-dna"
      ),
      api<{ batches: BatchInfo[]; roadmapTarget: number; batching: BatchingProgress }>(
        "/api/producer-dna/batches"
      ),
      api<{ batches: ParallelWorkBatch[]; stats: ParallelStats }>(
        "/api/producer-dna/research/parallel"
      ).catch(() => ({ batches: [], stats: null })),
      api<{ progress: BatchingProgress; queue: BatchQueueItem[] }>(
        "/api/producer-dna/batches/run-next"
      ).catch(() => ({ progress: null, queue: [] }))
    ]);
    setProducers(dnaData.producers);
    setStats(dnaData.stats);
    setBatches(batchData.batches);
    setRoadmapTarget(batchData.roadmapTarget);
    setBatchingProgress(dnaData.batching ?? batchData.batching ?? queueData.progress);
    setBatchQueue(queueData.queue);
    if (queueData.progress?.nextBatchToResearch) {
      setSelectedCatalogueBatch(queueData.progress.nextBatchToResearch);
    }
    if (parallelData.stats) setParallelStats(parallelData.stats);
    if (parallelData.batches.length > 0) setLatestParallelBatch(parallelData.batches[0]);
    if (!selectedId && dnaData.producers.length > 0) {
      setSelectedId(dnaData.producers[0].id);
    }
  };

  const loadDetail = async (producerId: string): Promise<void> => {
    const data = await api<{ record: ProducerDnaRecord }>(`/api/producer-dna/${producerId}`);
    setDetail(data.record);
  };

  const runSearch = async (): Promise<void> => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("query", searchQuery.trim());
    if (searchLayer !== "all") params.set("layer", searchLayer);
    const data = await api<{ results: SearchResult[] }>(
      `/api/producer-dna/search?${params.toString()}`
    );
    setSearchResults(data.results);
  };

  const runParallelResearch = async (): Promise<void> => {
    setParallelBusy(true);
    setParallelError(null);
    try {
      const producerIds = producers.slice(0, parallelBatchSize).map((p) => p.id);
      const data = await api<{ batch: ParallelWorkBatch }>("/api/producer-dna/research/parallel", {
        method: "POST",
        body: JSON.stringify({
          producerIds,
          concurrency: parallelConcurrency
        })
      });
      setLatestParallelBatch(data.batch);
      const statsData = await api<{ stats: ParallelStats }>("/api/producer-dna/research/parallel");
      setParallelStats(statsData.stats);
    } catch (error) {
      setParallelError(error instanceof Error ? error.message : "Parallel research failed");
    } finally {
      setParallelBusy(false);
    }
  };

  const runCatalogueBatch = async (batchNumber: string): Promise<void> => {
    setCatalogueBusy(true);
    setCatalogueMessage(null);
    try {
      const data = await api<{
        result: {
          catalogueBatchNumber: string;
          catalogueTitle: string;
          producerCount: number;
          parallelBatch: ParallelWorkBatch;
        };
      }>(`/api/producer-dna/batches/${batchNumber}/run`, {
        method: "POST",
        body: JSON.stringify({ concurrency: parallelConcurrency })
      });
      setLatestParallelBatch(data.result.parallelBatch);
      setCatalogueMessage(
        `Batch ${data.result.catalogueBatchNumber} researched: ${data.result.producerCount} producers, ${data.result.parallelBatch.result?.completedTasks ?? 0} agent tasks.`
      );
      await loadBase();
    } catch (error) {
      setCatalogueMessage(error instanceof Error ? error.message : "Catalogue batch failed");
    } finally {
      setCatalogueBusy(false);
    }
  };

  const runNextBatches = async (count: number): Promise<void> => {
    setCatalogueBusy(true);
    setCatalogueMessage(null);
    try {
      const data = await api<{
        result: { batchesRun: Array<{ catalogueBatchNumber: string; producerCount: number }>; totalProducersResearched: number; totalTasksCompleted: number };
      }>("/api/producer-dna/batches/run-next", {
        method: "POST",
        body: JSON.stringify({ count, concurrency: parallelConcurrency })
      });
      setCatalogueMessage(
        `Researched ${data.result.batchesRun.length} catalogue batch(es), ${data.result.totalProducersResearched} producers, ${data.result.totalTasksCompleted} tasks.`
      );
      await loadBase();
    } catch (error) {
      setCatalogueMessage(error instanceof Error ? error.message : "Continuous batching failed");
    } finally {
      setCatalogueBusy(false);
    }
  };

  useEffect(() => {
    void loadBase().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
    }
  }, [selectedId]);

  const displayList = useMemo(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      return searchResults.map((r) => ({
        id: r.producerId,
        name: r.name,
        region: r.region,
        coreDnaAngle: r.coreDnaAngle ?? r.snippet
      }));
    }
    return producers;
  }, [producers, searchResults, searchQuery]);

  if (loading) {
    return (
      <div className="card">
        <h3>Producer DNA Research Base</h3>
        <p className="meta">Loading...</p>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card">
        <h3>Research base overview</h3>
        {stats && (
          <p className="meta">
            {stats.totalProducers} producers seeded | {stats.totalBatches} batches planned |
            Roadmap: {roadmapTarget.toLocaleString()} producers
          </p>
        )}
        {batchingProgress && (
          <p className="meta">
            Catalogue: {batchingProgress.seededBatches} seeded | {batchingProgress.researchedBatches}{" "}
            researched | Next to research: {batchingProgress.nextBatchToResearch ?? "none"}
          </p>
        )}
        <p className="meta">
          Three layers: verified metadata, analytical DNA, creative direction. Every claim carries a
          confidence tier (A–E).
        </p>
        <div style={{ marginTop: "0.75rem" }}>
          {batches.slice(0, 4).map((batch) => (
            <span className="pill" key={batch.batchNumber}>
              Batch {batch.batchNumber}: {batch.title}
              {batch.producerCount > 0 ? ` (${batch.producerCount})` : " (planned)"}
              {batch.status ? ` [${batch.status}]` : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Catalogue batching</h3>
        <p className="meta">
          Run agent research across an entire catalogue batch, or keep batching with run-next.
        </p>
        <select
          value={selectedCatalogueBatch}
          onChange={(e) => setSelectedCatalogueBatch(e.target.value)}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        >
          {batchQueue
            .filter((b) => b.producerCount > 0)
            .map((b) => (
              <option key={b.batchNumber} value={b.batchNumber}>
                Batch {b.batchNumber}: {b.title} ({b.producerCount}) — {b.status}
              </option>
            ))}
        </select>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => void runCatalogueBatch(selectedCatalogueBatch)}
            disabled={catalogueBusy}
          >
            Research batch
          </button>
          <button onClick={() => void runNextBatches(1)} disabled={catalogueBusy}>
            Run next batch
          </button>
          <button onClick={() => void runNextBatches(2)} disabled={catalogueBusy} className="secondary">
            Run next 2
          </button>
        </div>
        {catalogueMessage && (
          <p className="meta" style={{ marginTop: "0.5rem" }}>
            {catalogueMessage}
          </p>
        )}
        <ul className="list" style={{ marginTop: "0.75rem", maxHeight: "140px", overflowY: "auto" }}>
          {batchQueue.map((b) => (
            <li key={b.batchNumber}>
              Batch {b.batchNumber}: {b.title} — {b.producerCount > 0 ? `${b.producerCount} producers` : "planned"} [{b.status}]
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Search</h3>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, genre, DNA angle, creative direction..."
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        <select
          value={searchLayer}
          onChange={(e) => setSearchLayer(e.target.value)}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        >
          <option value="all">All layers</option>
          <option value="verified">Verified metadata</option>
          <option value="analytical">Analytical DNA</option>
          <option value="creative">Creative direction</option>
        </select>
        <button onClick={() => void runSearch()}>Search</button>
        {searchQuery && searchResults.length > 0 && (
          <p className="meta" style={{ marginTop: "0.5rem" }}>
            {searchResults.length} results
          </p>
        )}
      </div>

      <div className="card">
        <h3>Parallel agentic work</h3>
        <p className="meta">
          Run the 10-step profile pipeline across multiple producers in parallel. Each producer runs
          steps sequentially (metadata → open questions); producers run concurrently.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <label className="meta">
            Producers:{" "}
            <input
              type="number"
              min={1}
              max={50}
              value={parallelBatchSize}
              onChange={(e) => setParallelBatchSize(Number(e.target.value))}
              style={{ width: "4rem" }}
            />
          </label>
          <label className="meta">
            Concurrency:{" "}
            <input
              type="number"
              min={1}
              max={10}
              value={parallelConcurrency}
              onChange={(e) => setParallelConcurrency(Number(e.target.value))}
              style={{ width: "4rem" }}
            />
          </label>
        </div>
        <button onClick={() => void runParallelResearch()} disabled={parallelBusy}>
          {parallelBusy ? "Running agents..." : "Run parallel research"}
        </button>
        {parallelError && (
          <p className="meta" style={{ marginTop: "0.5rem", color: "#ff6b6b" }}>
            {parallelError}
          </p>
        )}
        {parallelStats && (
          <p className="meta" style={{ marginTop: "0.5rem" }}>
            {parallelStats.totalBatches} batches | {parallelStats.completedTasks} tasks completed |{" "}
            {parallelStats.failedTasks} failed
          </p>
        )}
        {latestParallelBatch && (
          <div style={{ marginTop: "0.75rem" }}>
            <p className="meta">
              Latest: {latestParallelBatch.name} — {latestParallelBatch.progress}% (
              {latestParallelBatch.status})
            </p>
            <p className="meta">{latestParallelBatch.message}</p>
            {latestParallelBatch.result && (
              <p className="meta">
                {latestParallelBatch.result.completedTasks} completed |{" "}
                {latestParallelBatch.result.failedTasks} failed |{" "}
                {latestParallelBatch.result.totalTokensSaved ?? 0} tokens saved
              </p>
            )}
            <ul className="list" style={{ maxHeight: "160px", overflowY: "auto" }}>
              {latestParallelBatch.tasks.slice(-8).map((task) => (
                <li key={task.id}>
                  [{task.status}] {task.producerId} / {task.step} — {task.agentId}
                  {task.confidenceTier ? ` (${task.confidenceTier})` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1rem" }}>
          <div>
            <h3>Producers</h3>
            <div className="tab-list" style={{ maxHeight: "420px", overflowY: "auto" }}>
              {displayList.map((p) => (
                <button
                  key={p.id}
                  className={`tab-item ${selectedId === p.id ? "active" : ""}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div>{p.name}</div>
                  <div className="meta" style={{ fontSize: "0.75rem" }}>
                    {p.id}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {detail && (
            <div>
              <h3>
                {detail.producer.name}{" "}
                <span className="meta">({detail.producer.id})</span>
              </h3>
              <p className="meta">
                {detail.capsule?.countryRegion} | Batch {detail.producer.batchId}
              </p>
              <p>
                <strong>Core DNA:</strong> {detail.producer.coreDnaAngle}
              </p>

              <h4 style={{ marginTop: "1rem" }}>Layer 1 — Verified metadata</h4>
              <p className="meta">
                Region: {detail.producer.region} | Scenes:{" "}
                {detail.producer.primaryScenes.join(", ")}
              </p>
              <p className="meta">
                Works: {detail.works.length} | Credits: {detail.credits.length} | Sources:{" "}
                {detail.sources.length} (pending citation expansion)
              </p>

              <h4 style={{ marginTop: "1rem" }}>Layer 2 — Analytical DNA</h4>
              {detail.capsule && (
                <>
                  <p>
                    <strong>Signature:</strong> {detail.capsule.signatureSoundSummary}
                  </p>
                  <p>
                    <strong>Artistic DNA:</strong> {detail.capsule.artisticDna}
                  </p>
                  <p>
                    <strong>Technical DNA:</strong> {detail.capsule.technicalDna}
                  </p>
                  <p>
                    <strong>Rhythmic:</strong> {detail.capsule.rhythmicDna}
                  </p>
                  <p>
                    <strong>Melodic/Harmonic:</strong> {detail.capsule.melodicHarmonicDna}
                  </p>
                  <div style={{ marginTop: "0.5rem" }}>
                    {detail.capsule.primaryGenres.map((g) => (
                      <span className="pill" key={g}>
                        {g}
                      </span>
                    ))}
                  </div>
                  <p className="meta" style={{ marginTop: "0.5rem" }}>
                    Confidence: {detail.capsule.researchConfidence}
                  </p>
                </>
              )}

              <h4 style={{ marginTop: "1rem" }}>Layer 3 — Creative direction</h4>
              <p>
                <strong>Type-beat direction:</strong>{" "}
                {detail.capsule?.typeBeatInspiredDirection}
              </p>
              <p>
                <strong>Originality twist:</strong> {detail.capsule?.originalityTwist}
              </p>
              <p className="meta">
                {detail.creativeIterations.length} creative iterations |{" "}
                {detail.originalityWarnings.length} originality warnings |{" "}
                {detail.promptExports.length} prompt exports
              </p>
              <ul className="list">
                {detail.originalityWarnings.map((w) => (
                  <li key={w.id}>
                    [{w.category}] {w.warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
