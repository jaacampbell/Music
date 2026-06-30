/**
 * Catalogue batch runner — research entire seeded batches, queue multiple batches.
 */

import type { ProfileGenerationStep } from "@/lib/producer-dna/confidence";
import { runParallelProducerResearch } from "@/lib/parallel-agents/producer-dna-pipeline";
import type { ParallelBatch, ParallelRunOptions } from "@/lib/parallel-agents/types";
import { saveBatch } from "@/lib/parallel-agents/store";
import {
  getBatch,
  getBatchingProgress,
  getProducersByBatch,
  updateBatchStatus
} from "@/lib/producer-dna/store";

export interface CatalogueBatchRunResult {
  catalogueBatchNumber: string;
  catalogueTitle: string;
  producerCount: number;
  parallelBatch: ParallelBatch;
}

export interface ContinuousBatchRunResult {
  batchesRun: CatalogueBatchRunResult[];
  totalProducersResearched: number;
  totalTasksCompleted: number;
}

export const runCatalogueBatchResearch = async (
  batchNumber: string,
  options: ParallelRunOptions = {}
): Promise<CatalogueBatchRunResult> => {
  const catalogueBatch = getBatch(batchNumber);
  if (!catalogueBatch) {
    throw new Error(`Catalogue batch ${batchNumber} not found`);
  }

  const producers = getProducersByBatch(batchNumber);
  if (producers.length === 0) {
    throw new Error(`Catalogue batch ${batchNumber} has no seeded producers`);
  }

  updateBatchStatus(batchNumber, { status: "researching" });

  const parallelBatch = await runParallelProducerResearch(
    producers.map((p) => p.producer.id),
    options
  );
  parallelBatch.name = `Batch ${batchNumber}: ${catalogueBatch.title}`;
  saveBatch(parallelBatch);

  updateBatchStatus(batchNumber, {
    status: "researched",
    lastResearchedAt: new Date().toISOString(),
    lastResearchBatchId: parallelBatch.id
  });

  return {
    catalogueBatchNumber: batchNumber,
    catalogueTitle: catalogueBatch.title,
    producerCount: producers.length,
    parallelBatch
  };
};

export const runContinuousBatching = async (
  batchNumbers?: string[],
  options: ParallelRunOptions = {}
): Promise<ContinuousBatchRunResult> => {
  const targets =
    batchNumbers ??
    (() => {
      const progress = getBatchingProgress();
      const next = progress.nextBatchToResearch;
      return next ? [next] : [];
    })();

  if (targets.length === 0) {
    throw new Error("No catalogue batches available to research");
  }

  const batchesRun: CatalogueBatchRunResult[] = [];
  let totalProducersResearched = 0;
  let totalTasksCompleted = 0;

  for (const batchNumber of targets) {
    const result = await runCatalogueBatchResearch(batchNumber, options);
    batchesRun.push(result);
    totalProducersResearched += result.producerCount;
    totalTasksCompleted += result.parallelBatch.result?.completedTasks ?? 0;
  }

  return { batchesRun, totalProducersResearched, totalTasksCompleted };
};

export const getBatchingQueue = (): {
  progress: ReturnType<typeof getBatchingProgress>;
  queue: Array<{
    batchNumber: string;
    title: string;
    producerCount: number;
    status?: string;
  }>;
} => {
  const progress = getBatchingProgress();
  const queue = ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011"]
    .map((batchNumber) => {
      const batch = getBatch(batchNumber);
      if (!batch) return null;
      return {
        batchNumber,
        title: batch.title,
        producerCount: batch.producerCount,
        status: batch.status ?? (batch.producerCount > 0 ? "seeded" : "planned")
      };
    })
    .filter(Boolean) as Array<{
    batchNumber: string;
    title: string;
    producerCount: number;
    status?: string;
  }>;

  return { progress, queue };
};

export type { ProfileGenerationStep };
