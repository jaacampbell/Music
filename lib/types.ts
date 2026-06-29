export type JobStatus = "queued" | "running" | "completed" | "failed";

export type JobType =
  | "extract"
  | "analyze"
  | "export"
  | "agent-loop"
  | "save-state";

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
  createdAt: string;
  updatedAt: string;
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
}

/**
 * Producer DNA Research base
 *
 * The data model separates verified facts (Layer 1) from audible/creative
 * analysis (Layer 2) and creative direction (Layer 3), and exposes both as
 * searchable, confidence-labeled fields.
 */

/** Research-confidence tiers used to label every claim. */
export type ConfidenceTier = "A" | "B" | "C" | "D" | "E" | "Unknown";

/** Tracks how far the verified-metadata layer has progressed for a producer. */
export type FactStatus = "needs-research" | "partial" | "cited";

export type EraSlug =
  | "pre-tape"
  | "tape-console"
  | "wall-of-sound"
  | "dub-soundsystem"
  | "disco-electronic-studio"
  | "early-hiphop-sampling"
  | "midi-sampler"
  | "daw"
  | "internet-beatmaker"
  | "streaming-social"
  | "ai-assisted";

export interface TaxonomyTerm<Slug extends string = string> {
  slug: Slug;
  label: string;
}

/** A scored dimension on the 1-10 Producer DNA rubric. */
export type ScoringDimension =
  | "innovation"
  | "influence"
  | "technicalCraft"
  | "sonicIdentity"
  | "arrangement"
  | "rhythmDesign"
  | "melodicHarmonic"
  | "soundDesign"
  | "mixingAesthetics"
  | "culturalImportance"
  | "commercialImpact"
  | "undergroundImpact"
  | "longevity"
  | "adaptability"
  | "originality";

export type ProducerScores = Partial<Record<ScoringDimension, number>>;

/** Layer 2 + Layer 3 long-form analysis for a fully expanded profile. */
export interface ProducerDnaProfile {
  signatureSummary: string;
  artisticDna: string;
  technicalDna: string;
  sonicDna: string;
  rhythmicDna: string;
  melodicHarmonicDna: string;
  arrangementDna: string;
  mixingDna: string;
  samplingDna: string;
  styleNuanceMap: {
    casualListeners: string;
    producers: string;
    engineers: string;
    artists: string;
    djs: string;
    beginnersMisunderstand: string;
  };
  inspiredDirection: string;
  originalityTwist: string;
  originalityWarnings: string[];
  fusionPaths: string[];
  promptExports: string[];
}

/** Compressed Batch-001 capsule format with confidence-labeled fields. */
export interface ProducerCapsule {
  id: string;
  name: string;
  realName?: string;
  region: string;
  scenes: string[];
  era: EraSlug;
  genres: string[];
  roles: string[];
  coreDnaAngle: string;
  factStatus: FactStatus;
  analysisConfidence: ConfidenceTier;
  scores: ProducerScores;
  profile?: ProducerDnaProfile;
}

export interface ConfidenceTierInfo {
  tier: ConfidenceTier;
  meaning: string;
}

export interface BatchPlan {
  batch: string;
  title: string;
  focus: string;
}

export interface ProducerTaxonomy {
  eras: TaxonomyTerm<EraSlug>[];
  genres: TaxonomyTerm[];
  roles: TaxonomyTerm[];
  confidenceTiers: ConfidenceTierInfo[];
  scoringDimensions: TaxonomyTerm<ScoringDimension>[];
  batchRoadmap: BatchPlan[];
}
