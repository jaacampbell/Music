/**
 * Producer DNA parallel research pipeline.
 * Per producer: steps run sequentially (metadata → open questions).
 * Across producers: pipelines run in parallel up to concurrency limit.
 */

import crypto from "node:crypto";

import { buildPromptWithCache } from "@/lib/prompt-cache";
import {
  PROFILE_GENERATION_ORDER,
  type ProfileGenerationStep
} from "@/lib/producer-dna/confidence";
import { defaultScores, DNA_SCORE_DIMENSIONS } from "@/lib/producer-dna/scoring";
import { getProducer } from "@/lib/producer-dna/store";
import type { ProducerDnaScores, Source } from "@/lib/producer-dna/types";
import {
  computeBatchProgress,
  deriveBatchStatus,
  runWithConcurrency,
  summarizeBatch
} from "@/lib/parallel-agents/orchestrator";
import {
  AGENT_SQUADS,
  STEP_TO_AGENT,
  type AgentTask,
  type ParallelBatch,
  type ParallelRunOptions
} from "@/lib/parallel-agents/types";

const now = (): string => new Date().toISOString();
const id = (): string => crypto.randomUUID();

const getAgent = (agentId: string) => {
  const agent = AGENT_SQUADS.find((a) => a.id === agentId);
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);
  return agent;
};

const executeStep = (
  producerId: string,
  step: ProfileGenerationStep
): Record<string, unknown> => {
  const record = getProducer(producerId);
  if (!record) {
    throw new Error(`Producer not found: ${producerId}`);
  }

  const agentId = STEP_TO_AGENT[step];
  const agent = getAgent(agentId);
  const { telemetry } = buildPromptWithCache({
    templateId: `producer-dna-${step}-v1`,
    systemPrefix: `You are the ${agent.name}. Output structured JSON only. Separate verified facts (A–C) from analysis (D–E).`,
    tier1Facts: `Producer:${record.producer.name}\nID:${producerId}\nStep:${step}`,
    tier2Examples: [
      "Verified example: credit listed in Discogs release notes (Tier C pending verification).",
      "Analysis example: off-grid swing detected in drum programming (Tier D)."
    ],
    tier3Summary: "Never copy signature melodies, drum patterns, or recognizable samples.",
    revisionDelta: `Run ${step} for ${record.producer.name}`
  });

  switch (step) {
    case "metadata":
      return {
        layer: "verified",
        producerId,
        name: record.producer.name,
        region: record.producer.region,
        coreDnaAngle: record.producer.coreDnaAngle,
        confidenceTier: "C",
        tokensSaved: telemetry.tokensSaved
      };

    case "source_verification": {
      const stubSources: Source[] = [
        {
          id: `src-mb-${producerId}`,
          url: `https://musicbrainz.org/search?query=${encodeURIComponent(record.producer.name)}`,
          sourceType: "musicbrainz",
          dateAccessed: now(),
          reliabilityTier: "C",
          claimSupported: "Artist identity and release catalogue",
          citationStatus: "pending"
        },
        {
          id: `src-dc-${producerId}`,
          url: `https://www.discogs.com/search/?q=${encodeURIComponent(record.producer.name)}`,
          sourceType: "discogs",
          dateAccessed: now(),
          reliabilityTier: "C",
          claimSupported: "Release-level credits and roles",
          citationStatus: "pending"
        }
      ];
      return {
        layer: "verified",
        sourcesAdded: stubSources.length,
        sources: stubSources,
        confidenceTier: "C",
        tokensSaved: telemetry.tokensSaved
      };
    }

    case "key_works":
      return {
        layer: "verified",
        worksQueued: 5,
        creditsQueued: 3,
        message: "Key works identification queued for catalogue lookup",
        confidenceTier: "C",
        tokensSaved: telemetry.tokensSaved
      };

    case "listening_analysis":
      return {
        layer: "analytical",
        sonicDna: record.sonicDna?.atmosphere ?? record.capsule?.signatureSoundSummary,
        rhythmicDna: record.capsule?.rhythmicDna,
        melodicDna: record.capsule?.melodicHarmonicDna,
        confidenceTier: "D",
        tokensSaved: telemetry.tokensSaved
      };

    case "dna_summary":
      return {
        layer: "analytical",
        capsule: record.capsule?.signatureSoundSummary,
        artisticDna: record.capsule?.artisticDna,
        confidenceTier: "D",
        tokensSaved: telemetry.tokensSaved
      };

    case "type_beat_translation":
      return {
        layer: "creative",
        direction: record.capsule?.typeBeatInspiredDirection,
        ethicalRule: "Translate production logic — never copy recognizable elements",
        confidenceTier: "D",
        tokensSaved: telemetry.tokensSaved
      };

    case "originality_warnings":
      return {
        layer: "creative",
        warnings: record.originalityWarnings.length,
        categories: ["melody", "drum_pattern", "sample"],
        confidenceTier: "D",
        tokensSaved: telemetry.tokensSaved
      };

    case "iteration_matrix":
      return {
        layer: "creative",
        iterations: record.creativeIterations.length,
        fusionPaths: record.fusionPaths.length,
        confidenceTier: "E",
        tokensSaved: telemetry.tokensSaved
      };

    case "scoring": {
      const scores: ProducerDnaScores = {
        producerId,
        scores: defaultScores(),
        notes: "Placeholder scores — requires human/AI evaluation pass",
        confidence: "E"
      };
      for (const dim of DNA_SCORE_DIMENSIONS) {
        scores.scores[dim.key] = 5;
      }
      return {
        layer: "evaluation",
        scores: scores.scores,
        dimensions: DNA_SCORE_DIMENSIONS.length,
        confidenceTier: "E",
        tokensSaved: telemetry.tokensSaved
      };
    }

    case "open_questions":
      return {
        layer: "evaluation",
        openQuestions: [
          "Verify primary credits against liner notes or official archives (Tier A/B)",
          "Confirm gear claims with interviews or documented studio photos",
          "Resolve any Discogs/MusicBrainz credit conflicts"
        ],
        confidenceTier: "Unknown",
        tokensSaved: telemetry.tokensSaved
      };

    default:
      return { step, confidenceTier: "Unknown", tokensSaved: telemetry.tokensSaved };
  }
};

const runProducerPipeline = async (
  batchId: string,
  producerId: string,
  steps: ProfileGenerationStep[],
  onTaskUpdate: (task: AgentTask) => void
): Promise<AgentTask[]> => {
  const tasks: AgentTask[] = [];

  for (const step of steps) {
    const agentId = STEP_TO_AGENT[step];
    const agent = getAgent(agentId);
    const task: AgentTask = {
      id: id(),
      batchId,
      agentId,
      squad: agent.squad,
      step,
      producerId,
      status: "running",
      message: `${agent.name} running ${step}`,
      input: { producerId, step },
      startedAt: now()
    };
    onTaskUpdate(task);

    try {
      const output = executeStep(producerId, step);
      task.status = "completed";
      task.output = output;
      task.confidenceTier = output.confidenceTier as string;
      task.message = `${agent.name} completed ${step}`;
      task.completedAt = now();
    } catch (error) {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : "Step failed";
      task.message = `${agent.name} failed on ${step}`;
      task.completedAt = now();
    }

    tasks.push(task);
    onTaskUpdate({ ...task });
  }

  return tasks;
};

export const runParallelProducerResearch = async (
  producerIds: string[],
  options: ParallelRunOptions = {}
): Promise<ParallelBatch> => {
  const steps = options.steps ?? [...PROFILE_GENERATION_ORDER];
  const concurrency = options.concurrency ?? 5;
  const batchId = id();
  const allTasks: AgentTask[] = [];

  const batch: ParallelBatch = {
    id: batchId,
    name: `Producer DNA research — ${producerIds.length} producers`,
    batchType: "producer-dna-research",
    status: "running",
    concurrency,
    tasks: allTasks,
    progress: 0,
    message: `Running ${steps.length} steps × ${producerIds.length} producers`,
    createdAt: now(),
    updatedAt: now()
  };

  const onTaskUpdate = (task: AgentTask): void => {
    const idx = allTasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      allTasks[idx] = task;
    } else {
      allTasks.push(task);
    }
    batch.tasks = [...allTasks];
    batch.progress = computeBatchProgress(allTasks);
    batch.status = deriveBatchStatus(allTasks);
    batch.updatedAt = now();
  };

  await runWithConcurrency(producerIds, concurrency, async (producerId) => {
    await runProducerPipeline(batchId, producerId, steps, onTaskUpdate);
  });

  batch.status = deriveBatchStatus(allTasks);
  batch.progress = computeBatchProgress(allTasks);
  batch.message = `Completed ${allTasks.filter((t) => t.status === "completed").length}/${allTasks.length} agent tasks`;
  batch.result = summarizeBatch(batch);
  batch.updatedAt = now();

  return batch;
};
