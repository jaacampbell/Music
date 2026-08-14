export type JobStatus = "queued" | "running" | "completed" | "failed";

export type JobType =
  | "extract"
  | "analyze"
  | "export"
  | "agent-loop"
  | "save-state"
  | "parallel-agent"
  | "producer-dna-research";

export interface SongDNA {
  bpm: number | null;
  key: string | null;
  mood: string[];
  structure: string[];
  vocalSpace: "tight" | "balanced" | "wide";
  palette: string[];
  notes: string;
}

export interface StemAsset {
  id: string;
  name: string;
  file: string;
  startTime: number;
  durationSec: number;
  sampleRate: number;
  channels: number;
  lufs: number;
  confidence: number;
  midiFile?: string;
  family?: string;
  engine?: string;
  downloadUrl?: string;
}

export interface GenerationVersion {
  id: string;
  name: string;
  strategy: string;
  prompt: string;
  bpm: number;
  key: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  selected: boolean;
}

export interface Scorecard {
  id: string;
  generationId: string;
  emotionalAlignment: number;
  vocalSpace: number;
  lowEndControl: number;
  originality: number;
  replayValue: number;
  releaseReadiness: number;
  summary: string;
}

export interface ExportArtifact {
  id: string;
  type: "wav-zip" | "reaper-rpp" | "ableton-folder" | "logic-folder";
  status: "ready" | "failed";
  files: string[];
  notes: string;
  createdAt: string;
}

export interface PromptCacheTelemetry {
  cacheKey: string;
  cacheHit: boolean;
  inputTokens: number;
  outputTokens: number;
  tokensSaved: number;
  templateId: string;
}

export interface Job {
  id: string;
  projectId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  message: string;
  result?: Record<string, unknown>;
  error?: string;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceAudioAttachment {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  attachedAt: string;
  storage: "browser-indexeddb";
}

export interface LiveAudioAnalysis {
  bpm: number | null;
  key: string | null;
  bpmConfidence: number;
  keyConfidence: number;
  peakDb: number;
  rmsDb: number;
  durationSec: number;
  sampleRate: number;
  channels: number;
  engine: string;
  analyzedAt: string;
}

export type ProjectHistoryType =
  | "project-created"
  | "project-restored"
  | "state-saved"
  | "agent-loop"
  | "multitask"
  | "audio-attached"
  | "audio-analyzed"
  | "core-separated"
  | "deep-separated"
  | "export";

export interface ProjectHistoryEntry {
  id: string;
  type: ProjectHistoryType;
  message: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface ProjectManifest {
  projectId: string;
  title: string;
  sourceFile?: string;
  bpm: number | null;
  key: string | null;
  sampleRate: number;
  bitDepth: number;
  durationSeconds: number;
  stems: StemAsset[];
  tempoMap: Array<{ bar: number; bpm: number }>;
  markers: Array<{ bar: number; label: string }>;
  chords: Array<{ bar: number; chord: string }>;
  exports: ExportArtifact[];
}

export interface Project {
  id: string;
  title: string;
  brief: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "in-progress" | "ready-for-export";
  songDna: SongDNA;
  strategyMap: string[];
  promptPack: string[];
  generations: GenerationVersion[];
  stems: StemAsset[];
  scorecards: Scorecard[];
  mixNotes: string;
  revisionPrompt: string;
  exportPlan: string;
  manifest: ProjectManifest;
  promptTelemetry: PromptCacheTelemetry[];
  sourceAudio?: SourceAudioAttachment;
  liveAnalysis?: LiveAudioAnalysis;
  history: ProjectHistoryEntry[];
}
