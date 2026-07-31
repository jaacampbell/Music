"use client";

import { useCallback, useEffect, useState } from "react";

interface SearchResult {
  producerId: string;
  name: string;
  region?: string;
  coreDnaAngle?: string;
  matchedLayer: string;
  confidence: string;
  snippet: string;
}

interface ProducerRecord {
  producer: {
    name: string;
    region?: string;
    country?: string;
    coreDnaAngle?: string;
    primaryScenes: string[];
  };
  capsule?: {
    signatureSoundSummary: string;
    artisticDna: string;
    technicalDna: string;
    rhythmicDna: string;
    melodicHarmonicDna: string;
    arrangementDna: string;
    primaryGenres: string[];
  };
  inspiredDirections: { direction: string }[];
  fusionPaths: { path: string }[];
  originalityWarnings: { warning: string }[];
  promptExports: { prompt: string }[];
}

interface Genre {
  id: string;
  label: string;
}

const LAYERS = ["all", "verified", "analytical", "creative"] as const;

export function ProducerDnaPanel({ trackName }: { trackName?: string }): React.JSX.Element {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [layer, setLayer] = useState<(typeof LAYERS)[number]>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<ProducerRecord | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/producer-dna/taxonomy")
      .then((r) => r.json())
      .then((d) => setGenres(d.genres ?? []))
      .catch(() => setGenres([]));
  }, []);

  const search = useCallback(async () => {
    setBusy(true);
    setSelected(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (genre) params.set("genre", genre);
      if (layer) params.set("layer", layer);
      params.set("limit", "8");
      const res = await fetch(`/api/producer-dna/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setBusy(false);
    }
  }, [query, genre, layer]);

  // Load an initial reference set on mount.
  useEffect(() => {
    void search();
  }, [search]);

  const openProducer = async (id: string): Promise<void> => {
    setBusy(true);
    try {
      const res = await fetch(`/api/producer-dna/${id}`);
      const data = await res.json();
      setSelected(data.record ?? null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel main" style={{ gridColumn: "1 / -1" }}>
      <h3 style={{ marginTop: 0 }}>
        Producer DNA references{trackName ? ` — for “${trackName}”` : ""}
      </h3>
      <p className="meta" style={{ marginTop: 0 }}>
        Explore the Producer DNA research DB to shape your separated stems (signature sound,
        rhythmic/melodic DNA, fusion paths, originality warnings).
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void search();
          }}
          placeholder="Search DNA (e.g. 808, minimal, ambient)"
          style={{
            flex: "1 1 220px",
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "#0f1220",
            color: "var(--text)",
            padding: "0.45rem 0.6rem"
          }}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)} style={sel}>
          <option value="">Any genre/scene</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        <select value={layer} onChange={(e) => setLayer(e.target.value as typeof layer)} style={sel}>
          {LAYERS.map((l) => (
            <option key={l} value={l}>
              {l} layer
            </option>
          ))}
        </select>
        <button onClick={() => void search()} disabled={busy} style={btn}>
          Search DNA
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: 360, overflowY: "auto" }}>
          {results.length === 0 && <p className="meta">No matches — broaden your search.</p>}
          {results.map((r) => (
            <button
              key={r.producerId}
              onClick={() => void openProducer(r.producerId)}
              className="card"
              style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--line)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <b>{r.name}</b>
                <span className="pill">{r.matchedLayer} · {r.confidence}</span>
              </div>
              {r.region && <div className="meta">{r.region}</div>}
              <div className="meta" style={{ marginTop: 4 }}>{r.snippet}</div>
            </button>
          ))}
        </div>

        <div className="card">
          {!selected && <p className="meta">Select a producer to see their DNA.</p>}
          {selected && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h3 style={{ margin: 0 }}>{selected.producer.name}</h3>
              <div className="meta">
                {[selected.producer.region, selected.producer.country].filter(Boolean).join(" · ")}
              </div>
              {selected.producer.coreDnaAngle && (
                <div className="mono">Core DNA: {selected.producer.coreDnaAngle}</div>
              )}
              {selected.capsule && (
                <>
                  <div className="meta"><b>Signature:</b> {selected.capsule.signatureSoundSummary}</div>
                  <div className="meta"><b>Rhythmic:</b> {selected.capsule.rhythmicDna}</div>
                  <div className="meta"><b>Melodic/harmonic:</b> {selected.capsule.melodicHarmonicDna}</div>
                  <div className="meta"><b>Arrangement:</b> {selected.capsule.arrangementDna}</div>
                  <div>
                    {selected.capsule.primaryGenres.map((g) => (
                      <span className="pill" key={g}>{g}</span>
                    ))}
                  </div>
                </>
              )}
              {selected.fusionPaths.length > 0 && (
                <div className="meta">
                  <b>Fusion paths:</b>
                  <ul className="list">
                    {selected.fusionPaths.slice(0, 3).map((f, i) => (
                      <li key={i}>{f.path}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.originalityWarnings.length > 0 && (
                <div className="meta">
                  <b>Originality guardrails:</b>
                  <ul className="list">
                    {selected.originalityWarnings.slice(0, 3).map((w, i) => (
                      <li key={i}>{w.warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const sel: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "#0f1220",
  color: "var(--text)",
  padding: "0.45rem 0.6rem"
};

const btn: React.CSSProperties = {
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "0.45rem 0.85rem",
  cursor: "pointer"
};
