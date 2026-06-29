import { BATCH_001_CONFIG, CONFIDENCE_RUBRIC, PRODUCER_DNA_BATCH_001, querySeedRows } from "@/lib/producer-dna/seed-batch-001";
import {
  ERA_TAXONOMY,
  GENRE_SCENE_TAXONOMY,
  METADATA_SOURCE_PRIORITY,
  PRODUCER_ROLE_TAXONOMY,
  PROFILE_GENERATION_ORDER
} from "@/lib/producer-dna/taxonomy";
import type { ProducerDnaQuery, ProducerDnaRecord, ResearchConfidenceTier } from "@/lib/producer-dna/types";

export interface ProducerDnaResearchSummary {
  totalProducers: number;
  batchNumber: string;
  regions: string[];
  genres: string[];
  eras: string[];
  confidenceDistribution: Record<ResearchConfidenceTier, number>;
}

const makeConfidenceDistribution = (rows: ProducerDnaRecord[]): Record<ResearchConfidenceTier, number> => {
  const distribution: Record<ResearchConfidenceTier, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    Unknown: 0
  };

  rows.forEach((row) => {
    const uniqueTiers = new Set<ResearchConfidenceTier>([
      ...row.sources.map((source) => source.reliabilityTier),
      row.producerProfile.researchConfidence
    ]);
    uniqueTiers.forEach((tier) => {
      distribution[tier] += 1;
    });
  });
  return distribution;
};

export const listProducerDnaRecords = (query: ProducerDnaQuery = {}): ProducerDnaRecord[] =>
  querySeedRows(query);

export const getProducerDnaRecord = (producerId: string): ProducerDnaRecord | undefined =>
  PRODUCER_DNA_BATCH_001.find((row) => row.producer.producerId === producerId);

export const getProducerDnaResearchSummary = (): ProducerDnaResearchSummary => {
  const regions = [...new Set(PRODUCER_DNA_BATCH_001.map((row) => row.producer.region))].sort();
  const genres = [...new Set(PRODUCER_DNA_BATCH_001.flatMap((row) => row.taxonomy.genres))].sort();
  const eras = [...new Set(PRODUCER_DNA_BATCH_001.flatMap((row) => row.taxonomy.eras))].sort();

  return {
    totalProducers: PRODUCER_DNA_BATCH_001.length,
    batchNumber: BATCH_001_CONFIG.batchNumber,
    regions,
    genres,
    eras,
    confidenceDistribution: makeConfidenceDistribution(PRODUCER_DNA_BATCH_001)
  };
};

export const producerDnaResearchMeta = {
  confidenceRubric: CONFIDENCE_RUBRIC,
  metadataSourcePriority: METADATA_SOURCE_PRIORITY,
  profileGenerationOrder: PROFILE_GENERATION_ORDER,
  taxonomy: {
    eras: ERA_TAXONOMY,
    genresAndScenes: GENRE_SCENE_TAXONOMY,
    producerRoles: PRODUCER_ROLE_TAXONOMY
  },
  batch: BATCH_001_CONFIG
} as const;
