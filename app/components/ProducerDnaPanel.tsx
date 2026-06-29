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
}

interface StoreStats {
  totalProducers: number;
  totalBatches: number;
  seededBatches: number;
  verifiedClaims: number;
  analyticalClaims: number;
  creativeClaims: number;
}

const api = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
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

  const loadBase = async (): Promise<void> => {
    const [dnaData, batchData] = await Promise.all([
      api<{ producers: ProducerSummary[]; stats: StoreStats }>("/api/producer-dna"),
      api<{ batches: BatchInfo[]; roadmapTarget: number }>("/api/producer-dna/batches")
    ]);
    setProducers(dnaData.producers);
    setStats(dnaData.stats);
    setBatches(batchData.batches);
    setRoadmapTarget(batchData.roadmapTarget);
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
        <p className="meta">
          Three layers: verified metadata, analytical DNA, creative direction. Every claim carries a
          confidence tier (A–E).
        </p>
        <div style={{ marginTop: "0.75rem" }}>
          {batches.slice(0, 3).map((batch) => (
            <span className="pill" key={batch.batchNumber}>
              Batch {batch.batchNumber}: {batch.title}
              {batch.producerCount > 0 ? ` (${batch.producerCount})` : " (planned)"}
            </span>
          ))}
        </div>
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
