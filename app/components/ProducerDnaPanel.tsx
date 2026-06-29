"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ConfidenceTier,
  ProducerDnaCapsule
} from "@/lib/producer-dna/types";

type Capsule = ProducerDnaCapsule & { overallScore: number };

interface LabeledTag {
  value: string;
  label: string;
}

interface FacetCount {
  value: string;
  label: string;
  count: number;
}

interface TaxonomyResponse {
  facets: { total: number; genres: FacetCount[]; eras: FacetCount[]; roles: FacetCount[] };
  dimensionLeaders: Array<{
    dimension: string;
    label: string;
    leader: { id: string; name: string; score: number };
  }>;
  confidenceTiers: Array<{ tier: ConfidenceTier; meaning: string }>;
  eras: LabeledTag[];
  roles: LabeledTag[];
  genres: string[];
  scoreDimensions: Array<{ key: string; label: string }>;
  sourceArchitecture: Array<{ source: string; role: string }>;
  profileBuildOrder: string[];
}

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
};

const tierColor = (tier: ConfidenceTier): string => {
  switch (tier) {
    case "A":
      return "#2ccf8f";
    case "B":
      return "#62b6ff";
    case "C":
      return "#e0c341";
    case "D":
      return "#c98bff";
    case "E":
      return "#ff9a62";
    default:
      return "#9ea6bc";
  }
};

const ConfidencePill = ({
  tier,
  prefix
}: {
  tier: ConfidenceTier;
  prefix: string;
}): React.JSX.Element => (
  <span
    className="pill"
    style={{ borderColor: tierColor(tier), color: tierColor(tier) }}
    title={`${prefix} confidence tier ${tier}`}
  >
    {prefix}: Tier {tier}
  </span>
);

export default function ProducerDnaPanel(): React.JSX.Element {
  const [taxonomy, setTaxonomy] = useState<TaxonomyResponse | null>(null);
  const [producers, setProducers] = useState<Capsule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [era, setEra] = useState("");
  const [role, setRole] = useState("");
  const [sort, setSort] = useState("id");
  const [showReference, setShowReference] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<TaxonomyResponse>("/api/producers/taxonomy")
      .then(setTaxonomy)
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (genre) params.set("genre", genre);
    if (era) params.set("era", era);
    if (role) params.set("role", role);
    if (sort) params.set("sort", sort);
    fetchJson<{ count: number; producers: Capsule[] }>(
      `/api/producers?${params.toString()}`
    )
      .then((data) => {
        setProducers(data.producers);
        if (data.producers.length > 0) {
          setSelectedId((current) =>
            current && data.producers.some((p) => p.id === current)
              ? current
              : data.producers[0].id
          );
        } else {
          setSelectedId(null);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Search failed"));
  }, [q, genre, era, role, sort]);

  const selected = useMemo(
    () => producers.find((p) => p.id === selectedId) ?? null,
    [producers, selectedId]
  );

  const resetFilters = (): void => {
    setQ("");
    setGenre("");
    setEra("");
    setRole("");
    setSort("id");
  };

  return (
    <div className="pdna">
      <div className="pdna-head">
        <div>
          <h3 style={{ margin: 0 }}>Producer DNA Research base</h3>
          <p className="meta" style={{ margin: "0.2rem 0 0" }}>
            {taxonomy ? `${taxonomy.facets.total} producers` : "Loading"} · Batch 001 ·
            verified facts separated from audible analysis
          </p>
        </div>
        <button
          className="pdna-ref-toggle"
          onClick={() => setShowReference((value) => !value)}
        >
          {showReference ? "Hide reference" : "Taxonomy & rubric"}
        </button>
      </div>

      {error ? <div className="meta" style={{ color: "#ff9a62" }}>{error}</div> : null}

      {showReference && taxonomy ? (
        <div className="grid" style={{ marginBottom: "0.85rem" }}>
          <div className="card">
            <h3>Research-confidence tiers</h3>
            <ul className="list">
              {taxonomy.confidenceTiers.map((tier) => (
                <li key={tier.tier}>
                  <span style={{ color: tierColor(tier.tier), fontWeight: 600 }}>
                    {tier.tier}
                  </span>
                  {" \u2014 "}
                  {tier.meaning}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Candidate source architecture</h3>
            <ul className="list">
              {taxonomy.sourceArchitecture.map((source) => (
                <li key={source.source}>
                  <strong>{source.source}</strong>: {source.role}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Scoring rubric (1\u201310, not popularity)</h3>
            <div>
              {taxonomy.scoreDimensions.map((dimension) => (
                <span className="pill" key={dimension.key}>
                  {dimension.label}
                </span>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Profile build order</h3>
            <ol className="list">
              {taxonomy.profileBuildOrder.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="card">
            <h3>Dimension leaders (analysis)</h3>
            <ul className="list">
              {taxonomy.dimensionLeaders.map((entry) => (
                <li key={entry.dimension}>
                  {entry.label}: {entry.leader.name} ({entry.leader.score}/10)
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Era / role coverage</h3>
            <div className="meta">Eras</div>
            <div>
              {taxonomy.facets.eras.map((eraFacet) => (
                <span className="pill" key={eraFacet.value}>
                  {eraFacet.label} ({eraFacet.count})
                </span>
              ))}
            </div>
            <div className="meta" style={{ marginTop: "0.4rem" }}>
              Roles
            </div>
            <div>
              {taxonomy.facets.roles.map((roleFacet) => (
                <span className="pill" key={roleFacet.value}>
                  {roleFacet.label} ({roleFacet.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="pdna-filters">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name, scene, genre, DNA text..."
        />
        <select value={genre} onChange={(event) => setGenre(event.target.value)}>
          <option value="">All genres</option>
          {(taxonomy?.facets.genres ?? []).map((genreFacet) => (
            <option key={genreFacet.value} value={genreFacet.value}>
              {genreFacet.label} ({genreFacet.count})
            </option>
          ))}
        </select>
        <select value={era} onChange={(event) => setEra(event.target.value)}>
          <option value="">All eras</option>
          {(taxonomy?.eras ?? []).map((eraTag) => (
            <option key={eraTag.value} value={eraTag.value}>
              {eraTag.label}
            </option>
          ))}
        </select>
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="">All roles</option>
          {(taxonomy?.roles ?? []).map((roleTag) => (
            <option key={roleTag.value} value={roleTag.value}>
              {roleTag.label}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="id">Sort: ID</option>
          <option value="name">Sort: Name</option>
          <option value="overall">Sort: Overall score</option>
          <option value="innovation">Sort: Innovation</option>
          <option value="influence">Sort: Influence</option>
          <option value="originality">Sort: Originality</option>
        </select>
        <button className="pdna-reset" onClick={resetFilters}>
          Reset
        </button>
      </div>

      <div className="pdna-body">
        <div className="pdna-list">
          <div className="meta" style={{ marginBottom: "0.4rem" }}>
            {producers.length} result{producers.length === 1 ? "" : "s"}
          </div>
          {producers.map((producer) => (
            <button
              key={producer.id}
              className={`pdna-row ${producer.id === selectedId ? "active" : ""}`}
              onClick={() => setSelectedId(producer.id)}
            >
              <div className="pdna-row-top">
                <strong>{producer.name}</strong>
                <span className="meta">{producer.overallScore}/10</span>
              </div>
              <div className="meta">{producer.regionScene}</div>
              <div className="mono" style={{ fontSize: "0.74rem" }}>
                {producer.id}
              </div>
            </button>
          ))}
          {producers.length === 0 ? (
            <div className="meta">No producers match these filters.</div>
          ) : null}
        </div>

        <div className="pdna-detail">
          {selected ? (
            <ProducerDetail producer={selected} />
          ) : (
            <div className="card">
              <h3>Select a producer</h3>
              <p className="meta">Pick an entry to view its DNA capsule.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <div className="pdna-score">
      <div className="pdna-score-label">
        <span>{label}</span>
        <span>{value}/10</span>
      </div>
      <div className="pdna-score-track">
        <div className="pdna-score-fill" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

const SCORE_FIELDS: Array<{ key: keyof ProducerDnaCapsule["scores"]; label: string }> = [
  { key: "innovation", label: "Innovation" },
  { key: "influence", label: "Influence" },
  { key: "technicalCraft", label: "Technical craft" },
  { key: "sonicIdentity", label: "Sonic identity" },
  { key: "arrangementSkill", label: "Arrangement skill" },
  { key: "rhythmDesign", label: "Rhythm design" },
  { key: "melodicHarmonicIdentity", label: "Melodic / harmonic" },
  { key: "soundDesign", label: "Sound design" },
  { key: "mixingAesthetics", label: "Mixing aesthetics" },
  { key: "culturalImportance", label: "Cultural importance" },
  { key: "commercialImpact", label: "Commercial impact" },
  { key: "undergroundImpact", label: "Underground impact" },
  { key: "longevity", label: "Longevity" },
  { key: "adaptability", label: "Adaptability" },
  { key: "originality", label: "Originality" }
];

const DNA_FIELDS: Array<{ key: keyof ProducerDnaCapsule; label: string }> = [
  { key: "artisticDna", label: "Artistic DNA" },
  { key: "technicalDna", label: "Technical DNA" },
  { key: "rhythmicDna", label: "Rhythmic DNA" },
  { key: "melodicHarmonicDna", label: "Melodic / harmonic DNA" },
  { key: "arrangementDna", label: "Arrangement DNA" }
];

function ProducerDetail({ producer }: { producer: Capsule }): React.JSX.Element {
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
      <div className="card">
        <div className="pdna-detail-head">
          <div>
            <h3 style={{ marginBottom: "0.2rem" }}>
              {producer.name} <span className="meta">{producer.id}</span>
            </h3>
            <div className="meta">
              {producer.countryRegion} · {producer.sceneMovement}
            </div>
          </div>
          <div className="meta" style={{ textAlign: "right" }}>
            Overall {producer.overallScore}/10
          </div>
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          <ConfidencePill tier={producer.factConfidence} prefix="Facts" />
          <ConfidencePill tier={producer.analysisConfidence} prefix="Analysis" />
        </div>
      </div>

      <div className="card">
        <h3>Verified metadata (Layer 1)</h3>
        <p className="meta">Real name: {producer.realName ?? "Unknown / not disclosed"}</p>
        <p className="meta">
          Aliases: {producer.aliases.length ? producer.aliases.join(", ") : "None recorded"}
        </p>
        <p className="meta">Primary genres: {producer.primaryGenres.join(", ")}</p>
        <div className="meta">Eras / roles:</div>
        <div>
          {producer.eras.map((eraTag) => (
            <span className="pill" key={eraTag}>
              {eraTag}
            </span>
          ))}
          {producer.roles.map((roleTag) => (
            <span className="pill" key={roleTag}>
              {roleTag}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Analytical DNA (Layer 2) — Tier {producer.analysisConfidence}</h3>
        <p>
          <strong>Core angle:</strong> {producer.coreDnaAngle}
        </p>
        <p>
          <strong>Signature sound:</strong> {producer.signatureSoundSummary}
        </p>
        {DNA_FIELDS.map((field) => (
          <p key={field.key as string} className="meta">
            <strong style={{ color: "var(--text)" }}>{field.label}:</strong>{" "}
            {producer[field.key] as string}
          </p>
        ))}
      </div>

      <div className="card">
        <h3>Creative direction (Layer 3)</h3>
        <p className="meta">
          <strong style={{ color: "var(--text)" }}>Type-beat direction:</strong>{" "}
          {producer.typeBeatDirection}
        </p>
        <p className="meta">
          <strong style={{ color: "var(--text)" }}>Originality twist:</strong>{" "}
          {producer.originalityTwist}
        </p>
      </div>

      <div className="card">
        <h3>DNA scoring rubric</h3>
        <div className="pdna-scores">
          {SCORE_FIELDS.map((field) => (
            <ScoreBar
              key={field.key}
              label={field.label}
              value={producer.scores[field.key]}
            />
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Research confidence</h3>
        <p className="meta">{producer.researchConfidenceNote}</p>
      </div>
    </div>
  );
}
