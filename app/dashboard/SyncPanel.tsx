"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { supabaseRest } from "@/lib/persistence/supabase-rest";
import type {
  CloudUser,
  MusicAssetRow,
  MusicProjectRow,
  MusicReleaseRow,
  SyncContractStatus,
  SyncOpportunityRow,
  SyncOpportunityStatus,
  SyncSubmissionRow,
  SyncSubmissionStatus,
  SyncTrackRow,
  SyncTrackStatus
} from "@/lib/persistence/types";
import styles from "./dashboard.module.css";

interface SyncPanelProps {
  project: MusicProjectRow;
  user: CloudUser;
  release: MusicReleaseRow | null;
  assets: MusicAssetRow[];
  onStatus: (message: string) => void;
}

type DeliverableKey =
  | "explicit_available"
  | "clean_available"
  | "instrumental_available"
  | "acapella_available"
  | "tv_mix_available"
  | "cut_60_available"
  | "cut_30_available"
  | "cut_15_available"
  | "stems_available"
  | "lyrics_available";

const DELIVERABLES: Array<[DeliverableKey, string]> = [
  ["explicit_available", "Explicit master"],
  ["clean_available", "Clean / radio master"],
  ["instrumental_available", "Instrumental"],
  ["acapella_available", "Acapella"],
  ["tv_mix_available", "TV / reduced-vocal mix"],
  ["stems_available", "Stems"],
  ["lyrics_available", "Lyrics sheet"],
  ["cut_60_available", "60-second cut"],
  ["cut_30_available", "30-second cut"],
  ["cut_15_available", "15-second cut"]
];

const TRACK_STATUSES: SyncTrackStatus[] = ["audit", "prep", "ready", "pitched", "placed", "hold"];
const OPPORTUNITY_STATUSES: SyncOpportunityStatus[] = ["saved", "researching", "pitching", "submitted", "closed", "won", "lost"];
const SUBMISSION_STATUSES: SyncSubmissionStatus[] = ["prepared", "submitted", "follow_up", "shortlisted", "declined", "placed", "licensed", "paid"];
const CONTRACT_STATUSES: SyncContractStatus[] = ["not_started", "review", "signature", "fully_executed"];

function readiness(track: SyncTrackRow | null): number {
  if (!track) return 0;
  const checks = [
    Number(track.master_control_pct) >= 100,
    Number(track.publishing_control_pct) >= 100,
    Boolean(track.master_owner.trim()),
    Boolean(track.publishing_owner.trim()),
    Boolean(track.pro_affiliation.trim()),
    track.clean_available,
    track.instrumental_available,
    track.stems_available,
    track.lyrics_available,
    Boolean(track.isrc.trim())
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function safeUrl(value: string): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "No deadline";
  return new Date(value + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function money(value: number | null): string {
  return value == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function pretty(value: string): string {
  return value.replaceAll("_", " ");
}

export default function SyncPanel({ project, user, release, assets, onStatus }: SyncPanelProps): React.JSX.Element {
  const [track, setTrack] = useState<SyncTrackRow | null>(null);
  const [opportunities, setOpportunities] = useState<SyncOpportunityRow[]>([]);
  const [submissions, setSubmissions] = useState<SyncSubmissionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [opportunityDraft, setOpportunityDraft] = useState({
    title: "",
    company: "",
    source: "",
    url: "",
    deadline: "",
    use_case: "",
    budget_text: "",
    notes: ""
  });
  const [submissionDraft, setSubmissionDraft] = useState({
    opportunity_id: "",
    status: "prepared" as SyncSubmissionStatus,
    follow_up_on: "",
    quoted_fee: ""
  });

  const detected = useMemo(() => {
    const names = assets.map((asset) => `${asset.label} ${asset.original_name}`.toLowerCase());
    return {
      master: assets.some((asset) => asset.kind === "master"),
      stems: assets.some((asset) => asset.kind === "stem"),
      lyrics: assets.some((asset) => asset.kind === "lyrics"),
      clean: names.some((name) => /\b(clean|radio edit|radio version)\b/.test(name)),
      instrumental: names.some((name) => /\binstrumental\b/.test(name)),
      acapella: names.some((name) => /\b(a\s?capella|acapella)\b/.test(name)),
      tvMix: names.some((name) => /\b(tv mix|reduced vocal|underscore)\b/.test(name))
    };
  }, [assets]);

  const score = readiness(track);
  const activeSubmissions = submissions.filter((item) => ["submitted", "follow_up", "shortlisted", "placed", "licensed"].includes(item.status)).length;
  const placements = submissions.filter((item) => ["placed", "licensed", "paid"].includes(item.status)).length;

  async function load(): Promise<void> {
    const rows = await supabaseRest<SyncTrackRow[]>("artist_sync_tracks", {
      query: `select=*&music_project_id=eq.${project.id}&limit=1`
    });
    const nextTrack = rows[0] ?? null;
    setTrack(nextTrack);

    const opportunityRows = await supabaseRest<SyncOpportunityRow[]>("artist_sync_opportunities", {
      query: "select=*&order=created_at.desc&limit=100"
    }).catch(() => []);
    setOpportunities(opportunityRows);

    if (nextTrack) {
      const submissionRows = await supabaseRest<SyncSubmissionRow[]>("artist_sync_submissions", {
        query: `select=*&track_id=eq.${nextTrack.id}&order=created_at.desc`
      }).catch(() => []);
      setSubmissions(submissionRows);
    } else {
      setSubmissions([]);
    }
  }

  useEffect(() => {
    setTrack(null);
    setSubmissions([]);
    void load().catch((error) => onStatus(error instanceof Error ? error.message : "Could not load sync licensing data."));
  }, [project.id]);

  async function run(work: () => Promise<void>, success: string): Promise<void> {
    setBusy(true);
    try {
      await work();
      onStatus(success);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Sync licensing update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function startAudit(): Promise<void> {
    await run(async () => {
      const rows = await supabaseRest<SyncTrackRow[]>("artist_sync_tracks", {
        method: "POST",
        body: {
          user_id: user.id,
          music_project_id: project.id,
          title: project.title,
          status: "audit",
          one_stop: false,
          master_control_pct: 0,
          publishing_control_pct: 0,
          master_owner: release?.master_ownership ?? "",
          publishing_owner: release?.publishing_ownership ?? "",
          pro_affiliation: "",
          isrc: release?.isrc ?? "",
          bpm: project.bpm,
          song_key: project.song_key ?? "",
          explicit_available: false,
          clean_available: false,
          instrumental_available: false,
          acapella_available: false,
          tv_mix_available: false,
          cut_60_available: false,
          cut_30_available: false,
          cut_15_available: false,
          stems_available: detected.stems,
          lyrics_available: detected.lyrics,
          moods: "",
          use_cases: "",
          notes: "",
          metadata: { created_from: "music-os-dashboard" }
        }
      });
      setTrack(rows[0]);
      setSubmissions([]);
    }, "Sync audit started for this song.");
  }

  async function saveTrack(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!track) return;
    if (track.one_stop && (Number(track.master_control_pct) < 100 || Number(track.publishing_control_pct) < 100)) {
      onStatus("One-stop can only be confirmed after both master and publishing control are recorded at 100%.");
      return;
    }
    await run(async () => {
      const rows = await supabaseRest<SyncTrackRow[]>("artist_sync_tracks", {
        method: "PATCH",
        query: `id=eq.${track.id}`,
        body: {
          title: project.title,
          status: track.status,
          one_stop: track.one_stop,
          master_control_pct: Number(track.master_control_pct) || 0,
          publishing_control_pct: Number(track.publishing_control_pct) || 0,
          master_owner: track.master_owner,
          publishing_owner: track.publishing_owner,
          pro_affiliation: track.pro_affiliation,
          isrc: track.isrc,
          bpm: track.bpm,
          song_key: track.song_key,
          explicit_available: track.explicit_available,
          clean_available: track.clean_available,
          instrumental_available: track.instrumental_available,
          acapella_available: track.acapella_available,
          tv_mix_available: track.tv_mix_available,
          cut_60_available: track.cut_60_available,
          cut_30_available: track.cut_30_available,
          cut_15_available: track.cut_15_available,
          stems_available: track.stems_available,
          lyrics_available: track.lyrics_available,
          moods: track.moods,
          use_cases: track.use_cases,
          notes: track.notes,
          updated_at: new Date().toISOString()
        }
      });
      if (rows[0]) setTrack(rows[0]);
    }, "Sync audit saved.");
  }

  function applyDetectedAssets(): void {
    if (!track) return;
    setTrack({
      ...track,
      stems_available: track.stems_available || detected.stems,
      lyrics_available: track.lyrics_available || detected.lyrics,
      clean_available: track.clean_available || detected.clean,
      instrumental_available: track.instrumental_available || detected.instrumental,
      acapella_available: track.acapella_available || detected.acapella,
      tv_mix_available: track.tv_mix_available || detected.tvMix
    });
    onStatus("Detected Music OS assets copied into the Sync checklist. Review before saving.");
  }

  async function createOpportunity(event: FormEvent): Promise<void> {
    event.preventDefault();
    const title = opportunityDraft.title.trim();
    if (!title) return;
    if (opportunityDraft.url && !safeUrl(opportunityDraft.url)) {
      onStatus("Use a valid http:// or https:// URL for the brief.");
      return;
    }
    await run(async () => {
      const rows = await supabaseRest<SyncOpportunityRow[]>("artist_sync_opportunities", {
        method: "POST",
        body: {
          user_id: user.id,
          title,
          company: opportunityDraft.company.trim(),
          source: opportunityDraft.source.trim(),
          url: opportunityDraft.url ? safeUrl(opportunityDraft.url) : "",
          deadline: opportunityDraft.deadline || null,
          use_case: opportunityDraft.use_case.trim(),
          budget_text: opportunityDraft.budget_text.trim(),
          status: "saved",
          notes: opportunityDraft.notes.trim(),
          metadata: { created_from: "music-os-dashboard" }
        }
      });
      if (rows[0]) setOpportunities((current) => [rows[0], ...current]);
      setOpportunityDraft({ title: "", company: "", source: "", url: "", deadline: "", use_case: "", budget_text: "", notes: "" });
    }, "Sync opportunity saved.");
  }

  async function updateOpportunity(row: SyncOpportunityRow, status: SyncOpportunityStatus): Promise<void> {
    await run(async () => {
      const rows = await supabaseRest<SyncOpportunityRow[]>("artist_sync_opportunities", {
        method: "PATCH",
        query: `id=eq.${row.id}`,
        body: { status, updated_at: new Date().toISOString() }
      });
      if (rows[0]) setOpportunities((current) => current.map((item) => item.id === row.id ? rows[0] : item));
    }, "Opportunity status updated.");
  }

  async function createSubmission(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!track) return;
    await run(async () => {
      const rows = await supabaseRest<SyncSubmissionRow[]>("artist_sync_submissions", {
        method: "POST",
        body: {
          user_id: user.id,
          track_id: track.id,
          opportunity_id: submissionDraft.opportunity_id || null,
          status: submissionDraft.status,
          submitted_at: submissionDraft.status === "prepared" ? null : new Date().toISOString(),
          follow_up_on: submissionDraft.follow_up_on || null,
          quoted_fee: submissionDraft.quoted_fee ? Number(submissionDraft.quoted_fee) : null,
          license_fee: null,
          contract_status: "not_started",
          pro_tracking: false,
          notes: "",
          metadata: { created_from: "music-os-dashboard" }
        }
      });
      if (rows[0]) setSubmissions((current) => [rows[0], ...current]);
      setSubmissionDraft({ opportunity_id: "", status: "prepared", follow_up_on: "", quoted_fee: "" });
    }, "Sync submission logged.");
  }

  async function updateSubmission(row: SyncSubmissionRow, patch: Partial<SyncSubmissionRow>, message = "Submission updated."): Promise<void> {
    await run(async () => {
      const rows = await supabaseRest<SyncSubmissionRow[]>("artist_sync_submissions", {
        method: "PATCH",
        query: `id=eq.${row.id}`,
        body: { ...patch, updated_at: new Date().toISOString() }
      });
      if (rows[0]) setSubmissions((current) => current.map((item) => item.id === row.id ? rows[0] : item));
    }, message);
  }

  if (!track) {
    return <section className={styles.syncWorkspace}>
      <article className={styles.syncStart}>
        <span className={styles.kicker}>Sync & licensing</span>
        <h2>Make this song licensable while you make the record.</h2>
        <p>This creates a song-level Sync record linked to the same <code>music_projects.id</code>. Nothing is copied into a second project.</p>
        <div className={styles.syncDetected}>
          <span className={detected.master ? styles.detectedYes : ""}>Master {detected.master ? "detected" : "not logged"}</span>
          <span className={detected.stems ? styles.detectedYes : ""}>Stems {detected.stems ? "detected" : "not logged"}</span>
          <span className={detected.lyrics ? styles.detectedYes : ""}>Lyrics {detected.lyrics ? "detected" : "not logged"}</span>
          <span>ISRC {release?.isrc ? "available from Release Center" : "not logged"}</span>
        </div>
        <button disabled={busy} onClick={() => void startAudit()}>Start Sync Audit →</button>
      </article>
    </section>;
  }

  return <section className={styles.syncWorkspace}>
    <div className={styles.syncSummary}>
      <div><span>SYNC READINESS</span><strong>{score}%</strong><small>{score >= 80 ? "Pitchable after final review" : "Complete the missing rights and delivery items"}</small></div>
      <div><span>ONE-STOP</span><strong>{track.one_stop ? "YES" : "NO"}</strong><small>{track.one_stop ? "100% control recorded" : "Clearance still needs verification"}</small></div>
      <div><span>ACTIVE PITCHES</span><strong>{activeSubmissions}</strong><small>{submissions.length} total submissions</small></div>
      <div><span>PLACEMENTS</span><strong>{placements}</strong><small>Placed / licensed / paid</small></div>
    </div>

    <form className={styles.syncForm} onSubmit={(event) => void saveTrack(event)}>
      <article className={styles.sectionCard}>
        <div className={styles.sectionHead}><div><span className={styles.kicker}>Rights & clearance</span><h2>Can a supervisor clear this fast?</h2><p>Control percentages are operational records, not legal conclusions. Verify samples, collaborators and authority before licensing.</p></div><button disabled={busy}>Save Sync Audit</button></div>
        <div className={styles.syncFormGrid}>
          <label>Sync status<select value={track.status} onChange={(event) => setTrack({ ...track, status: event.target.value as SyncTrackStatus })}>{TRACK_STATUSES.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}</select></label>
          <label>Master control %<input type="number" min="0" max="100" step="0.01" value={track.master_control_pct} onChange={(event) => setTrack({ ...track, master_control_pct: Number(event.target.value) })} /></label>
          <label>Publishing control %<input type="number" min="0" max="100" step="0.01" value={track.publishing_control_pct} onChange={(event) => setTrack({ ...track, publishing_control_pct: Number(event.target.value) })} /></label>
          <label className={styles.syncCheck}><input type="checkbox" checked={track.one_stop} onChange={(event) => setTrack({ ...track, one_stop: event.target.checked })} /><span>One-stop clearance confirmed</span></label>
          <label>Master owner / controller<input value={track.master_owner} onChange={(event) => setTrack({ ...track, master_owner: event.target.value })} /></label>
          <label>Publishing owner / controller<input value={track.publishing_owner} onChange={(event) => setTrack({ ...track, publishing_owner: event.target.value })} /></label>
          <label>PRO / publishing affiliation<input value={track.pro_affiliation} onChange={(event) => setTrack({ ...track, pro_affiliation: event.target.value })} placeholder="ASCAP, BMI, SESAC…" /></label>
          <label>ISRC<input value={track.isrc} onChange={(event) => setTrack({ ...track, isrc: event.target.value })} /></label>
          <label>BPM<input type="number" min="1" max="400" value={track.bpm ?? ""} onChange={(event) => setTrack({ ...track, bpm: event.target.value ? Number(event.target.value) : null })} /></label>
          <label>Key<input value={track.song_key} onChange={(event) => setTrack({ ...track, song_key: event.target.value })} /></label>
          <label className={styles.syncFull}>Mood / sonic tags<textarea value={track.moods} onChange={(event) => setTrack({ ...track, moods: event.target.value })} placeholder="confident, nightlife, cinematic, tension…" /></label>
          <label className={styles.syncFull}>Best sync lanes / scene uses<textarea value={track.use_cases} onChange={(event) => setTrack({ ...track, use_cases: event.target.value })} placeholder="reality TV, travel, fashion, sports, relationship drama…" /></label>
          <label className={styles.syncFull}>Restrictions / samples / clearance notes<textarea value={track.notes} onChange={(event) => setTrack({ ...track, notes: event.target.value })} /></label>
        </div>
      </article>

      <article className={styles.sectionCard}>
        <div className={styles.sectionHead}><div><span className={styles.kicker}>Delivery package</span><h2>Alternate versions supervisors can actually use.</h2><p>Music OS detects obvious stored assets as hints. You remain in control of the final availability checklist.</p></div><button type="button" className={styles.secondary} onClick={applyDetectedAssets}>Apply detected assets</button></div>
        <div className={styles.syncDetected}>
          <span className={detected.master ? styles.detectedYes : ""}>Master {detected.master ? "detected" : "—"}</span>
          <span className={detected.stems ? styles.detectedYes : ""}>Stems {detected.stems ? "detected" : "—"}</span>
          <span className={detected.lyrics ? styles.detectedYes : ""}>Lyrics {detected.lyrics ? "detected" : "—"}</span>
          <span className={detected.clean ? styles.detectedYes : ""}>Clean label {detected.clean ? "detected" : "—"}</span>
          <span className={detected.instrumental ? styles.detectedYes : ""}>Instrumental label {detected.instrumental ? "detected" : "—"}</span>
        </div>
        <div className={styles.syncDeliverables}>{DELIVERABLES.map(([key, label]) => <label key={key} className={track[key] ? styles.syncDeliverableReady : styles.syncDeliverable}><input type="checkbox" checked={Boolean(track[key])} onChange={(event) => setTrack({ ...track, [key]: event.target.checked })} /><span>{label}</span></label>)}</div>
      </article>
    </form>

    <div className={styles.syncColumns}>
      <article className={styles.sectionCard}>
        <div className={styles.sectionHead}><div><span className={styles.kicker}>Briefs & opportunities</span><h2>Save the actual ask.</h2></div></div>
        <form className={styles.syncOpportunityForm} onSubmit={(event) => void createOpportunity(event)}>
          <input required value={opportunityDraft.title} onChange={(event) => setOpportunityDraft({ ...opportunityDraft, title: event.target.value })} placeholder="Opportunity / brief title" />
          <input value={opportunityDraft.company} onChange={(event) => setOpportunityDraft({ ...opportunityDraft, company: event.target.value })} placeholder="Supervisor / company / library" />
          <input value={opportunityDraft.source} onChange={(event) => setOpportunityDraft({ ...opportunityDraft, source: event.target.value })} placeholder="Source" />
          <input type="date" value={opportunityDraft.deadline} onChange={(event) => setOpportunityDraft({ ...opportunityDraft, deadline: event.target.value })} />
          <input className={styles.syncFull} value={opportunityDraft.use_case} onChange={(event) => setOpportunityDraft({ ...opportunityDraft, use_case: event.target.value })} placeholder="Scene / music need" />
          <input value={opportunityDraft.budget_text} onChange={(event) => setOpportunityDraft({ ...opportunityDraft, budget_text: event.target.value })} placeholder="Budget / fee notes" />
          <input value={opportunityDraft.url} onChange={(event) => setOpportunityDraft({ ...opportunityDraft, url: event.target.value })} placeholder="Brief URL" />
          <textarea className={styles.syncFull} value={opportunityDraft.notes} onChange={(event) => setOpportunityDraft({ ...opportunityDraft, notes: event.target.value })} placeholder="Requirements / pitch notes" />
          <button disabled={busy}>Save opportunity</button>
        </form>
        <div className={styles.syncList}>{opportunities.length === 0 ? <p className={styles.muted}>No licensing opportunities saved yet.</p> : opportunities.map((item) => <div className={styles.syncRow} key={item.id}><div><strong>{item.title}</strong><span>{item.company || "Company not set"} · {formatDate(item.deadline)}</span><small>{item.use_case || item.source || "No brief details"}</small>{safeUrl(item.url) && <a href={safeUrl(item.url) ?? "#"} target="_blank" rel="noreferrer">Open brief ↗</a>}</div><select value={item.status} onChange={(event) => void updateOpportunity(item, event.target.value as SyncOpportunityStatus)}>{OPPORTUNITY_STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</select></div>)}</div>
      </article>

      <article className={styles.sectionCard}>
        <div className={styles.sectionHead}><div><span className={styles.kicker}>Pitch & placement pipeline</span><h2>From prepared to paid.</h2></div></div>
        <form className={styles.syncSubmissionForm} onSubmit={(event) => void createSubmission(event)}>
          <select value={submissionDraft.opportunity_id} onChange={(event) => setSubmissionDraft({ ...submissionDraft, opportunity_id: event.target.value })}><option value="">Direct pitch / no saved brief</option>{opportunities.map((item) => <option key={item.id} value={item.id}>{item.title}{item.company ? ` · ${item.company}` : ""}</option>)}</select>
          <select value={submissionDraft.status} onChange={(event) => setSubmissionDraft({ ...submissionDraft, status: event.target.value as SyncSubmissionStatus })}>{SUBMISSION_STATUSES.slice(0, 3).map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</select>
          <input type="date" value={submissionDraft.follow_up_on} onChange={(event) => setSubmissionDraft({ ...submissionDraft, follow_up_on: event.target.value })} />
          <input type="number" min="0" step="1" value={submissionDraft.quoted_fee} onChange={(event) => setSubmissionDraft({ ...submissionDraft, quoted_fee: event.target.value })} placeholder="Quoted fee" />
          <button disabled={busy}>Log submission</button>
        </form>

        <div className={styles.syncPipeline}>{submissions.length === 0 ? <p className={styles.muted}>No pitches logged for this song yet.</p> : submissions.map((item) => {
          const opportunity = opportunities.find((row) => row.id === item.opportunity_id);
          return <article className={styles.syncSubmission} key={item.id}>
            <div className={styles.syncSubmissionHead}><div><strong>{opportunity?.title ?? "Direct pitch"}</strong><span>{opportunity?.company || "No company"} · {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : "Prepared"}</span></div><select value={item.status} onChange={(event) => void updateSubmission(item, { status: event.target.value as SyncSubmissionStatus }, "Submission status updated.")}>{SUBMISSION_STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</select></div>
            <div className={styles.syncMiniGrid}>
              <label>Follow-up<input type="date" defaultValue={item.follow_up_on ?? ""} onBlur={(event) => void updateSubmission(item, { follow_up_on: event.target.value || null })} /></label>
              <label>Quoted fee<input type="number" min="0" step="1" defaultValue={item.quoted_fee ?? ""} onBlur={(event) => void updateSubmission(item, { quoted_fee: event.target.value ? Number(event.target.value) : null })} /></label>
              <label>License fee<input type="number" min="0" step="1" defaultValue={item.license_fee ?? ""} onBlur={(event) => void updateSubmission(item, { license_fee: event.target.value ? Number(event.target.value) : null })} /></label>
              <label>Contract<select value={item.contract_status} onChange={(event) => void updateSubmission(item, { contract_status: event.target.value as SyncContractStatus })}>{CONTRACT_STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</select></label>
            </div>
            <div className={styles.syncMoney}><span>Quote <strong>{money(item.quoted_fee)}</strong></span><span>License <strong>{money(item.license_fee)}</strong></span><label><input type="checkbox" checked={item.pro_tracking} onChange={(event) => void updateSubmission(item, { pro_tracking: event.target.checked }, "PRO tracking updated.")} /> PRO royalty tracking</label></div>
            <textarea defaultValue={item.notes} onBlur={(event) => void updateSubmission(item, { notes: event.target.value })} placeholder="Clearance, contract, cue sheet, payment and royalty notes" />
          </article>;
        })}</div>
      </article>
    </div>
  </section>;
}
