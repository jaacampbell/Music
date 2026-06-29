export type JobStatus = "queued" | "running" | "completed" | "failed";
export type JobType = "preprocess" | "separate" | "analyze" | "transcribe" | "export";

export interface StemInfo {
  name: string;
  label: string;
  file: string;
  format: string;
  sample_rate: number;
  channels: number;
  bit_depth: number;
  duration_seconds: number;
  start_time_seconds: number;
  lufs_integrated: number | null;
  true_peak_dbfs: number | null;
  confidence: number | null;
  midi_file: string | null;
  is_muted: boolean;
  volume_db: number;
  pan: number;
}

export interface AnalysisResult {
  bpm: number | null;
  bpm_confidence: number | null;
  key: string | null;
  key_confidence: number | null;
  time_signature: string;
  duration_bars: number | null;
  lufs_integrated: number | null;
  lufs_range: number | null;
  true_peak_dbfs: number | null;
  beat_times: number[];
  downbeat_times: number[];
  tempo_map: Array<{ bar: number; beat: number; time_seconds: number; bpm: number }>;
}

export interface SourceInfo {
  file: string;
  format: string;
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  bit_depth: number | null;
  codec: string | null;
  size_bytes: number;
}

export interface SeparationInfo {
  model: string;
  model_version: string | null;
  mode: string;
  processing_time_seconds: number | null;
  completed_at: string | null;
}

export interface ExportRecord {
  id: string;
  type: string;
  file: string;
  created_at: string;
  includes_midi: boolean;
  includes_manifest: boolean;
  size_bytes: number;
}

export interface ProjectManifest {
  schema_version: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  source: SourceInfo | null;
  analysis: AnalysisResult;
  separation: SeparationInfo | null;
  stems: StemInfo[];
  chords: unknown[];
  markers: unknown[];
  exports: ExportRecord[];
}

export interface ProjectSummary {
  project_id: string;
  title: string;
  created_at: string;
  bpm: number | null;
  key: string | null;
  stem_count: number;
  has_exports: boolean;
}

export interface JobResponse {
  job_id: string;
  project_id: string;
  type: JobType;
  status: JobStatus;
  progress_percent: number;
  message: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
}

export interface SeparationRequest {
  model?: string;
  mode?: string;
  output_format?: string;
  bit_depth?: number;
  normalize?: boolean;
}

export interface ExportRequest {
  type: "wav_zip" | "reaper_rpp";
  include_stems?: string[] | null;
  include_midi?: boolean;
  include_manifest?: boolean;
  include_readme?: boolean;
  bit_depth?: number;
  sample_rate?: number;
}
