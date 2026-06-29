"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type {
  BatchDefinition,
  ConfidenceTier,
  EraId,
  ProducerProfile,
  ProducerRole,
  TaxonomyBundle
} from "@/lib/producer-dna/types";
import type { ProducerSummary } from "@/lib/producer-dna/store";

interface SearchResponse {
  producers: ProducerSummary[];
  count: number;
  stats: {
    totalProducers: number;
    byTier: Record<ConfidenceTier, number>;
    byEra: Record<EraId, number>;
    byRole: Record<ProducerRole, number>;
    averageDnaScore: number;
    pendingOpenQuestions: number;
  };
}

interface TaxonomyResponse {
  taxonomy: TaxonomyBundle;
  fullProfilePipeline: string[];
}

interface BatchesResponse {
  batches: BatchDefinition[];
}

interface ProfileResponse {
  profile: ProducerProfile;
}

const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
};

const TIER_COLORS: Record<ConfidenceTier, string> = {
  A: "#2ccf8f",
  B: "#6b8cff",
  C: "#d3a64c",
  D: "#9c6bff",
  E: "#cf6b6b",
  Unknown: "#9ea6bc"
};

export default function ProducerDnaPage(): React.JSX.Element {
  const [taxonomy, setTaxonomy] = useState<TaxonomyResponse | null>(null);
  const [batches, setBatches] = useState<BatchDefinition[]>([]);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProducerProfile | null>(null);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [genre, setGenre] = useState("");
  const [role, setRole] = useState<ProducerRole | "">("");
  const [era, setEra] = useState<EraId | "">("");
  const [minTier, setMinTier] = useState<ConfidenceTier | "">("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready");

  const runSearch = async (overrides?: {
    query?: string;
    region?: string;
    genre?: string;
    role?: ProducerRole | "";
    era?: EraId | "";
    minTier?: ConfidenceTier | "";
  }): Promise<void> => {
    setBusy(true);
    try {
      const effectiveQuery = overrides?.query ?? query;
      const effectiveRegion = overrides?.region ?? region;
      const effectiveGenre = overrides?.genre ?? genre;
      const effectiveRole = overrides?.role ?? role;
      const effectiveEra = overrides?.era ?? era;
      const effectiveMinTier = overrides?.minTier ?? minTier;
      const params = new URLSearchParams();
      if (effectiveQuery) params.set("q", effectiveQuery);
      if (effectiveRegion) params.set("region", effectiveRegion);
      if (effectiveGenre) params.set("genre", effectiveGenre);
      if (effectiveRole) params.set("role", effectiveRole);
      if (effectiveEra) params.set("era", effectiveEra);
      if (effectiveMinTier) params.set("minHistoricalTier", effectiveMinTier);
      const data = await api<SearchResponse>(`/api/producer-dna?${params.toString()}`);
      setResults(data);
      setStatus(`Showing ${data.count} of ${data.stats.totalProducers} producers.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Search failed");
    } finally {
      setBusy(false);
    }
  };

  const loadProfile = async (id: string): Promise<void> => {
    setBusy(true);
    try {
      const data = await api<ProfileResponse>(`/api/producer-dna/${id}`);
      setSelectedProfile(data.profile);
      setStatus(`Loaded profile: ${data.profile.producer.name}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Profile load failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void (async () => {
      const [tx, br] = await Promise.all([
        api<TaxonomyResponse>("/api/producer-dna/taxonomy"),
        api<BatchesResponse>("/api/producer-dna/batches")
      ]);
      setTaxonomy(tx);
      setBatches(br.batches);
      await runSearch();
    })();
  }, []);

  const sortedResults = useMemo(() => {
    if (!results) return [] as ProducerSummary[];
    return [...results.producers].sort((a, b) => b.averageScore - a.averageScore);
  }, [results]);

  return (
    <main className="page">
      <header className="header">
        <h1>Producer DNA Research base</h1>
        <p>
          Three-layer database (verified metadata · analytical DNA · creative direction) with
          confidence tiers, master taxonomies, and Batch 001 seeded with 50 producers.
        </p>
        <p className="meta">
          <Link href="/" style={{ color: "var(--accent)" }}>
            ← Back to Beat Lab command center
          </Link>
        </p>
      </header>

      <section className="card" style={{ marginBottom: "1rem" }}>
        <h3>Search</h3>
        <div className="grid">
          <input
            placeholder="Name, region, scene, DNA angle"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <input
            placeholder="Region or country (e.g. Atlanta, Jamaica)"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          />
          <input
            placeholder="Genre (e.g. trap, dub, amapiano)"
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
          />
          <select value={role} onChange={(event) => setRole(event.target.value as ProducerRole | "")}>
            <option value="">Any role</option>
            {taxonomy?.taxonomy.roles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <select value={era} onChange={(event) => setEra(event.target.value as EraId | "")}>
            <option value="">Any era</option>
            {taxonomy?.taxonomy.eras.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={minTier}
            onChange={(event) => setMinTier(event.target.value as ConfidenceTier | "")}
          >
            <option value="">Any historical-fact tier</option>
            {taxonomy?.taxonomy.confidenceTiers.map((item) => (
              <option key={item.tier} value={item.tier}>
                Tier {item.tier} or better
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: "0.65rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => void runSearch()} disabled={busy}>
            Search
          </button>
          <button
            className="secondary"
            onClick={() => {
              setQuery("");
              setRegion("");
              setGenre("");
              setRole("");
              setEra("");
              setMinTier("");
              void runSearch({
                query: "",
                region: "",
                genre: "",
                role: "",
                era: "",
                minTier: ""
              });
            }}
            disabled={busy}
          >
            Reset
          </button>
        </div>
      </section>

      {results && (
        <section className="card" style={{ marginBottom: "1rem" }}>
          <h3>Database state</h3>
          <p className="meta">
            {results.stats.totalProducers} producers · average DNA score{" "}
            {results.stats.averageDnaScore}/10 · {results.stats.pendingOpenQuestions} open research
            questions
          </p>
          <div>
            {(Object.keys(results.stats.byTier) as ConfidenceTier[]).map((tier) => (
              <span
                className="pill"
                key={tier}
                style={{ borderColor: TIER_COLORS[tier], color: TIER_COLORS[tier] }}
              >
                Tier {tier}: {results.stats.byTier[tier]}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="layout">
        <aside className="panel sidebar" style={{ maxHeight: 720, overflowY: "auto" }}>
          <div className="meta" style={{ marginBottom: "0.5rem" }}>Producers ({sortedResults.length})</div>
          <div className="tab-list">
            {sortedResults.map((producer) => (
              <button
                key={producer.id}
                className={`tab-item ${selectedProfile?.producer.id === producer.id ? "active" : ""}`}
                onClick={() => void loadProfile(producer.id)}
              >
                <div style={{ fontWeight: 600 }}>{producer.name}</div>
                <div className="meta" style={{ fontSize: "0.78rem" }}>
                  {producer.id} · {producer.country}
                  {producer.region ? ` / ${producer.region}` : ""} · avg {producer.averageScore}/10
                </div>
              </button>
            ))}
          </div>
        </aside>
        <section className="panel main">
          {!selectedProfile && (
            <div className="card">
              <h3>Select a producer</h3>
              <p className="meta">Pick a producer from the left to load the full DNA profile.</p>
            </div>
          )}
          {selectedProfile && <ProfileView profile={selectedProfile} />}
        </section>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h3>Batch roadmap</h3>
        <p className="meta">
          Operating order: metadata first → source verification → key works → listening analysis →
          DNA summary → type-beat translation → originality warnings → iteration matrix → scoring →
          open questions.
        </p>
        <div className="grid">
          {batches.map((batch) => (
            <div key={batch.id} className="card" style={{ background: "#0f1220" }}>
              <h3>
                {batch.id} · {batch.title}
              </h3>
              <p className="meta">
                Target {batch.targetCount} producers · {batch.status}
              </p>
              <p className="meta">{batch.focus}</p>
            </div>
          ))}
        </div>
      </section>

      {taxonomy && (
        <section className="card" style={{ marginTop: "1rem" }}>
          <h3>Confidence tiers</h3>
          <ul className="list">
            {taxonomy.taxonomy.confidenceTiers.map((item) => (
              <li key={item.tier}>
                <span
                  className="pill"
                  style={{ borderColor: TIER_COLORS[item.tier], color: TIER_COLORS[item.tier] }}
                >
                  Tier {item.tier}
                </span>
                {item.meaning}
              </li>
            ))}
          </ul>

          <h3 style={{ marginTop: "1rem" }}>Recommended sources</h3>
          <ul className="list">
            {taxonomy.taxonomy.recommendedSources.map((source) => (
              <li key={source.id}>
                <strong>{source.label}</strong> — {source.purpose}{" "}
                <span className="meta">({source.licenseNote})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="status">{busy ? "Working..." : status}</div>
    </main>
  );
}

function ProfileView({ profile }: { profile: ProducerProfile }): React.JSX.Element {
  const { producer, capsule, scoring, eras, openQuestions } = profile;
  const scoringEntries = Object.entries(scoring) as Array<
    [keyof typeof scoring, number]
  >;
  return (
    <div className="grid">
      <div className="card">
        <h3>
          {producer.name}
          {producer.realName ? ` (${producer.realName})` : ""}
        </h3>
        <p className="meta">
          {producer.id} · {producer.country}
          {producer.region ? ` / ${producer.region}` : ""} · {producer.activeYears}
        </p>
        <div style={{ marginBottom: "0.4rem" }}>
          {producer.primaryRoles.map((value) => (
            <span className="pill" key={value}>
              {value}
            </span>
          ))}
        </div>
        <div>
          {capsule.primaryGenres.map((value) => (
            <span className="pill" key={value}>
              {value}
            </span>
          ))}
        </div>
        <div className="meta" style={{ marginTop: "0.4rem" }}>
          Eras:{" "}
          {eras.map((era) => (
            <span className="pill" key={era}>
              {era}
            </span>
          ))}
        </div>
        <div className="meta" style={{ marginTop: "0.4rem" }}>
          Historical-fact tier: {capsule.researchConfidence.historicalFacts} · Audible-analysis tier:{" "}
          {capsule.researchConfidence.audibleAnalysis}
        </div>
      </div>

      <div className="card">
        <h3>Core DNA angle</h3>
        <p>{capsule.coreDnaAngle}</p>
        <h3>Signature sound</h3>
        <p>{capsule.signatureSoundSummary}</p>
      </div>

      <div className="card">
        <h3>Analytical DNA (Tier {capsule.researchConfidence.audibleAnalysis})</h3>
        <div className="mono">
          Artistic: {capsule.artisticDna}
          {"\n\n"}
          Technical: {capsule.technicalDna}
          {"\n\n"}
          Rhythmic: {capsule.rhythmicDna}
          {"\n\n"}
          Melodic / Harmonic: {capsule.melodicHarmonicDna}
          {"\n\n"}
          Arrangement: {capsule.arrangementDna}
        </div>
      </div>

      <div className="card">
        <h3>Creative direction (ethics-aware)</h3>
        <div className="mono">
          Inspired direction: {capsule.inspiredDirection}
          {"\n\n"}
          Originality twist: {capsule.originalityTwist}
        </div>
      </div>

      <div className="card">
        <h3>DNA scoring (1–10 per dimension)</h3>
        <ul className="list">
          {scoringEntries.map(([dimension, value]) => (
            <li key={dimension}>
              {dimension}: {value}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Open research questions ({openQuestions.length})</h3>
        <ul className="list">
          {openQuestions.map((question, idx) => (
            <li key={`${producer.id}-q-${idx}`}>
              {question.question}{" "}
              <span className="meta">→ unlock tier {question.targetTier}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
