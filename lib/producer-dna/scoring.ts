/**
 * Producer DNA scoring rubric — 1–10 per dimension, not a popularity ranking.
 */

import type { DnaScoreDimension } from "@/lib/producer-dna/types";

export interface ScoreDimensionDefinition {
  key: DnaScoreDimension;
  label: string;
  description: string;
}

export const DNA_SCORE_DIMENSIONS: ScoreDimensionDefinition[] = [
  {
    key: "innovation",
    label: "Innovation",
    description: "Novel techniques, sounds, or workflows introduced to production culture"
  },
  {
    key: "influence",
    label: "Influence",
    description: "How widely and deeply their approach shaped other producers"
  },
  {
    key: "technicalCraft",
    label: "Technical craft",
    description: "Engineering skill, tool mastery, and execution precision"
  },
  {
    key: "sonicIdentity",
    label: "Sonic identity",
    description: "Recognizability of their signature sound across works"
  },
  {
    key: "arrangementSkill",
    label: "Arrangement skill",
    description: "Structure, dynamics, and moment design in productions"
  },
  {
    key: "rhythmDesign",
    label: "Rhythm design",
    description: "Groove, drum language, and temporal feel"
  },
  {
    key: "melodicHarmonicIdentity",
    label: "Melodic/harmonic identity",
    description: "Chord choices, motifs, and tonal character"
  },
  {
    key: "soundDesign",
    label: "Sound design",
    description: "Synthesis, sampling architecture, and timbral invention"
  },
  {
    key: "mixingAesthetics",
    label: "Mixing aesthetics",
    description: "Spatial, frequency, and loudness signature in the mix"
  },
  {
    key: "culturalImportance",
    label: "Cultural importance",
    description: "Role in scenes, movements, and cultural memory"
  },
  {
    key: "commercialImpact",
    label: "Commercial impact",
    description: "Chart success, sales, and mainstream reach — independent of underground value"
  },
  {
    key: "undergroundImpact",
    label: "Underground impact",
    description: "Influence in niche, regional, or non-mainstream contexts"
  },
  {
    key: "longevity",
    label: "Longevity",
    description: "Enduring relevance across decades or genre shifts"
  },
  {
    key: "adaptability",
    label: "Adaptability",
    description: "Ability to evolve tools, genres, and collaborators without losing identity"
  },
  {
    key: "originality",
    label: "Originality",
    description: "Distinctiveness versus derivation; ethical creative fingerprint"
  }
];

export const defaultScores = (): Record<DnaScoreDimension, number> =>
  Object.fromEntries(
    DNA_SCORE_DIMENSIONS.map((d) => [d.key, 0])
  ) as Record<DnaScoreDimension, number>;
