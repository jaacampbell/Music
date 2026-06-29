"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProducerDnaCapsule, ProducerDnaRecord, ProducerScores } from "@/lib/producer-dna/types";

interface ProducerListItem {
  producer: ProducerDnaRecord["producer"];
  capsule: ProducerDnaCapsule;
  scores: ProducerScores | null;
  profileStatus: string;
}

interface Stats {
  totalProducers: number;
  batch001Count: number;
  capsuleCount: number;
  draftCount: number;
}

const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
};

export function ProducerDnaResearchPanel(): React.JSX.Element {
  const [producers, setProducers] = useState<ProducerListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProducerDnaRecord | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [status, setStatus] = useState("Loading Producer DNA Research base...");

  const loadProducers = async (): Promise<void> => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (genreFilter) params.set("genre", genreFilter);
    if (regionFilter) params.set("region", regionFilter);
    const qs = params.toString();
    const data = await api<{
      producers?: ProducerListItem[];
      results?: Array<ProducerListItem & { matchFields: string[] }>;
      stats: Stats;
      total: number;
    }>(`/api/producer-dna${qs ? `?${qs}` : ""}`);

    const list = data.producers ?? data.results ?? [];
    setProducers(list);
    setStats(data.stats);
    if (!selectedId && list.length > 0) {
      setSelectedId(list[0].producer.id);
    }
    setStatus(`${data.total} producers in Batch 001`);
  };

  const loadDetail = async (producerId: string): Promise<void> => {
    const data = await api<{ record: ProducerDnaRecord }>(`/api/producer-dna/${producerId}`);
    setDetail(data.record);
  };

  useEffect(() => {
    void loadProducers().catch((error: unknown) => {
      setStatus(error instanceof Error ? error.message : "Failed to load");
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    void loadDetail(selectedId).catch((error: unknown) => {
      setStatus(error instanceof Error ? error.message : "Failed to load detail");
    });
  }, [selectedId]);

  const selectedItem = useMemo(
    () => producers.find((p) => p.producer.id === selectedId) ?? null,
    [producers, selectedId]
  );

  const runSearch = (): void => {
    void loadProducers().catch((error: unknown) => {
      setStatus(error instanceof Error ? error.message : "Search failed");
    });
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "280px 1fr" }}>
      <div className="card">
        <h3>Producer DNA Research</h3>
        <p className="meta">
          Batch 001 · {stats?.totalProducers ?? 0} seed producers · verified facts separated from
          audible analysis
        </p>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, genre, scene, DNA..."
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        <input
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          placeholder="Filter genre"
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        <input
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          placeholder="Filter region"
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        <button onClick={runSearch} style={{ width: "100%", marginBottom: "0.75rem" }}>
          Search
        </button>
        <div className="meta" style={{ marginBottom: "0.5rem" }}>
          {status}
        </div>
        <div style={{ maxHeight: "420px", overflowY: "auto" }}>
          {producers.map((item) => (
            <button
              key={item.producer.id}
              className={`tab-item ${selectedId === item.producer.id ? "active" : ""}`}
              style={{ display: "block", width: "100%", textAlign: "left", marginBottom: "0.25rem" }}
              onClick={() => setSelectedId(item.producer.id)}
            >
              <div>{item.producer.name}</div>
              <div className="meta" style={{ fontSize: "0.75rem" }}>
                {item.producer.id} · {item.producer.region}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        {selectedItem && detail ? (
          <>
            <div className="card">
              <h3>
                {detail.producer.name}{" "}
                <span className="meta">({detail.producer.id})</span>
              </h3>
              <p className="meta">
                {detail.capsule.countryRegion} · {detail.capsule.sceneMovement}
              </p>
              <p>{detail.producer.coreDnaAngle}</p>
              {detail.capsule.primaryGenres.map((genre) => (
                <span className="pill" key={genre}>
                  {genre}
                </span>
              ))}
            </div>

            <div className="grid">
              <div className="card">
                <h3>Layer 1 — Verified Metadata</h3>
                <ul className="list">
                  <li>Works: {detail.works.length} (pending source verification)</li>
                  <li>Credits: {detail.credits.length}</li>
                  <li>Sources: {detail.sources.length}</li>
                  <li>Gear claims: {detail.gearClaims.length}</li>
                  <li>Collaborator edges: {detail.collaboratorEdges.length}</li>
                </ul>
                <p className="meta">Sources: MusicBrainz, Discogs, Wikidata, WhoSampled, FMA</p>
              </div>

              <div className="card">
                <h3>Layer 2 — Analytical DNA</h3>
                <p>{detail.capsule.signatureSoundSummary}</p>
                <p className="meta">{detail.capsule.artisticDna}</p>
                {detail.rhythmicDna && (
                  <p className="meta">Rhythm: {detail.capsule.rhythmicDna}</p>
                )}
                <p className="meta">Confidence: {detail.capsule.researchConfidence}</p>
              </div>
            </div>

            <div className="grid">
              <div className="card">
                <h3>Layer 3 — Creative Direction</h3>
                <p>
                  <strong>Type-beat:</strong> {detail.capsule.typeBeatInspiredDirection}
                </p>
                <p className="meta">
                  <strong>Originality twist:</strong> {detail.capsule.originalityTwist}
                </p>
                {detail.originalityWarnings.map((w) => (
                  <p className="meta" key={w.id}>
                    ⚠ {w.warning}
                  </p>
                ))}
              </div>

              {detail.scores && (
                <div className="card">
                  <h3>DNA Scores (1–10)</h3>
                  <div className="mono">
                    Innovation {detail.scores.innovation} · Influence {detail.scores.influence} ·
                    Sonic ID {detail.scores.sonicIdentity}
                    {"\n"}
                    Rhythm {detail.scores.rhythmDesign} · Underground{" "}
                    {detail.scores.undergroundImpact} · Commercial {detail.scores.commercialImpact}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card">
            <h3>Select a producer</h3>
            <p className="meta">Choose from Batch 001 to view the Producer DNA capsule.</p>
          </div>
        )}
      </div>
    </div>
  );
}
