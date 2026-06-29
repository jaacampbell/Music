import type { ProducerScores } from "@/lib/producer-dna/types";

/** Producer DNA scoring dimensions (1–10 each, not a popularity ranking). */
export const SCORING_DIMENSIONS = [
  "innovation",
  "influence",
  "technicalCraft",
  "sonicIdentity",
  "arrangementSkill",
  "rhythmDesign",
  "melodicHarmonicIdentity",
  "soundDesign",
  "mixingAesthetics",
  "culturalImportance",
  "commercialImpact",
  "undergroundImpact",
  "longevity",
  "adaptability",
  "originality"
] as const;

export type ScoringDimension = (typeof SCORING_DIMENSIONS)[number];

export const SCORING_DIMENSION_LABELS: Record<ScoringDimension, string> = {
  innovation: "Innovation",
  influence: "Influence",
  technicalCraft: "Technical Craft",
  sonicIdentity: "Sonic Identity",
  arrangementSkill: "Arrangement Skill",
  rhythmDesign: "Rhythm Design",
  melodicHarmonicIdentity: "Melodic/Harmonic Identity",
  soundDesign: "Sound Design",
  mixingAesthetics: "Mixing Aesthetics",
  culturalImportance: "Cultural Importance",
  commercialImpact: "Commercial Impact",
  undergroundImpact: "Underground Impact",
  longevity: "Longevity",
  adaptability: "Adaptability",
  originality: "Originality"
};

export const averageScore = (scores: ProducerScores): number => {
  const values = SCORING_DIMENSIONS.map((key) => scores[key]);
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
};
