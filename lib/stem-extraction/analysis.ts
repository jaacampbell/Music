import crypto from "node:crypto";

import type { AlignmentCheck, AnalysisInfo, SourceInfo } from "./types";

const KEYS = [
  "C major",
  "A minor",
  "G major",
  "E minor",
  "D minor",
  "F major",
  "Bb major",
  "C# minor"
];

const numericHash = (value: string): number => {
  const hex = crypto.createHash("sha256").update(value).digest("hex").slice(0, 8);
  return parseInt(hex, 16);
};

export const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

// Build a canonical decoded-source description (step 2: 48 kHz / 24-bit). Values are
// deterministic from the filename so demos/tests are reproducible. A real pipeline
// would compute these from the FFmpeg-decoded canonical WAV.
export const canonicalSource = (
  filename: string,
  durationSec: number
): SourceInfo => {
  const digest = sha256(filename);
  const h = numericHash(filename);
  return {
    filename,
    sha256: digest,
    durationSec,
    sampleRate: 48000,
    channels: 2,
    bitDepth: 24,
    peakDb: Number((-0.3 - (h % 12) / 10).toFixed(1)),
    truePeakDb: Number((-0.1 - (h % 8) / 10).toFixed(1)),
    integratedLufs: Number((-9 - (h % 50) / 10).toFixed(1))
  };
};

// Step 6: BPM (librosa beat_track) + key (Essentia KeyExtractor). Simulated here.
export const detectBpmKey = (source: SourceInfo): AnalysisInfo => {
  const h = numericHash(source.sha256);
  return {
    bpm: 80 + (h % 80),
    bpmConfidence: Number((0.8 + ((h >> 3) % 18) / 100).toFixed(2)),
    key: KEYS[h % KEYS.length],
    keyConfidence: Number((0.7 + ((h >> 5) % 25) / 100).toFixed(2))
  };
};

// Step 5: alignment verification. Each stem must match the source length, and the
// summed stems must reconstruct the source within an RMS error threshold. A real
// pipeline asserts on decoded samples; here we model a passing reconstruction.
export const verifyAlignment = (source: SourceInfo): AlignmentCheck => {
  const thresholdDb = -40;
  const h = numericHash(`${source.sha256}:align`);
  const sumRmsErrorDb = Number((-60 + (h % 15)).toFixed(1));
  return {
    lengthMatch: true,
    sumRmsErrorDb,
    thresholdDb,
    passed: sumRmsErrorDb < thresholdDb
  };
};
