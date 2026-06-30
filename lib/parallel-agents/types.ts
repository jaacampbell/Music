/**
 * Parallel agentic work — types, squads, and task contracts.
 */

import type { ProfileGenerationStep } from "@/lib/producer-dna/confidence";
import type { JobStatus } from "@/lib/types";

export type AgentSquad =
  | "orchestration"
  | "metadata"
  | "source_verification"
  | "analytical"
  | "creative"
  | "copyright_safety"
  | "evaluation"
  | "beat_generation"
  | "audio_pipeline"
  | "export";

export interface AgentDefinition {
  id: string;
  squad: AgentSquad;
  name: string;
  job: string;
  inputContract: string;
  outputContract: string;
}

export const AGENT_SQUADS: AgentDefinition[] = [
  {
    id: "orchestrator",
    squad: "orchestration",
    name: "Orchestrator",
    job: "Route tasks, enforce contracts, merge parallel outputs",
    inputContract: "task_graph + concurrency_limit",
    outputContract: "batch_status + merged_artifacts"
  },
  {
    id: "metadata-agent",
    squad: "metadata",
    name: "Metadata Agent",
    job: "Fetch and normalize verified catalogue facts",
    inputContract: "producer_id + source_targets[]",
    outputContract: "producer_record + aliases + identifiers"
  },
  {
    id: "source-verification-agent",
    squad: "source_verification",
    name: "Source Verification Agent",
    job: "Cross-check claims across MusicBrainz, Discogs, Wikidata",
    inputContract: "producer_id + claims[]",
    outputContract: "sources[] + confidence_tiers"
  },
  {
    id: "key-works-agent",
    squad: "metadata",
    name: "Key Works Agent",
    job: "Identify canonical works and credit roles",
    inputContract: "producer_id + catalogue_refs",
    outputContract: "works[] + credits[]"
  },
  {
    id: "listening-analysis-agent",
    squad: "analytical",
    name: "Listening Analysis Agent",
    job: "Audible/musicological DNA extraction (Tier D)",
    inputContract: "producer_id + reference_tracks[]",
    outputContract: "sonic_dna + rhythmic_dna + arrangement_dna"
  },
  {
    id: "dna-summary-agent",
    squad: "analytical",
    name: "DNA Summary Agent",
    job: "Synthesize long-form Producer DNA profile",
    inputContract: "verified_metadata + analytical_layers",
    outputContract: "producer_profile + capsule"
  },
  {
    id: "type-beat-agent",
    squad: "creative",
    name: "Type-Beat Translation Agent",
    job: "Ethical creative direction without imitation",
    inputContract: "dna_summary + originality_constraints",
    outputContract: "inspired_directions[] + prompt_exports[]"
  },
  {
    id: "originality-agent",
    squad: "copyright_safety",
    name: "Originality / Copyright Safety Agent",
    job: "Do-not-copy list and rights-safe neutralization",
    inputContract: "producer_id + signature_elements",
    outputContract: "originality_warnings[]"
  },
  {
    id: "iteration-agent",
    squad: "creative",
    name: "Iteration Matrix Agent",
    job: "Generate 10+ original fusion directions",
    inputContract: "dna_summary + fusion_targets",
    outputContract: "creative_iterations[] + fusion_paths[]"
  },
  {
    id: "scoring-agent",
    squad: "evaluation",
    name: "Scoring Agent",
    job: "15-dimension rubric scoring (not popularity)",
    inputContract: "producer_id + dna_summary",
    outputContract: "producer_dna_scores"
  },
  {
    id: "open-questions-agent",
    squad: "evaluation",
    name: "Open Questions Agent",
    job: "Flag gaps, disputed credits, research backlog",
    inputContract: "full_producer_record",
    outputContract: "open_questions[] + research_backlog"
  },
  {
    id: "beat-strategy-agent",
    squad: "beat_generation",
    name: "Beat Strategy Agent",
    job: "Produce 3–6 creative directions from song brief",
    inputContract: "song_brief + song_dna",
    outputContract: "strategy_map[]"
  },
  {
    id: "parallel-generation-agent",
    squad: "beat_generation",
    name: "Parallel Generation Agent",
    job: "Generate multiple beat candidates simultaneously",
    inputContract: "prompt_pack + strategy_map",
    outputContract: "generations[]"
  },
  {
    id: "ar-agent",
    squad: "evaluation",
    name: "A&R Agent",
    job: "Score emotional fit, originality, release readiness",
    inputContract: "generations[] + song_dna",
    outputContract: "scorecards[]"
  }
];

export const STEP_TO_AGENT: Record<ProfileGenerationStep, string> = {
  metadata: "metadata-agent",
  source_verification: "source-verification-agent",
  key_works: "key-works-agent",
  listening_analysis: "listening-analysis-agent",
  dna_summary: "dna-summary-agent",
  type_beat_translation: "type-beat-agent",
  originality_warnings: "originality-agent",
  iteration_matrix: "iteration-agent",
  scoring: "scoring-agent",
  open_questions: "open-questions-agent"
};

export interface AgentTask {
  id: string;
  batchId: string;
  agentId: string;
  squad: AgentSquad;
  step: ProfileGenerationStep | string;
  producerId?: string;
  projectId?: string;
  status: JobStatus;
  message: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  confidenceTier?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ParallelBatch {
  id: string;
  name: string;
  batchType: "producer-dna-research" | "beat-lab-parallel" | "multitask";
  status: JobStatus;
  concurrency: number;
  tasks: AgentTask[];
  progress: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  result?: {
    completedTasks: number;
    failedTasks: number;
    producerIds?: string[];
    totalTokensSaved?: number;
  };
}

export interface ParallelRunOptions {
  concurrency?: number;
  steps?: ProfileGenerationStep[];
}
