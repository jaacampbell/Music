// Phase 1 stem-extraction data contracts. These mirror the subset of the manifest
// described in docs/stem-extraction/PROPOSAL.md (§5.1) needed for the Phase 1 slice:
// upload -> decode -> 4-stem separation -> alignment check -> analysis -> manifest
// -> export. Audio is simulated (see separator.ts) so the slice runs without GPU
// workers, FFmpeg, or model weights, while keeping the contracts a real backend
// would implement.

export const STEM_NAMES = ["vocals", "drums", "bass", "other"] as const;
export type StemName = (typeof STEM_NAMES)[number];

export interface SourceInfo {
  filename: string;
  sha256: string;
  durationSec: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  peakDb: number;
  truePeakDb: number;
  integratedLufs: number;
}

export interface AnalysisInfo {
  bpm: number;
  bpmConfidence: number;
  key: string;
  keyConfidence: number;
}

export interface AlignmentCheck {
  lengthMatch: boolean;
  sumRmsErrorDb: number;
  thresholdDb: number;
  passed: boolean;
}

export interface StemTrack {
  name: StemName;
  index: number;
  file: string;
  url: string;
  durationSec: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  integratedLufs: number;
  confidence: number;
}

export interface SeparationInfo {
  model: string;
  stemMode: 4;
  warnings: string[];
  alignment: AlignmentCheck | null;
}

export interface StemManifest {
  projectId: string;
  source: SourceInfo;
  analysis: AnalysisInfo | null;
  separation: SeparationInfo;
  stems: StemTrack[];
}

export type StemProjectStatus = "created" | "separated" | "exported";

export type ExportTarget =
  | "universal_stem_pack_zip"
  | "karaoke_wav"
  | "acapella_wav";

export interface StemExport {
  id: string;
  target: ExportTarget;
  files: string[];
  notes: string;
  createdAt: string;
}

export interface StemProject {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: StemProjectStatus;
  manifest: StemManifest;
  exports: StemExport[];
}
