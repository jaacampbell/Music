import type { Project } from "@/lib/types";

export type MusicProjectStatus =
  | "draft"
  | "in-progress"
  | "mixing"
  | "ready-for-release"
  | "released"
  | "archived";

export interface CloudUser {
  id: string;
  email?: string;
}

export interface CloudSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: CloudUser;
}

export interface MusicProjectRow {
  id: string;
  user_id: string;
  title: string;
  brief: string;
  status: MusicProjectStatus;
  bpm: number | null;
  song_key: string | null;
  readiness: number;
  active_section: string;
  artwork_path: string | null;
  source_audio_path: string | null;
  live_analysis: Record<string, unknown> | null;
  planning_state: Project | null;
  last_synced_at: string | null;
  last_opened_at: string;
  created_at: string;
  updated_at: string;
}

export interface MusicVersionRow {
  id: string;
  project_id: string;
  user_id: string;
  version_number: number;
  label: string;
  notes: string;
  storage_path: string | null;
  original_name: string | null;
  mime_type: string | null;
  byte_size: number | null;
  duration_sec: number | null;
  bpm: number | null;
  song_key: string | null;
  is_favorite: boolean;
  created_at: string;
}

export type MusicAssetKind =
  | "artwork"
  | "stem"
  | "master"
  | "mix"
  | "reference"
  | "agreement"
  | "lyrics"
  | "other";

export interface MusicAssetRow {
  id: string;
  project_id: string;
  user_id: string;
  kind: MusicAssetKind;
  label: string;
  storage_path: string;
  original_name: string;
  mime_type: string | null;
  byte_size: number | null;
  duration_sec: number | null;
  created_at: string;
}

export interface MusicTaskRow {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "normal" | "high";
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaveformCommentRow {
  id: string;
  project_id: string;
  version_id: string | null;
  user_id: string;
  timestamp_ms: number;
  body: string;
  kind: "mix-note" | "arrangement" | "vocal" | "production" | "fix";
  created_at: string;
}

export interface SongwriterSplit {
  id: string;
  name: string;
  role: string;
  pro: string;
  ipi: string;
  percentage: number;
}

export interface ProducerAgreement {
  id: string;
  producer: string;
  agreementType: "work-for-hire" | "license" | "ownership" | "other";
  fee: string;
  points: string;
  publishing: string;
  status: "draft" | "signed" | "not-needed";
  notes: string;
}

export interface MusicReleaseRow {
  id: string;
  project_id: string;
  user_id: string;
  release_title: string | null;
  artist_name: string | null;
  release_date: string | null;
  explicit: boolean;
  isrc: string | null;
  upc: string | null;
  distributor: string | null;
  master_ownership: string | null;
  publishing_ownership: string | null;
  splits: SongwriterSplit[];
  producer_agreements: ProducerAgreement[];
  ai_provenance: Array<{ note?: string; [key: string]: unknown }>;
  metadata: Record<string, unknown>;
  checklist: Record<string, boolean>;
  artwork_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectHistoryRow {
  id: string;
  project_id: string;
  user_id: string;
  label: string;
  snapshot: Record<string, unknown>;
  created_at: string;
}

export interface ComparisonRow {
  id: string;
  project_id: string;
  user_id: string;
  version_a_id: string;
  version_b_id: string;
  drums_choice: "a" | "b" | "tie" | null;
  atmosphere_choice: "a" | "b" | "tie" | null;
  vocal_space_choice: "a" | "b" | "tie" | null;
  low_end_choice: "a" | "b" | "tie" | null;
  notes: string;
  created_at: string;
}

export interface AgentMessageRow {
  id: string;
  project_id: string;
  user_id: string;
  role: "user" | "assistant";
  body: string;
  model: string | null;
  created_at: string;
}

export type SyncTrackStatus = "audit" | "prep" | "ready" | "pitched" | "placed" | "hold";
export type SyncOpportunityStatus = "saved" | "researching" | "pitching" | "submitted" | "closed" | "won" | "lost";
export type SyncSubmissionStatus = "prepared" | "submitted" | "follow_up" | "shortlisted" | "declined" | "placed" | "licensed" | "paid";
export type SyncContractStatus = "not_started" | "review" | "signature" | "fully_executed";

export interface SyncTrackRow {
  id: string;
  user_id: string;
  brand_id: string | null;
  composition_id: string | null;
  release_schedule_id: string | null;
  music_project_id: string | null;
  title: string;
  status: SyncTrackStatus;
  one_stop: boolean;
  master_control_pct: number;
  publishing_control_pct: number;
  master_owner: string;
  publishing_owner: string;
  pro_affiliation: string;
  isrc: string;
  bpm: number | null;
  song_key: string;
  explicit_available: boolean;
  clean_available: boolean;
  instrumental_available: boolean;
  acapella_available: boolean;
  tv_mix_available: boolean;
  cut_60_available: boolean;
  cut_30_available: boolean;
  cut_15_available: boolean;
  stems_available: boolean;
  lyrics_available: boolean;
  moods: string;
  use_cases: string;
  notes: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SyncOpportunityRow {
  id: string;
  user_id: string;
  title: string;
  company: string;
  source: string;
  url: string;
  deadline: string | null;
  use_case: string;
  budget_text: string;
  status: SyncOpportunityStatus;
  notes: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SyncSubmissionRow {
  id: string;
  user_id: string;
  track_id: string;
  opportunity_id: string | null;
  status: SyncSubmissionStatus;
  submitted_at: string | null;
  follow_up_on: string | null;
  quoted_fee: number | null;
  license_fee: number | null;
  contract_status: SyncContractStatus;
  pro_tracking: boolean;
  notes: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

