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
  splits: unknown[];
  producer_agreements: unknown[];
  ai_provenance: unknown[];
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
