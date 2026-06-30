/**
 * Aggregates all seeded catalogue batches into producer records.
 */

import { BATCH_001_SEED } from "@/lib/producer-dna/seed/batch-001";
import { BATCH_002_SEED } from "@/lib/producer-dna/seed/batch-002";
import { buildRecordsFromSeed } from "@/lib/producer-dna/seed/build-records";
import type { BatchSeedEntry } from "@/lib/producer-dna/seed/types";
import type { ProducerDnaRecord } from "@/lib/producer-dna/types";

export interface SeedBatchConfig {
  batchId: string;
  entries: BatchSeedEntry[];
}

export const SEED_BATCHES: SeedBatchConfig[] = [
  { batchId: "001", entries: BATCH_001_SEED },
  { batchId: "002", entries: BATCH_002_SEED }
];

export const ALL_SEED_RECORDS: ProducerDnaRecord[] = SEED_BATCHES.flatMap(({ batchId, entries }) =>
  buildRecordsFromSeed(entries, batchId)
);

export const getSeedProducerIds = (batchId: string): string[] =>
  SEED_BATCHES.find((b) => b.batchId === batchId)?.entries.map((e) => e.id) ?? [];

export const getNextUnseededBatchNumber = (seededBatchIds: Set<string>): string | undefined => {
  const planned = ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011"];
  return planned.find((id) => !seededBatchIds.has(id));
};
