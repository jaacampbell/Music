"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ConfidenceTier,
  ProducerRecord,
  ProducerScores,
  ProducerSummary
} from "@/lib/producer-types";

// ── API helpers ───────────────────────────────────────────────

const api = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
};

// ── Confidence tier display ───────────────────────────────────

const TIER_LABELS: Record<ConfidenceTier, string> = {
  A: "A — Primary source",
  B: "B — Multiple credible sources",
  C: "C — Open databases (unverified)",
  D: "D — Audible / musicological analysis",
  E: "E — Educated hypothesis",
  unknown: "Unknown — insufficient data"
};

const TIER_COLORS: Record<ConfidenceTier, string> = {
  A: "#2ccf8f",
  B: "#6b8cff",
  C: "#f0c040",
  D: "#e08c50",
  E: "#cc6680",
  unknown: "#9ea6bc"
};

const TierBadge = ({ tier }: { tier: ConfidenceTier }): React.JSX.Element => (
  <span
    className="pdna-tier"
    style={{ borderColor: TIER_COLORS[tier], color: TIER_COLORS[tier] }}
    title={TIER_LABELS[tier]}
  >
    {tier.toUpperCase()}
  </span>
);

// ── Score bar ─────────────────────────────────────────────────

const ScoreBar = ({ label, value }: { label: string; value: number }): React.JSX.Element => (
  <div className="pdna-score-row">
    <span className="pdna-score-label">{label}</span>
    <div className="pdna-score-track">
      <div
        className="pdna-score-fill"
        style={{ width: `${(value / 10) * 100}%` }}
      />
    </div>
    <span className="pdna-score-value">{value}</span>
  </div>
);

// ── Profile tabs ──────────────────────────────────────────────

const PROFILE_TABS = ["Overview", "Verified Data", "Sonic DNA", "Creative Direction"] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

// ── Main component ────────────────────────────────────────────

interface ApiListResponse {
  producers: ProducerSummary[];
  total: number;
  batchStats: Record<string, number>;
}

interface ApiDetailResponse {
  producer: ProducerRecord;
}

export default function ProducerDnaPage(): React.JSX.Element {
  const [summaries, setSummaries] = useState<ProducerSummary[]>([]);
  const [batchStats, setBatchStats] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProducerRecord | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>("Overview");
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [eraFilter, setEraFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");

  const loadList = useCallback(async (): Promise<void> => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (genreFilter) params.set("genre", genreFilter);
    if (eraFilter) params.set("era", eraFilter);
    if (regionFilter) params.set("region", regionFilter);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await api<ApiListResponse>(`/api/producers${query}`);
    setSummaries(data.producers);
    setBatchStats(data.batchStats);
  }, [search, genreFilter, eraFilter, regionFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    api<ApiDetailResponse>(`/api/producers/${selectedId}`)
      .then((data) => {
        setDetail(data.producer);
        setStatus(`Loaded: ${data.producer.name}`);
      })
      .catch((err: unknown) => {
        setStatus(err instanceof Error ? err.message : "Load error");
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const filteredSummaries = useMemo(() => summaries, [summaries]);

  const scoreEntries = useMemo((): Array<{ label: string; value: number }> => {
    if (!detail) return [];
    const s: ProducerScores = detail.scores;
    return [
      { label: "Innovation", value: s.innovation },
      { label: "Influence", value: s.influence },
      { label: "Technical Craft", value: s.technicalCraft },
      { label: "Sonic Identity", value: s.sonicIdentity },
      { label: "Arrangement", value: s.arrangementSkill },
      { label: "Rhythm Design", value: s.rhythmDesign },
      { label: "Melodic / Harmonic", value: s.melodicHarmonicIdentity },
      { label: "Sound Design", value: s.soundDesign },
      { label: "Mixing Aesthetics", value: s.mixingAesthetics },
      { label: "Cultural Importance", value: s.culturalImportance },
      { label: "Commercial Impact", value: s.commercialImpact },
      { label: "Underground Impact", value: s.undergroundImpact },
      { label: "Longevity", value: s.longevity },
      { label: "Adaptability", value: s.adaptability },
      { label: "Originality", value: s.originality }
    ];
  }, [detail]);

  const renderOverview = (): React.JSX.Element => {
    if (!detail) return <div />;
    const activeYears = detail.activeYearsStart
      ? `${detail.activeYearsStart}${detail.activeYearsEnd ? `–${detail.activeYearsEnd}` : "–present"}`
      : "Unknown";
    return (
      <div className="pdna-profile-body">
        <div className="pdna-grid-2">
          <div className="card">
            <h3>Identity</h3>
            <p className="meta">{detail.id}</p>
            {detail.realName && (
              <p>
                <strong>Real name:</strong> {detail.realName}
              </p>
            )}
            <p>
              <strong>Region:</strong> {detail.region}, {detail.country}
            </p>
            <p>
              <strong>Active:</strong> {activeYears}
            </p>
            {detail.aliases.length > 0 && (
              <p>
                <strong>Aliases:</strong> {detail.aliases.join(", ")}
              </p>
            )}
            <p>
              <strong>Confidence:</strong> <TierBadge tier={detail.overallConfidence} />
            </p>
          </div>
          <div className="card">
            <h3>Classification</h3>
            <div>
              <p className="meta" style={{ marginBottom: "0.4rem" }}>
                Genres
              </p>
              {detail.genres.map((g) => (
                <span className="pill" key={g}>
                  {g}
                </span>
              ))}
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <p className="meta" style={{ marginBottom: "0.4rem" }}>
                Eras
              </p>
              {detail.eras.map((e) => (
                <span className="pill pdna-era-pill" key={e}>
                  {e}
                </span>
              ))}
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <p className="meta" style={{ marginBottom: "0.4rem" }}>
                Roles
              </p>
              {detail.roles.map((r) => (
                <span className="pill pdna-role-pill" key={r}>
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: "0.85rem" }}>
          <h3>Core DNA angle</h3>
          <p className="pdna-core-angle">{detail.coreAngle}</p>
        </div>

        <div className="card" style={{ marginTop: "0.85rem" }}>
          <h3>Signature sound summary</h3>
          <p>{detail.signatureSoundSummary}</p>
        </div>

        <div className="card" style={{ marginTop: "0.85rem" }}>
          <h3>
            DNA scores{" "}
            <span className="meta" style={{ fontSize: "0.78rem", fontWeight: "normal" }}>
              (not a popularity ranking — each dimension is independent)
            </span>
          </h3>
          <div className="pdna-scores-grid">
            {scoreEntries.map((entry) => (
              <ScoreBar key={entry.label} label={entry.label} value={entry.value} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderVerifiedData = (): React.JSX.Element => {
    if (!detail) return <div />;
    return (
      <div className="pdna-profile-body">
        <div className="card">
          <h3>
            Artistic DNA{" "}
            <TierBadge tier="D" />
          </h3>
          <p>{detail.artisticDna}</p>
        </div>

        <div className="card" style={{ marginTop: "0.85rem" }}>
          <h3>
            Technical DNA{" "}
            <TierBadge tier="C" />
          </h3>
          <p>{detail.technicalDna}</p>
        </div>

        {detail.keyWorks.length > 0 ? (
          <div className="card" style={{ marginTop: "0.85rem" }}>
            <h3>Key works</h3>
            <table className="pdna-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Year</th>
                  <th>Role</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {detail.keyWorks.map((w, idx) => (
                  <tr key={idx}>
                    <td>{w.title}</td>
                    <td>{w.artist}</td>
                    <td>{w.year ?? "—"}</td>
                    <td>{w.role}</td>
                    <td>
                      <TierBadge tier={w.confidence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card pdna-pending" style={{ marginTop: "0.85rem" }}>
            <h3>Key works</h3>
            <p className="meta">
              Research pending. Cross-reference MusicBrainz (artist ID + recordings), Discogs
              (release credits), and Wikidata (producer property P162).
            </p>
            <p className="meta">
              Primary scenes: {detail.primaryScenes.join(", ")}
            </p>
          </div>
        )}

        {detail.gearClaims.length > 0 ? (
          <div className="card" style={{ marginTop: "0.85rem" }}>
            <h3>Gear claims</h3>
            <table className="pdna-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Confidence</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {detail.gearClaims.map((g, idx) => (
                  <tr key={idx}>
                    <td>{g.item}</td>
                    <td>{g.category}</td>
                    <td>
                      <TierBadge tier={g.confidence} />
                    </td>
                    <td>{g.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card pdna-pending" style={{ marginTop: "0.85rem" }}>
            <h3>Gear claims</h3>
            <p className="meta">
              Research pending. Sources: interviews, studio documentation, equipment disclosures.
              Confidence tiers: A (confirmed by artist) through C (open database listing).
            </p>
          </div>
        )}

        {detail.keyCollaborators.length > 0 && (
          <div className="card" style={{ marginTop: "0.85rem" }}>
            <h3>Key collaborators</h3>
            <ul className="list">
              {detail.keyCollaborators.map((c, idx) => (
                <li key={idx}>
                  <strong>{c.name}</strong> ({c.type}) — {c.relationship}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card" style={{ marginTop: "0.85rem" }}>
          <h3>Source notes</h3>
          <ul className="list">
            {detail.sourceNotes.map((note, idx) => (
              <li key={idx} className="meta">
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderSonicDna = (): React.JSX.Element => {
    if (!detail) return <div />;
    const { sonicDna, rhythmicDna, melodicHarmonicDna, arrangementDna, mixingDna, samplingDna, styleNuance } =
      detail;
    return (
      <div className="pdna-profile-body">
        <p className="meta" style={{ marginBottom: "0.65rem" }}>
          All content in this section is Tier D (audible / musicological analysis) unless marked
          otherwise. Treat as analysis to be verified, not verified fact.
        </p>

        <div className="pdna-grid-2">
          <div className="card">
            <h3>
              Sonic DNA <TierBadge tier="D" />
            </h3>
            <ul className="list">
              <li>
                <strong>Atmosphere:</strong> {sonicDna.atmosphere}
              </li>
              <li>
                <strong>Warmth:</strong> {sonicDna.warmth}
              </li>
              <li>
                <strong>Grit:</strong> {sonicDna.grit}
              </li>
              <li>
                <strong>Polish:</strong> {sonicDna.polish}
              </li>
              <li>
                <strong>Darkness:</strong> {sonicDna.darkness}
              </li>
              <li>
                <strong>Brightness:</strong> {sonicDna.brightness}
              </li>
              <li>
                <strong>Density:</strong> {sonicDna.density}
              </li>
              <li>
                <strong>Space use:</strong> {sonicDna.spaceUse}
              </li>
              <li>
                <strong>Synthetic/organic:</strong> {sonicDna.syntheticOrganicBalance}
              </li>
            </ul>
          </div>

          <div className="card">
            <h3>
              Rhythmic DNA <TierBadge tier="D" />
            </h3>
            <ul className="list">
              <li>
                <strong>Groove family:</strong> {rhythmicDna.grooveFamily}
              </li>
              <li>
                <strong>Swing:</strong> {rhythmicDna.swingAmount}
              </li>
              <li>
                <strong>Drum density:</strong> {rhythmicDna.drumDensity}
              </li>
              <li>
                <strong>Kick/snare:</strong> {rhythmicDna.kickSnareProfile}
              </li>
              <li>
                <strong>Hi-hat language:</strong> {rhythmicDna.hiHatLanguage}
              </li>
              {rhythmicDna.percussionBehavior && (
                <li>
                  <strong>Percussion:</strong> {rhythmicDna.percussionBehavior}
                </li>
              )}
              <li>
                <strong>Tempo range:</strong> {rhythmicDna.tempoRange}
              </li>
            </ul>
            {rhythmicDna.notes && <p className="meta" style={{ marginTop: "0.5rem" }}>{rhythmicDna.notes}</p>}
          </div>

          <div className="card">
            <h3>
              Melodic / Harmonic DNA <TierBadge tier="D" />
            </h3>
            <ul className="list">
              <li>
                <strong>Chord mood:</strong> {melodicHarmonicDna.chordMood}
              </li>
              <li>
                <strong>Tonality:</strong> {melodicHarmonicDna.tonality}
              </li>
              {melodicHarmonicDna.keyInfluences.length > 0 && (
                <li>
                  <strong>Key influences:</strong> {melodicHarmonicDna.keyInfluences.join(", ")}
                </li>
              )}
              <li>
                <strong>Motifs:</strong> {melodicHarmonicDna.motifs}
              </li>
              <li>
                <strong>Dissonance:</strong> {melodicHarmonicDna.dissonanceLevel}
              </li>
            </ul>
            {melodicHarmonicDna.notes && (
              <p className="meta" style={{ marginTop: "0.5rem" }}>{melodicHarmonicDna.notes}</p>
            )}
          </div>

          <div className="card">
            <h3>
              Arrangement DNA <TierBadge tier="D" />
            </h3>
            <ul className="list">
              <li>
                <strong>Intro style:</strong> {arrangementDna.introStyle}
              </li>
              <li>
                <strong>Loop evolution:</strong> {arrangementDna.loopEvolution}
              </li>
              <li>
                <strong>Moment design:</strong> {arrangementDna.momentDesign}
              </li>
              {arrangementDna.transitionApproach && (
                <li>
                  <strong>Transitions:</strong> {arrangementDna.transitionApproach}
                </li>
              )}
            </ul>
            {arrangementDna.notes && (
              <p className="meta" style={{ marginTop: "0.5rem" }}>{arrangementDna.notes}</p>
            )}
          </div>

          <div className="card">
            <h3>
              Mixing DNA <TierBadge tier="D" />
            </h3>
            <ul className="list">
              <li>
                <strong>Low end:</strong> {mixingDna.lowEnd}
              </li>
              <li>
                <strong>Stereo field:</strong> {mixingDna.stereoField}
              </li>
              <li>
                <strong>Vocal placement:</strong> {mixingDna.vocalPlacement}
              </li>
              <li>
                <strong>Dynamics:</strong> {mixingDna.dynamicsApproach}
              </li>
              <li>
                <strong>Reverb/delay:</strong> {mixingDna.reverbDelay}
              </li>
            </ul>
            {mixingDna.notes && (
              <p className="meta" style={{ marginTop: "0.5rem" }}>{mixingDna.notes}</p>
            )}
          </div>

          {samplingDna && (
            <div className="card">
              <h3>
                Sampling DNA <TierBadge tier="D" />
              </h3>
              <ul className="list">
                {samplingDna.sourceTraditions.length > 0 && (
                  <li>
                    <strong>Source traditions:</strong> {samplingDna.sourceTraditions.join(", ")}
                  </li>
                )}
                <li>
                  <strong>Chopping style:</strong> {samplingDna.choppingStyle}
                </li>
                {samplingDna.filtering && (
                  <li>
                    <strong>Filtering:</strong> {samplingDna.filtering}
                  </li>
                )}
                <li>
                  <strong>Loop behavior:</strong> {samplingDna.loopBehavior}
                </li>
                {samplingDna.sampleEthics && (
                  <li>
                    <strong>Ethics note:</strong> {samplingDna.sampleEthics}
                  </li>
                )}
              </ul>
              {samplingDna.notes && (
                <p className="meta" style={{ marginTop: "0.5rem" }}>{samplingDna.notes}</p>
              )}
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: "0.85rem" }}>
          <h3>
            Style nuance map <TierBadge tier="D" />
          </h3>
          <div className="pdna-grid-2" style={{ gap: "0.65rem" }}>
            {[
              { label: "Casual listeners hear", value: styleNuance.casualListenersHear },
              { label: "Producers hear", value: styleNuance.producersHear },
              { label: "Engineers hear", value: styleNuance.engineersHear },
              { label: "Artists feel", value: styleNuance.artistsFeel },
              { label: "Beginners misunderstand", value: styleNuance.beginnersMisunderstand }
            ].map(({ label, value }) => (
              <div key={label} style={{ borderLeft: "2px solid var(--line)", paddingLeft: "0.65rem" }}>
                <p className="meta" style={{ marginBottom: "0.25rem" }}>
                  {label}
                </p>
                <p style={{ margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCreativeDirection = (): React.JSX.Element => {
    if (!detail) return <div />;
    const { creativeDirection } = detail;
    return (
      <div className="pdna-profile-body">
        <div className="card">
          <h3>Type-beat direction</h3>
          <p className="meta" style={{ marginBottom: "0.5rem" }}>
            Ethical type-beat translation. Capture the creative logic, not the sound.
          </p>
          <p className="pdna-direction-text">{creativeDirection.typeBeatDirection}</p>
        </div>

        <div className="card" style={{ marginTop: "0.85rem" }}>
          <h3>Originality twist</h3>
          <p className="meta" style={{ marginBottom: "0.5rem" }}>
            How to combine this producer logic with another context for a genuinely original result.
          </p>
          <p>{creativeDirection.originalityTwist}</p>
        </div>

        {creativeDirection.warnings.length > 0 && (
          <div className="card pdna-warning-card" style={{ marginTop: "0.85rem" }}>
            <h3>Do-not-copy list</h3>
            <p className="meta" style={{ marginBottom: "0.5rem" }}>
              Recognizable signatures. Avoid direct replication.
            </p>
            <ul className="list">
              {creativeDirection.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {creativeDirection.fusionPaths.length > 0 && (
          <div className="card" style={{ marginTop: "0.85rem" }}>
            <h3>Fusion paths</h3>
            <ul className="list">
              {creativeDirection.fusionPaths.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {creativeDirection.promptExports.length > 0 && (
          <div className="card" style={{ marginTop: "0.85rem" }}>
            <h3>Prompt exports</h3>
            <p className="meta" style={{ marginBottom: "0.5rem" }}>
              Ready-to-use prompts for beat-making, song direction, or DAW sessions.
            </p>
            {creativeDirection.promptExports.map((p, idx) => (
              <div key={idx} className="pdna-prompt-box">
                {p}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProfileContent = (): React.JSX.Element => {
    if (loading) {
      return (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p className="meta">Loading profile...</p>
        </div>
      );
    }
    if (!detail) {
      return (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p className="meta">Select a producer from the list to view their DNA profile.</p>
        </div>
      );
    }

    switch (profileTab) {
      case "Overview":
        return renderOverview();
      case "Verified Data":
        return renderVerifiedData();
      case "Sonic DNA":
        return renderSonicDna();
      case "Creative Direction":
        return renderCreativeDirection();
      default:
        return <div />;
    }
  };

  return (
    <main className="page">
      <header className="header">
        <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
          <h1>Producer DNA Research Base</h1>
          <a href="/" className="meta pdna-nav-link">
            ← Beat Lab
          </a>
        </div>
        <p>
          Three-layer architecture: verified metadata / analytical DNA / creative direction. Batch
          001 — {Object.values(batchStats).reduce((s, n) => s + n, 0)} producers seeded.
        </p>
      </header>

      <section className="pdna-search-bar">
        <input
          placeholder="Search by name, scene, sound..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pdna-search-input"
        />
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="pdna-filter-select"
        >
          <option value="">All genres</option>
          {[
            "hip-hop","trap","boom-bap","g-funk","drill","grime","uk-garage","dubstep",
            "jungle","drum-and-bass","techno","house","footwork","ambient","idm","synthpop",
            "disco","funk","rnb","soul","gospel","rock","punk","metal","reggae","dub",
            "dancehall","afrobeats","amapiano","highlife","reggaeton","dembow","latin-pop",
            "baile-funk","k-pop","j-pop","city-pop","bollywood","experimental","noise",
            "jazz","film-score","game-score","neo-soul","alternative","shoegaze","new-wave",
            "electronic","pop","classical","hyperpop"
          ].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={eraFilter}
          onChange={(e) => setEraFilter(e.target.value)}
          className="pdna-filter-select"
        >
          <option value="">All eras</option>
          {[
            "pre-tape","tape-console","wall-of-sound","dub-soundsystem","disco-electronic-studio",
            "early-hip-hop-sampling","midi-sampler","daw","internet-beatmaker","streaming-social",
            "ai-assisted"
          ].map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          placeholder="Filter by region..."
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="pdna-search-input"
          style={{ maxWidth: "180px" }}
        />
        <span className="meta">{summaries.length} results</span>
      </section>

      <section className="pdna-layout">
        <aside className="panel pdna-list-panel">
          {filteredSummaries.map((p) => (
            <button
              key={p.id}
              className={`pdna-list-item ${selectedId === p.id ? "active" : ""}`}
              onClick={() => {
                setSelectedId(p.id);
                setProfileTab("Overview");
              }}
            >
              <div className="pdna-list-name">{p.name}</div>
              <div className="pdna-list-meta">
                {p.country} &middot; <TierBadge tier={p.overallConfidence} />
              </div>
              <div className="pdna-list-angle">{p.coreAngle}</div>
              <div style={{ marginTop: "0.3rem" }}>
                {p.genres.slice(0, 3).map((g) => (
                  <span className="pill" key={g} style={{ fontSize: "0.72rem" }}>
                    {g}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </aside>

        <section className="panel pdna-detail-panel">
          {detail && (
            <div className="pdna-detail-header">
              <div>
                <h2 style={{ margin: 0 }}>{detail.name}</h2>
                <p className="meta" style={{ margin: "0.2rem 0 0" }}>
                  {detail.id} &middot; Batch {detail.batchId} &middot; {detail.region}
                </p>
              </div>
              <div className="tab-list" style={{ flexDirection: "row", flexWrap: "wrap", gap: "0.35rem" }}>
                {PROFILE_TABS.map((tab) => (
                  <button
                    key={tab}
                    className={`tab-item ${profileTab === tab ? "active" : ""}`}
                    style={{ width: "auto" }}
                    onClick={() => setProfileTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="pdna-detail-body">{renderProfileContent()}</div>
        </section>
      </section>

      <div className="status">{status}</div>
    </main>
  );
}
