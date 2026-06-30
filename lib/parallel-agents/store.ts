/**
 * In-memory store for parallel agent batches.
 */

import type { ParallelBatch } from "@/lib/parallel-agents/types";

interface ParallelAgentStoreState {
  batches: Map<string, ParallelBatch>;
}

const createInitialState = (): ParallelAgentStoreState => ({
  batches: new Map<string, ParallelBatch>()
});

const globalStore = globalThis as typeof globalThis & {
  __parallelAgentStore?: ParallelAgentStoreState;
};

const state: ParallelAgentStoreState =
  globalStore.__parallelAgentStore ?? createInitialState();
globalStore.__parallelAgentStore = state;

export const saveBatch = (batch: ParallelBatch): ParallelBatch => {
  state.batches.set(batch.id, batch);
  return batch;
};

export const getBatch = (batchId: string): ParallelBatch | undefined =>
  state.batches.get(batchId);

export const listBatches = (limit = 20): ParallelBatch[] =>
  Array.from(state.batches.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);

export const getParallelStats = (): {
  totalBatches: number;
  runningBatches: number;
  completedTasks: number;
  failedTasks: number;
} => {
  const batches = Array.from(state.batches.values());
  let completedTasks = 0;
  let failedTasks = 0;
  for (const batch of batches) {
    completedTasks += batch.tasks.filter((t) => t.status === "completed").length;
    failedTasks += batch.tasks.filter((t) => t.status === "failed").length;
  }
  return {
    totalBatches: batches.length,
    runningBatches: batches.filter((b) => b.status === "running").length,
    completedTasks,
    failedTasks
  };
};
