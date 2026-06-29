/**
 * Research-confidence system for Producer DNA claims.
 */

import type { ConfidenceTier } from "@/lib/producer-dna/types";

export interface ConfidenceTierDefinition {
  tier: ConfidenceTier;
  meaning: string;
}

export const CONFIDENCE_TIERS: ConfidenceTierDefinition[] = [
  {
    tier: "A",
    meaning:
      "Confirmed by primary source: liner notes, official credits, interview, label, publisher, or direct archive"
  },
  {
    tier: "B",
    meaning: "Confirmed by multiple credible secondary sources"
  },
  {
    tier: "C",
    meaning: "Listed in open databases, but not yet independently verified"
  },
  {
    tier: "D",
    meaning: "Audible/musicological analysis"
  },
  {
    tier: "E",
    meaning: "Educated hypothesis requiring review"
  },
  {
    tier: "Unknown",
    meaning: "Not enough reliable information"
  }
];

export const CONFIDENCE_TIER_ORDER: Record<ConfidenceTier, number> = {
  A: 6,
  B: 5,
  C: 4,
  D: 3,
  E: 2,
  Unknown: 1
};

export const isVerifiedTier = (tier: ConfidenceTier): boolean =>
  tier === "A" || tier === "B" || tier === "C";

export const isAnalyticalTier = (tier: ConfidenceTier): boolean =>
  tier === "D" || tier === "E";

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

export const PROFILE_GENERATION_LABELS: Record<ProfileGenerationStep, string> = {
  metadata: "Metadata first",
  source_verification: "Source verification",
  key_works: "Key works",
  listening_analysis: "Listening analysis",
  dna_summary: "DNA summary",
  type_beat_translation: "Type-beat translation",
  originality_warnings: "Originality warnings",
  iteration_matrix: "Iteration matrix",
  scoring: "Scoring",
  open_questions: "Open questions"
};
