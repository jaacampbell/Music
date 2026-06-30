import { STEM_NAMES, type StemName } from "./types";

// The separator is a swappable backend behind a stable interface (PROPOSAL.md §3).
// Nothing downstream should care which model produced the stems. Phase 1 ships a
// deterministic *simulated* backend so the pipeline runs without GPU/FFmpeg/weights;
// a real HTDemucs (`htdemucs_ft`) worker would implement the same `Separator`
// contract and be dropped in without touching the rest of the system.

export interface SeparatedStem {
  name: StemName;
  integratedLufs: number;
  confidence: number;
}

export interface SeparationOutput {
  model: string;
  stemMode: 4;
  stems: SeparatedStem[];
  warnings: string[];
}

export interface SeparationInput {
  sha256: string;
  durationSec: number;
}

export interface Separator {
  id: string;
  separate(input: SeparationInput): SeparationOutput;
}

// Derive a deterministic 32-bit seed from the source hash so a given input always
// yields the same simulated metadata (reproducible demos and tests).
const seedFromHash = (sha256: string): number => {
  let seed = 0;
  for (let i = 0; i < sha256.length; i += 1) {
    seed = (seed * 31 + sha256.charCodeAt(i)) >>> 0;
  }
  return seed || 1;
};

const mulberry32 = (seed: number): (() => number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const simulatedHtdemucsFt: Separator = {
  id: "htdemucs_ft",
  separate({ sha256 }) {
    const rand = mulberry32(seedFromHash(sha256));
    const stems: SeparatedStem[] = STEM_NAMES.map((name) => ({
      name,
      integratedLufs: Number((-18 + rand() * 6).toFixed(1)),
      confidence: Number((0.74 + rand() * 0.22).toFixed(2))
    }));
    return {
      model: "htdemucs_ft (simulated)",
      stemMode: 4,
      stems,
      // Honesty contract (PROPOSAL.md): never promise perfect separation.
      warnings: [
        "AI separation produces approximations, not original studio multitracks.",
        "Expect some bleed between vocals and other; review before release.",
        "Phase 1 backend is simulated; swap in a real htdemucs_ft worker for production audio."
      ]
    };
  }
};
