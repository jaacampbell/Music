"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ProducerDnaRecord,
  ProducerSummary
} from "@/lib/producer-dna/types";

interface Taxonomy {
  eras: string[];
  genres: string[];
  producerRoles: string[];
  creditRoles: string[];
  sourceTypes: string[];
  gearClaimStatuses: string[];
  confidenceTiers: string[];
  confidenceTierLabels: Record<string, string>;
  scoringAxes: string[];
  roadmap: Array<{ id: string; number: number; title: string; focus: string }>;
}

interface Stats {
  totalProducers: number;
  byConfidence: Record<string, number>;
  byPrimaryRegion: Array<{ region: string; count: number }>;
  byTopGenre: Array<{ genre: string; count: number }>;
  byEra: Array<{ era: string; count: number }>;
  scoredProducerCount: number;
  averageScoreOverall: number | null;
  totalWorks: number;
  totalCredits: number;
  totalSources: number;
  totalGearClaims: number;
  roadmap: Taxonomy["roadmap"];
}

const fetcher = async <T,>(url: string, init?: RequestInit): Promise<T> => {
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

const formatTitle = (value: string): string =>
  value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function ProducerDnaPanel(): React.JSX.Element {
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [producers, setProducers] = useState<ProducerSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [record, setRecord] = useState<ProducerDnaRecord | null>(null);
  const [filters, setFilters] = useState<{
    q: string;
    era: string;
    genre: string;
    role: string;
    region: string;
    confidence: string;
  }>({ q: "", era: "", genre: "", role: "", region: "", confidence: "" });
  const [status, setStatus] = useState<string>("Ready");
  const [busy, setBusy] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "metadata" | "dna" | "creative" | "sources" | "score"
  >("overview");

  const [creditDraft, setCreditDraft] = useState({
    workTitle: "",
    primaryArtist: "",
    role: "producer",
    notes: "",
    researchConfidence: "C"
  });
  const [sourceDraft, setSourceDraft] = useState({
    url: "",
    sourceType: "musicbrainz",
    reliabilityTier: "C",
    claimSupported: "",
    quote: ""
  });
  const [gearDraft, setGearDraft] = useState({
    category: "sampler",
    item: "",
    status: "reported",
    notes: ""
  });
  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>({});
  const [creativeDraft, setCreativeDraft] = useState({
    kind: "inspired-direction" as
      | "inspired-direction"
      | "creative-iteration"
      | "originality-warning"
      | "fusion-path"
      | "prompt-export",
    title: "",
    description: "",
    ethicsNote: "",
    index: 1,
    prompt: "",
    twist: "",
    category: "melody",
    detail: "",
    partner: "",
    partnerKind: "genre",
    target: "beat-making"
  });
  const [createDraft, setCreateDraft] = useState({
    name: "",
    country: "",
    region: "",
    coreDnaAngle: "",
    researchConfidence: "E"
  });

  const refresh = async (preserveSelection = true): Promise<void> => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    const data = await fetcher<{ producers: ProducerSummary[] }>(
      `/api/producers?${params.toString()}`
    );
    setProducers(data.producers);
    const statsData = await fetcher<{ stats: Stats }>("/api/producers/stats");
    setStats(statsData.stats);
    if (!preserveSelection && data.producers.length > 0) {
      setSelectedId(data.producers[0].id);
    }
  };

  const loadRecord = async (id: string): Promise<void> => {
    const data = await fetcher<{ record: ProducerDnaRecord }>(
      `/api/producers/${id}`
    );
    setRecord(data.record);
  };

  useEffect(() => {
    void (async () => {
      try {
        const tax = await fetcher<Taxonomy>("/api/producers/taxonomy");
        setTaxonomy(tax);
        await refresh(false);
        const initialData = await fetcher<{ producers: ProducerSummary[] }>(
          "/api/producers"
        );
        if (initialData.producers.length > 0) {
          setSelectedId(initialData.producers[0].id);
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load");
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setRecord(null);
      return;
    }
    void loadRecord(selectedId);
  }, [selectedId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void refresh().catch((error) =>
        setStatus(error instanceof Error ? error.message : "Filter failed")
      );
    }, 250);
    return () => clearTimeout(handle);
  }, [filters]);

  const withBusy = async (task: () => Promise<void>): Promise<void> => {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const submitCredit = (): Promise<void> =>
    withBusy(async () => {
      if (!selectedId) return;
      await fetcher(`/api/producers/${selectedId}/credits`, {
        method: "POST",
        body: JSON.stringify(creditDraft)
      });
      setStatus(`Added credit for ${creditDraft.workTitle || "untitled work"}`);
      setCreditDraft({ ...creditDraft, workTitle: "", primaryArtist: "", notes: "" });
      await loadRecord(selectedId);
      await refresh();
    });

  const submitSource = (): Promise<void> =>
    withBusy(async () => {
      if (!selectedId) return;
      await fetcher(`/api/producers/${selectedId}/sources`, {
        method: "POST",
        body: JSON.stringify({
          ...sourceDraft,
          url: sourceDraft.url || undefined
        })
      });
      setStatus("Source added");
      setSourceDraft({ ...sourceDraft, url: "", claimSupported: "", quote: "" });
      await loadRecord(selectedId);
      await refresh();
    });

  const submitGear = (): Promise<void> =>
    withBusy(async () => {
      if (!selectedId) return;
      await fetcher(`/api/producers/${selectedId}/gear`, {
        method: "POST",
        body: JSON.stringify(gearDraft)
      });
      setStatus(`Gear claim added: ${gearDraft.item}`);
      setGearDraft({ ...gearDraft, item: "", notes: "" });
      await loadRecord(selectedId);
      await refresh();
    });

  const submitScore = (): Promise<void> =>
    withBusy(async () => {
      if (!selectedId || !taxonomy) return;
      const payload: Record<string, number | string> = {};
      for (const axis of taxonomy.scoringAxes) {
        const value = scoreDraft[axis];
        if (value && !Number.isNaN(Number(value))) {
          payload[axis] = Number(value);
        }
      }
      if (Object.keys(payload).length === 0) {
        setStatus("Enter at least one axis 1–10 before saving.");
        return;
      }
      await fetcher(`/api/producers/${selectedId}/score`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      setStatus("Score updated");
      await loadRecord(selectedId);
      await refresh();
    });

  const submitCreative = (): Promise<void> =>
    withBusy(async () => {
      if (!selectedId) return;
      let body: Record<string, unknown> = { kind: creativeDraft.kind };
      switch (creativeDraft.kind) {
        case "inspired-direction":
          body = {
            ...body,
            title: creativeDraft.title,
            description: creativeDraft.description,
            ethicsNote: creativeDraft.ethicsNote
          };
          break;
        case "creative-iteration":
          body = {
            ...body,
            index: creativeDraft.index,
            title: creativeDraft.title,
            prompt: creativeDraft.prompt,
            twist: creativeDraft.twist
          };
          break;
        case "originality-warning":
          body = {
            ...body,
            category: creativeDraft.category,
            detail: creativeDraft.detail
          };
          break;
        case "fusion-path":
          body = {
            ...body,
            partner: creativeDraft.partner,
            partnerKind: creativeDraft.partnerKind,
            description: creativeDraft.description
          };
          break;
        case "prompt-export":
          body = {
            ...body,
            target: creativeDraft.target,
            prompt: creativeDraft.prompt
          };
          break;
      }
      await fetcher(`/api/producers/${selectedId}/creative`, {
        method: "POST",
        body: JSON.stringify(body)
      });
      setStatus(`Creative artifact added: ${creativeDraft.kind}`);
      await loadRecord(selectedId);
      await refresh();
    });

  const submitCreate = (): Promise<void> =>
    withBusy(async () => {
      if (!createDraft.name || !createDraft.coreDnaAngle) {
        setStatus("Name and Core DNA angle are required.");
        return;
      }
      const data = await fetcher<{ producer: { id: string } }>(
        "/api/producers",
        {
          method: "POST",
          body: JSON.stringify(createDraft)
        }
      );
      setStatus(`Created producer ${data.producer.id}`);
      setCreateDraft({
        name: "",
        country: "",
        region: "",
        coreDnaAngle: "",
        researchConfidence: "E"
      });
      await refresh();
      setSelectedId(data.producer.id);
    });

  const subTabs = useMemo(
    () =>
      [
        { id: "overview", label: "Overview" },
        { id: "metadata", label: "Verified Metadata" },
        { id: "dna", label: "Analytical DNA" },
        { id: "creative", label: "Creative Direction" },
        { id: "sources", label: "Sources & Gear" },
        { id: "score", label: "Score Rubric" }
      ] as const,
    []
  );

  if (!taxonomy) {
    return (
      <div className="card">
        <h3>Loading Producer DNA Research Base…</h3>
      </div>
    );
  }

  return (
    <div className="pdna-root">
      <div className="grid">
        <div className="card">
          <h3>Producer DNA Research Base</h3>
          <p className="meta">
            Three-layer architecture: verified metadata → analytical DNA →
            creative direction. Every claim should carry a confidence tier
            (A/B/C/D/E/Unknown).
          </p>
          {stats && (
            <div className="mono">
              Producers: {stats.totalProducers} | Scored:{" "}
              {stats.scoredProducerCount} (avg {stats.averageScoreOverall ?? "–"}) |
              Works: {stats.totalWorks} | Credits: {stats.totalCredits} | Sources:{" "}
              {stats.totalSources} | Gear claims: {stats.totalGearClaims}
            </div>
          )}
          {stats && (
            <div className="meta" style={{ marginTop: 8 }}>
              By confidence:{" "}
              {Object.entries(stats.byConfidence)
                .map(([tier, count]) => `${tier}:${count}`)
                .join("  ")}
            </div>
          )}
        </div>
        <div className="card">
          <h3>Batch roadmap</h3>
          <ul className="list">
            {taxonomy.roadmap.slice(0, 5).map((batch) => (
              <li key={batch.id}>
                <strong>Batch {String(batch.number).padStart(3, "0")} — {batch.title}</strong>
                <div className="meta">{batch.focus}</div>
              </li>
            ))}
          </ul>
          <div className="meta">
            +{taxonomy.roadmap.length - 5} more batches queued.
          </div>
        </div>
      </div>

      <div className="pdna-toolbar">
        <input
          placeholder="Search name, scene, DNA angle"
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
        />
        <select
          value={filters.era}
          onChange={(event) => setFilters({ ...filters, era: event.target.value })}
        >
          <option value="">Era: any</option>
          {taxonomy.eras.map((era) => (
            <option key={era} value={era}>
              {formatTitle(era)}
            </option>
          ))}
        </select>
        <select
          value={filters.genre}
          onChange={(event) => setFilters({ ...filters, genre: event.target.value })}
        >
          <option value="">Genre: any</option>
          {taxonomy.genres.map((genre) => (
            <option key={genre} value={genre}>
              {formatTitle(genre)}
            </option>
          ))}
        </select>
        <select
          value={filters.role}
          onChange={(event) => setFilters({ ...filters, role: event.target.value })}
        >
          <option value="">Role: any</option>
          {taxonomy.producerRoles.map((role) => (
            <option key={role} value={role}>
              {formatTitle(role)}
            </option>
          ))}
        </select>
        <input
          placeholder="Region contains…"
          value={filters.region}
          onChange={(event) => setFilters({ ...filters, region: event.target.value })}
        />
        <select
          value={filters.confidence}
          onChange={(event) =>
            setFilters({ ...filters, confidence: event.target.value })
          }
        >
          <option value="">Tier: any</option>
          {taxonomy.confidenceTiers.map((tier) => (
            <option key={tier} value={tier}>
              Tier {tier}
            </option>
          ))}
        </select>
      </div>

      <div className="pdna-layout">
        <aside className="pdna-list panel">
          <div className="meta">{producers.length} producers</div>
          <ul className="pdna-producers">
            {producers.map((producer) => (
              <li
                key={producer.id}
                className={`pdna-producer ${selectedId === producer.id ? "active" : ""}`}
                onClick={() => setSelectedId(producer.id)}
              >
                <div className="pdna-name">{producer.name}</div>
                <div className="meta">
                  {producer.id} · Tier {producer.researchConfidence}
                  {producer.scoreAverage !== null
                    ? ` · ${producer.scoreAverage}/10`
                    : ""}
                </div>
                <div className="meta">{producer.coreDnaAngle}</div>
              </li>
            ))}
          </ul>
        </aside>
        <section className="pdna-detail panel">
          {!record ? (
            <div className="meta">Select a producer to view their full DNA record.</div>
          ) : (
            <>
              <header className="pdna-header">
                <div>
                  <h3>
                    {record.producer.name}{" "}
                    <span className="meta">({record.producer.id})</span>
                  </h3>
                  <div className="meta">
                    {[record.producer.city, record.producer.region, record.producer.country]
                      .filter(Boolean)
                      .join(" · ")}{" "}
                    · Confidence Tier {record.producer.researchConfidence}
                  </div>
                </div>
                <div>
                  {record.producer.primaryGenres.map((genre) => (
                    <span className="pill" key={genre}>
                      {formatTitle(genre)}
                    </span>
                  ))}
                </div>
              </header>
              <p>
                <strong>Core DNA angle.</strong> {record.producer.coreDnaAngle}
              </p>

              <nav className="pdna-subtabs">
                {subTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`tab-item ${activeSubTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveSubTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {activeSubTab === "overview" && (
                <div className="grid">
                  <div className="card">
                    <h3>Profile (Layer 2)</h3>
                    <p>{record.profile.longForm}</p>
                    <div className="meta">
                      Analysis confidence: {record.profile.analysisConfidence}
                    </div>
                  </div>
                  <div className="card">
                    <h3>Scope</h3>
                    <div className="meta">
                      Eras: {record.producer.primaryEras.map(formatTitle).join(", ") || "—"}
                    </div>
                    <div className="meta">
                      Roles: {record.producer.primaryRoles.map(formatTitle).join(", ") || "—"}
                    </div>
                    <div className="meta">
                      Scenes: {record.producer.primaryScenes.join(", ") || "—"}
                    </div>
                  </div>
                  <div className="card">
                    <h3>Counts</h3>
                    <div className="mono">
                      Works: {record.works.length} · Credits: {record.credits.length} ·
                      Sources: {record.sources.length} · Gear: {record.gearClaims.length}
                      {"\n"}
                      Inspired: {record.inspiredDirections.length} · Iterations:{" "}
                      {record.creativeIterations.length} · Warnings:{" "}
                      {record.originalityWarnings.length} · Fusion: {record.fusionPaths.length}
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === "metadata" && (
                <div className="grid">
                  <div className="card">
                    <h3>Add credit</h3>
                    <input
                      placeholder="Work title"
                      value={creditDraft.workTitle}
                      onChange={(event) =>
                        setCreditDraft({ ...creditDraft, workTitle: event.target.value })
                      }
                    />
                    <input
                      placeholder="Primary artist"
                      value={creditDraft.primaryArtist}
                      onChange={(event) =>
                        setCreditDraft({
                          ...creditDraft,
                          primaryArtist: event.target.value
                        })
                      }
                    />
                    <select
                      value={creditDraft.role}
                      onChange={(event) =>
                        setCreditDraft({ ...creditDraft, role: event.target.value })
                      }
                    >
                      {taxonomy.creditRoles.map((role) => (
                        <option key={role} value={role}>
                          {formatTitle(role)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={creditDraft.researchConfidence}
                      onChange={(event) =>
                        setCreditDraft({
                          ...creditDraft,
                          researchConfidence: event.target.value
                        })
                      }
                    >
                      {taxonomy.confidenceTiers.map((tier) => (
                        <option key={tier} value={tier}>
                          Tier {tier}
                        </option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Notes"
                      value={creditDraft.notes}
                      onChange={(event) =>
                        setCreditDraft({ ...creditDraft, notes: event.target.value })
                      }
                    />
                    <button onClick={() => void submitCredit()} disabled={busy}>
                      Add credit
                    </button>
                  </div>
                  <div className="card">
                    <h3>Credits ({record.credits.length})</h3>
                    <ul className="list">
                      {record.credits.map((credit) => (
                        <li key={credit.id}>
                          <strong>{credit.workTitle ?? "Untitled work"}</strong>
                          {credit.primaryArtist ? ` — ${credit.primaryArtist}` : ""}
                          <div className="meta">
                            {formatTitle(credit.role)} · Tier {credit.researchConfidence}
                          </div>
                        </li>
                      ))}
                      {record.credits.length === 0 && (
                        <li className="meta">No credits captured yet.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {activeSubTab === "dna" && (
                <div className="grid">
                  {(
                    [
                      ["sonicDna", "Sonic DNA"],
                      ["rhythmicDna", "Rhythmic DNA"],
                      ["melodicHarmonicDna", "Melodic / Harmonic DNA"],
                      ["arrangementDna", "Arrangement DNA"],
                      ["mixingDna", "Mixing DNA"],
                      ["samplingDna", "Sampling DNA"],
                      ["styleNuanceMap", "Style Nuance Map"]
                    ] as const
                  ).map(([key, label]) => {
                    const value = record.profile[key] as Record<string, unknown>;
                    return (
                      <div className="card" key={key}>
                        <h3>{label}</h3>
                        <div className="mono">
                          {JSON.stringify(value, null, 2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeSubTab === "creative" && (
                <div className="grid">
                  <div className="card">
                    <h3>Add creative artifact</h3>
                    <select
                      value={creativeDraft.kind}
                      onChange={(event) =>
                        setCreativeDraft({
                          ...creativeDraft,
                          kind: event.target.value as typeof creativeDraft.kind
                        })
                      }
                    >
                      <option value="inspired-direction">Inspired Direction</option>
                      <option value="creative-iteration">Creative Iteration</option>
                      <option value="originality-warning">Originality Warning</option>
                      <option value="fusion-path">Fusion Path</option>
                      <option value="prompt-export">Prompt Export</option>
                    </select>
                    {creativeDraft.kind === "inspired-direction" && (
                      <>
                        <input
                          placeholder="Title"
                          value={creativeDraft.title}
                          onChange={(event) =>
                            setCreativeDraft({ ...creativeDraft, title: event.target.value })
                          }
                        />
                        <textarea
                          placeholder="Description (ethical type-beat translation, no imitation)"
                          value={creativeDraft.description}
                          onChange={(event) =>
                            setCreativeDraft({
                              ...creativeDraft,
                              description: event.target.value
                            })
                          }
                        />
                        <textarea
                          placeholder="Ethics note (what to avoid)"
                          value={creativeDraft.ethicsNote}
                          onChange={(event) =>
                            setCreativeDraft({
                              ...creativeDraft,
                              ethicsNote: event.target.value
                            })
                          }
                        />
                      </>
                    )}
                    {creativeDraft.kind === "creative-iteration" && (
                      <>
                        <input
                          type="number"
                          min={1}
                          value={creativeDraft.index}
                          onChange={(event) =>
                            setCreativeDraft({
                              ...creativeDraft,
                              index: Number(event.target.value) || 1
                            })
                          }
                        />
                        <input
                          placeholder="Iteration title"
                          value={creativeDraft.title}
                          onChange={(event) =>
                            setCreativeDraft({ ...creativeDraft, title: event.target.value })
                          }
                        />
                        <textarea
                          placeholder="Prompt"
                          value={creativeDraft.prompt}
                          onChange={(event) =>
                            setCreativeDraft({ ...creativeDraft, prompt: event.target.value })
                          }
                        />
                        <textarea
                          placeholder="Originality twist"
                          value={creativeDraft.twist}
                          onChange={(event) =>
                            setCreativeDraft({ ...creativeDraft, twist: event.target.value })
                          }
                        />
                      </>
                    )}
                    {creativeDraft.kind === "originality-warning" && (
                      <>
                        <select
                          value={creativeDraft.category}
                          onChange={(event) =>
                            setCreativeDraft({
                              ...creativeDraft,
                              category: event.target.value
                            })
                          }
                        >
                          <option value="melody">Melody</option>
                          <option value="drum-pattern">Drum pattern</option>
                          <option value="vocal-tag">Vocal tag</option>
                          <option value="exact-chain">Exact chain</option>
                          <option value="recognizable-sample">Recognizable sample</option>
                          <option value="arrangement-habit">Arrangement habit</option>
                        </select>
                        <textarea
                          placeholder="Detail what should NOT be copied"
                          value={creativeDraft.detail}
                          onChange={(event) =>
                            setCreativeDraft({ ...creativeDraft, detail: event.target.value })
                          }
                        />
                      </>
                    )}
                    {creativeDraft.kind === "fusion-path" && (
                      <>
                        <select
                          value={creativeDraft.partnerKind}
                          onChange={(event) =>
                            setCreativeDraft({
                              ...creativeDraft,
                              partnerKind: event.target.value
                            })
                          }
                        >
                          <option value="producer">Another producer</option>
                          <option value="genre">A genre</option>
                          <option value="region">A region</option>
                          <option value="emotional-target">An emotional target</option>
                        </select>
                        <input
                          placeholder="Partner name / label"
                          value={creativeDraft.partner}
                          onChange={(event) =>
                            setCreativeDraft({
                              ...creativeDraft,
                              partner: event.target.value
                            })
                          }
                        />
                        <textarea
                          placeholder="How to fuse"
                          value={creativeDraft.description}
                          onChange={(event) =>
                            setCreativeDraft({
                              ...creativeDraft,
                              description: event.target.value
                            })
                          }
                        />
                      </>
                    )}
                    {creativeDraft.kind === "prompt-export" && (
                      <>
                        <select
                          value={creativeDraft.target}
                          onChange={(event) =>
                            setCreativeDraft({
                              ...creativeDraft,
                              target: event.target.value
                            })
                          }
                        >
                          <option value="beat-making">Beat-making</option>
                          <option value="song-direction">Song direction</option>
                          <option value="daw-session">DAW session</option>
                          <option value="stem-generation">Stem generation</option>
                          <option value="mix-reference">Mix reference</option>
                          <option value="artist-coaching">Artist coaching</option>
                        </select>
                        <textarea
                          placeholder="Clean, rights-safe prompt"
                          value={creativeDraft.prompt}
                          onChange={(event) =>
                            setCreativeDraft({
                              ...creativeDraft,
                              prompt: event.target.value
                            })
                          }
                        />
                      </>
                    )}
                    <button onClick={() => void submitCreative()} disabled={busy}>
                      Add artifact
                    </button>
                  </div>
                  <div className="card">
                    <h3>Inspired directions</h3>
                    <ul className="list">
                      {record.inspiredDirections.map((row) => (
                        <li key={row.id}>
                          <strong>{row.title}</strong>
                          <div className="meta">{row.description}</div>
                          <div className="meta">Ethics: {row.ethicsNote}</div>
                        </li>
                      ))}
                      {record.inspiredDirections.length === 0 && (
                        <li className="meta">None yet.</li>
                      )}
                    </ul>
                  </div>
                  <div className="card">
                    <h3>Originality warnings</h3>
                    <ul className="list">
                      {record.originalityWarnings.map((row) => (
                        <li key={row.id}>
                          <strong>{formatTitle(row.category)}.</strong> {row.detail}
                        </li>
                      ))}
                      {record.originalityWarnings.length === 0 && (
                        <li className="meta">None yet.</li>
                      )}
                    </ul>
                  </div>
                  <div className="card">
                    <h3>Iterations / fusion / exports</h3>
                    <div className="meta">
                      Iterations: {record.creativeIterations.length} · Fusion paths:{" "}
                      {record.fusionPaths.length} · Prompt exports:{" "}
                      {record.promptExports.length}
                    </div>
                    <ul className="list">
                      {record.creativeIterations.map((row) => (
                        <li key={row.id}>
                          #{row.index} {row.title} — <span className="meta">{row.twist}</span>
                        </li>
                      ))}
                      {record.fusionPaths.map((row) => (
                        <li key={row.id}>
                          Fuse with {row.partner} ({formatTitle(row.partnerKind)}) —{" "}
                          <span className="meta">{row.description}</span>
                        </li>
                      ))}
                      {record.promptExports.map((row) => (
                        <li key={row.id}>
                          {formatTitle(row.target)}:{" "}
                          <span className="meta">{row.prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeSubTab === "sources" && (
                <div className="grid">
                  <div className="card">
                    <h3>Add source</h3>
                    <input
                      placeholder="URL (optional)"
                      value={sourceDraft.url}
                      onChange={(event) =>
                        setSourceDraft({ ...sourceDraft, url: event.target.value })
                      }
                    />
                    <select
                      value={sourceDraft.sourceType}
                      onChange={(event) =>
                        setSourceDraft({ ...sourceDraft, sourceType: event.target.value })
                      }
                    >
                      {taxonomy.sourceTypes.map((type) => (
                        <option key={type} value={type}>
                          {formatTitle(type)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={sourceDraft.reliabilityTier}
                      onChange={(event) =>
                        setSourceDraft({
                          ...sourceDraft,
                          reliabilityTier: event.target.value
                        })
                      }
                    >
                      {taxonomy.confidenceTiers.map((tier) => (
                        <option key={tier} value={tier}>
                          Tier {tier} — {taxonomy.confidenceTierLabels[tier]}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Claim supported"
                      value={sourceDraft.claimSupported}
                      onChange={(event) =>
                        setSourceDraft({
                          ...sourceDraft,
                          claimSupported: event.target.value
                        })
                      }
                    />
                    <textarea
                      placeholder="Quote / summary"
                      value={sourceDraft.quote}
                      onChange={(event) =>
                        setSourceDraft({ ...sourceDraft, quote: event.target.value })
                      }
                    />
                    <button onClick={() => void submitSource()} disabled={busy}>
                      Add source
                    </button>
                  </div>
                  <div className="card">
                    <h3>Add gear claim</h3>
                    <select
                      value={gearDraft.category}
                      onChange={(event) =>
                        setGearDraft({ ...gearDraft, category: event.target.value })
                      }
                    >
                      <option value="daw">DAW</option>
                      <option value="sampler">Sampler</option>
                      <option value="synth">Synth</option>
                      <option value="drum-machine">Drum machine</option>
                      <option value="plugin">Plugin</option>
                      <option value="console">Console</option>
                      <option value="studio">Studio</option>
                      <option value="recording-method">Recording method</option>
                      <option value="outboard">Outboard</option>
                    </select>
                    <input
                      placeholder="Item (e.g. SP-1200, MPC3000, Pro Tools)"
                      value={gearDraft.item}
                      onChange={(event) =>
                        setGearDraft({ ...gearDraft, item: event.target.value })
                      }
                    />
                    <select
                      value={gearDraft.status}
                      onChange={(event) =>
                        setGearDraft({ ...gearDraft, status: event.target.value })
                      }
                    >
                      {taxonomy.gearClaimStatuses.map((status) => (
                        <option key={status} value={status}>
                          {formatTitle(status)}
                        </option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Notes"
                      value={gearDraft.notes}
                      onChange={(event) =>
                        setGearDraft({ ...gearDraft, notes: event.target.value })
                      }
                    />
                    <button onClick={() => void submitGear()} disabled={busy}>
                      Add gear claim
                    </button>
                  </div>
                  <div className="card">
                    <h3>Sources ({record.sources.length})</h3>
                    <ul className="list">
                      {record.sources.map((source) => (
                        <li key={source.id}>
                          <strong>{source.claimSupported}</strong>
                          <div className="meta">
                            {formatTitle(source.sourceType)} · Tier{" "}
                            {source.reliabilityTier} · {source.citationStatus}
                          </div>
                          {source.url && (
                            <div className="meta">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer noopener"
                              >
                                {source.url}
                              </a>
                            </div>
                          )}
                        </li>
                      ))}
                      {record.sources.length === 0 && (
                        <li className="meta">No sources captured yet.</li>
                      )}
                    </ul>
                  </div>
                  <div className="card">
                    <h3>Gear claims ({record.gearClaims.length})</h3>
                    <ul className="list">
                      {record.gearClaims.map((claim) => (
                        <li key={claim.id}>
                          <strong>{claim.item}</strong>
                          <div className="meta">
                            {formatTitle(claim.category)} · {formatTitle(claim.status)}
                          </div>
                        </li>
                      ))}
                      {record.gearClaims.length === 0 && (
                        <li className="meta">No gear claims yet.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {activeSubTab === "score" && (
                <div className="grid">
                  <div className="card">
                    <h3>Score 1–10 per axis</h3>
                    <div className="meta">
                      A producer can be 10 underground / 3 commercial. That is
                      valuable signal — not a popularity ranking.
                    </div>
                    {taxonomy.scoringAxes.map((axis) => (
                      <div key={axis} style={{ marginTop: 6 }}>
                        <label className="meta">{formatTitle(axis)}</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          placeholder={`${(record.score as Record<string, unknown>)[axis] ?? "–"}`}
                          value={scoreDraft[axis] ?? ""}
                          onChange={(event) =>
                            setScoreDraft({ ...scoreDraft, [axis]: event.target.value })
                          }
                        />
                      </div>
                    ))}
                    <button
                      style={{ marginTop: 10 }}
                      onClick={() => void submitScore()}
                      disabled={busy}
                    >
                      Save score
                    </button>
                  </div>
                  <div className="card">
                    <h3>Current scores</h3>
                    <div className="mono">
                      {JSON.stringify(record.score, null, 2)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <div className="card">
        <h3>Add new producer (extend Batch 001+)</h3>
        <div className="pdna-toolbar">
          <input
            placeholder="Name"
            value={createDraft.name}
            onChange={(event) =>
              setCreateDraft({ ...createDraft, name: event.target.value })
            }
          />
          <input
            placeholder="Country"
            value={createDraft.country}
            onChange={(event) =>
              setCreateDraft({ ...createDraft, country: event.target.value })
            }
          />
          <input
            placeholder="Region / city"
            value={createDraft.region}
            onChange={(event) =>
              setCreateDraft({ ...createDraft, region: event.target.value })
            }
          />
          <select
            value={createDraft.researchConfidence}
            onChange={(event) =>
              setCreateDraft({
                ...createDraft,
                researchConfidence: event.target.value
              })
            }
          >
            {taxonomy.confidenceTiers.map((tier) => (
              <option key={tier} value={tier}>
                Tier {tier}
              </option>
            ))}
          </select>
          <button onClick={() => void submitCreate()} disabled={busy}>
            Create producer
          </button>
        </div>
        <textarea
          placeholder="Core DNA angle (one sentence)"
          value={createDraft.coreDnaAngle}
          onChange={(event) =>
            setCreateDraft({ ...createDraft, coreDnaAngle: event.target.value })
          }
        />
      </div>

      <div className="status">{busy ? "Working…" : status}</div>
    </div>
  );
}
