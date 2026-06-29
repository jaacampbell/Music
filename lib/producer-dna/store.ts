/**
 * In-memory Producer DNA Research base.
 *
 * Seeded with Batch 001 (50 producers). Supports search by name, region,
 * genre/scene, role, era, and confidence tier, plus full-profile reads and
 * lightweight DNA-score summary computation.
 */

import { BATCHES, TAXONOMY } from "@/lib/producer-dna/taxonomy";
import { SEED_PROFILES } from "@/lib/producer-dna/seed";
import type {
  BatchDefinition,
  ConfidenceTier,
  DnaScore,
  DnaScoreDimension,
  EraId,
  ProducerProfile,
  ProducerRole,
  TaxonomyBundle
} from "@/lib/producer-dna/types";

interface ProducerDnaState {
  profiles: Map<string, ProducerProfile>;
  batches: BatchDefinition[];
}

const createInitialState = (): ProducerDnaState => {
  const profiles = new Map<string, ProducerProfile>();
  for (const profile of SEED_PROFILES) {
    profiles.set(profile.producer.id, profile);
  }
  return {
    profiles,
    batches: BATCHES
  };
};

const globalStore = globalThis as typeof globalThis & {
  __producerDnaStore?: ProducerDnaState;
};

const state: ProducerDnaState =
  globalStore.__producerDnaStore ?? createInitialState();
globalStore.__producerDnaStore = state;

export interface ProducerSearchFilters {
  query?: string;
  region?: string;
  genre?: string;
  role?: ProducerRole;
  era?: EraId;
  minHistoricalTier?: ConfidenceTier;
  minScoreDimension?: DnaScoreDimension;
  minScoreValue?: number;
}

export interface ProducerSummary {
  id: string;
  name: string;
  country: string;
  region?: string;
  primaryGenres: string[];
  scene: string;
  coreDnaAngle: string;
  primaryRoles: ProducerRole[];
  eras: EraId[];
  averageScore: number;
  topDimensions: Array<{ dimension: DnaScoreDimension; value: number }>;
  historicalFactsTier: ConfidenceTier;
  audibleAnalysisTier: ConfidenceTier;
}

const TIER_ORDER: ConfidenceTier[] = ["A", "B", "C", "D", "E", "Unknown"];

const meetsTier = (claim: ConfidenceTier, minimum: ConfidenceTier): boolean => {
  const claimIdx = TIER_ORDER.indexOf(claim);
  const minIdx = TIER_ORDER.indexOf(minimum);
  if (claimIdx === -1 || minIdx === -1) return false;
  return claimIdx <= minIdx;
};

const averageScore = (scoring: DnaScore): number => {
  const values = Object.values(scoring);
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
};

const topScoreDimensions = (
  scoring: DnaScore,
  limit = 3
): Array<{ dimension: DnaScoreDimension; value: number }> =>
  (Object.entries(scoring) as Array<[DnaScoreDimension, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([dimension, value]) => ({ dimension, value }));

export const toSummary = (profile: ProducerProfile): ProducerSummary => ({
  id: profile.producer.id,
  name: profile.producer.name,
  country: profile.producer.country,
  region: profile.producer.region,
  primaryGenres: profile.capsule.primaryGenres,
  scene: profile.capsule.scene,
  coreDnaAngle: profile.capsule.coreDnaAngle,
  primaryRoles: profile.producer.primaryRoles,
  eras: profile.eras,
  averageScore: averageScore(profile.scoring),
  topDimensions: topScoreDimensions(profile.scoring),
  historicalFactsTier: profile.capsule.researchConfidence.historicalFacts,
  audibleAnalysisTier: profile.capsule.researchConfidence.audibleAnalysis
});

const matchesQuery = (profile: ProducerProfile, query: string): boolean => {
  const haystack = [
    profile.producer.name,
    profile.producer.realName ?? "",
    profile.producer.country,
    profile.producer.region ?? "",
    profile.capsule.scene,
    profile.capsule.coreDnaAngle,
    profile.capsule.signatureSoundSummary,
    profile.capsule.primaryGenres.join(" "),
    profile.producer.primaryRoles.join(" ")
  ]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
};

export const searchProducers = (
  filters: ProducerSearchFilters = {}
): ProducerSummary[] => {
  const results: ProducerProfile[] = [];
  for (const profile of state.profiles.values()) {
    if (filters.query && !matchesQuery(profile, filters.query)) continue;
    if (
      filters.region &&
      ![profile.producer.country, profile.producer.region]
        .filter(Boolean)
        .some((value) => (value ?? "").toLowerCase().includes(filters.region!.toLowerCase()))
    ) {
      continue;
    }
    if (
      filters.genre &&
      !profile.capsule.primaryGenres.some((genre) =>
        genre.toLowerCase().includes(filters.genre!.toLowerCase())
      )
    ) {
      continue;
    }
    if (filters.role && !profile.producer.primaryRoles.includes(filters.role)) continue;
    if (filters.era && !profile.eras.includes(filters.era)) continue;
    if (
      filters.minHistoricalTier &&
      !meetsTier(profile.capsule.researchConfidence.historicalFacts, filters.minHistoricalTier)
    ) {
      continue;
    }
    if (
      filters.minScoreDimension &&
      filters.minScoreValue !== undefined &&
      profile.scoring[filters.minScoreDimension] < filters.minScoreValue
    ) {
      continue;
    }
    results.push(profile);
  }
  return results
    .map(toSummary)
    .sort((a, b) => a.id.localeCompare(b.id));
};

export const getProducerProfile = (id: string): ProducerProfile | undefined =>
  state.profiles.get(id);

export const listBatches = (): BatchDefinition[] => state.batches;

export const getTaxonomy = (): TaxonomyBundle => TAXONOMY;

export const getDatabaseStats = (): {
  totalProducers: number;
  byTier: Record<ConfidenceTier, number>;
  byEra: Record<EraId, number>;
  byRole: Record<ProducerRole, number>;
  averageDnaScore: number;
  pendingOpenQuestions: number;
} => {
  const byTier: Record<ConfidenceTier, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    Unknown: 0
  };
  const byEra = {} as Record<EraId, number>;
  const byRole = {} as Record<ProducerRole, number>;
  let scoreSum = 0;
  let scoreCount = 0;
  let pendingOpenQuestions = 0;

  for (const profile of state.profiles.values()) {
    byTier[profile.capsule.researchConfidence.historicalFacts] += 1;
    for (const era of profile.eras) {
      byEra[era] = (byEra[era] ?? 0) + 1;
    }
    for (const role of profile.producer.primaryRoles) {
      byRole[role] = (byRole[role] ?? 0) + 1;
    }
    const avg = averageScore(profile.scoring);
    if (avg > 0) {
      scoreSum += avg;
      scoreCount += 1;
    }
    pendingOpenQuestions += profile.openQuestions.length;
  }

  return {
    totalProducers: state.profiles.size,
    byTier,
    byEra,
    byRole,
    averageDnaScore: scoreCount === 0 ? 0 : Math.round((scoreSum / scoreCount) * 10) / 10,
    pendingOpenQuestions
  };
};
