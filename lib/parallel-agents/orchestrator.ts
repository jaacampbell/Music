/**
 * Parallel task orchestrator — runs independent work units with concurrency control.
 */

import type { AgentTask, ParallelBatch } from "@/lib/parallel-agents/types";
import type { JobStatus } from "@/lib/types";

export const DEFAULT_CONCURRENCY = 5;

export const runWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runWorker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  };

  const poolSize = Math.min(Math.max(1, concurrency), items.length || 1);
  await Promise.all(Array.from({ length: poolSize }, () => runWorker()));
  return results;
};

export const computeBatchProgress = (tasks: AgentTask[]): number => {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "completed" || t.status === "failed").length;
  return Math.round((done / tasks.length) * 100);
};

export const deriveBatchStatus = (tasks: AgentTask[]): JobStatus => {
  if (tasks.length === 0) return "queued";
  if (tasks.some((t) => t.status === "running")) return "running";
  if (tasks.every((t) => t.status === "completed")) return "completed";
  if (tasks.every((t) => t.status === "completed" || t.status === "failed")) {
    return tasks.some((t) => t.status === "failed") ? "failed" : "completed";
  }
  return "running";
};

export const summarizeBatch = (
  batch: ParallelBatch
): ParallelBatch["result"] => ({
  completedTasks: batch.tasks.filter((t) => t.status === "completed").length,
  failedTasks: batch.tasks.filter((t) => t.status === "failed").length,
  producerIds: [
    ...new Set(batch.tasks.map((t) => t.producerId).filter(Boolean) as string[])
  ],
  totalTokensSaved: batch.tasks.reduce(
    (sum, t) => sum + ((t.output?.tokensSaved as number) ?? 0),
    0
  )
});
