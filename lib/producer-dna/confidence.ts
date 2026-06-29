import type { ConfidenceTier } from "@/lib/producer-dna/types";

/** Research-confidence tier definitions. */
export const CONFIDENCE_TIERS: Record<
  ConfidenceTier,
  { label: string; meaning: string; layer: "verified" | "analytical" | "hypothesis" }
> = {
  A: {
    label: "Tier A",
    meaning:
      "Confirmed by primary source, liner notes, official credits, interview, label, publisher, or direct archive",
    layer: "verified"
  },
  B: {
    label: "Tier B",
    meaning: "Confirmed by multiple credible secondary sources",
    layer: "verified"
  },
  C: {
    label: "Tier C",
    meaning: "Listed in open databases, but not yet independently verified",
    layer: "verified"
  },
  D: {
    label: "Tier D",
    meaning: "Audible/musicological analysis",
    layer: "analytical"
  },
  E: {
    label: "Tier E",
    meaning: "Educated hypothesis requiring review",
    layer: "hypothesis"
  },
  Unknown: {
    label: "Unknown",
    meaning: "Not enough reliable information",
    layer: "hypothesis"
  }
};

/** Profile generation order — metadata first, creative direction last. */
export const PROFILE_GENERATION_ORDER = [
  "metadata",
  "source_verification",
  "key_works",
  "listening_analysis",
  "dna_summary",
  "type_beat_translation",
  "originality_warnings",
  "iteration_matrix",
  "scoring",
  "open_questions"
] as const;

export type ProfileGenerationStep = (typeof PROFILE_GENERATION_ORDER)[number];

export const isVerifiedTier = (tier: ConfidenceTier): boolean =>
  tier === "A" || tier === "B" || tier === "C";

export const isAnalyticalTier = (tier: ConfidenceTier): boolean =>
  tier === "D" || tier === "E";
