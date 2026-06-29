import { BATCH_001 } from "@/lib/producer-dna/batches";
import { BATCH_001_RECORDS } from "@/lib/producer-dna/seed-batch-001";
import { searchProducerDna } from "@/lib/producer-dna/search";
import type {
  ProducerDnaRecord,
  ProducerDnaSearchFilters,
  ProducerDnaSearchResult
} from "@/lib/producer-dna/types";

interface ProducerDnaStoreState {
  records: Map<string, ProducerDnaRecord>;
  initialized: boolean;
}

const globalStore = globalThis as typeof globalThis & {
  __producerDnaStore?: ProducerDnaStoreState;
};

const createInitialState = (): ProducerDnaStoreState => {
  const records = new Map<string, ProducerDnaRecord>();
  for (const record of BATCH_001_RECORDS) {
    records.set(record.producer.id, record);
  }
  return { records, initialized: true };
};

const state: ProducerDnaStoreState =
  globalStore.__producerDnaStore ?? createInitialState();
globalStore.__producerDnaStore = state;

export const getProducerDnaRecord = (producerId: string): ProducerDnaRecord | null =>
  state.records.get(producerId) ?? null;

export const listProducerDnaRecords = (batchId?: string): ProducerDnaRecord[] => {
  const all = [...state.records.values()];
  if (!batchId) return all;
  return all.filter((r) => r.producer.batchId === batchId);
};

export const searchProducers = (
  filters: ProducerDnaSearchFilters
): { results: ProducerDnaSearchResult[]; total: number } =>
  searchProducerDna([...state.records.values()], filters);

export const getStoreStats = (): {
  totalProducers: number;
  batch001Count: number;
  capsuleCount: number;
  draftCount: number;
} => {
  const all = [...state.records.values()];
  return {
    totalProducers: all.length,
    batch001Count: all.filter((r) => r.producer.batchId === BATCH_001.batchNumber).length,
    capsuleCount: all.filter((r) => r.profile?.profileStatus === "capsule").length,
    draftCount: all.filter((r) => r.profile?.profileStatus === "draft").length
  };
};

export const getProducerDnaForAgent = (
  producerId: string
): {
  tier1Facts: string;
  tier2Examples: string[];
  tier3Summary: string;
} | null => {
  const record = getProducerDnaRecord(producerId);
  if (!record) return null;

  const { producer, capsule, scores } = record;

  const tier1Facts = [
    `Producer:${producer.name}`,
    `ID:${producer.id}`,
    `Region:${producer.region}`,
    `Genres:${capsule.primaryGenres.join(", ")}`,
    `CoreDNA:${producer.coreDnaAngle}`,
    `Confidence:${capsule.researchConfidence}`
  ].join("\n");

  const tier2Examples = [
    `Type-beat direction: ${capsule.typeBeatInspiredDirection}`,
    `Originality twist: ${capsule.originalityTwist}`,
    ...(record.originalityWarnings.map((w) => `Warning: ${w.warning}`))
  ];

  const scoreLine = scores
    ? `Scores: innovation ${scores.innovation}/10, sonic identity ${scores.sonicIdentity}/10, rhythm ${scores.rhythmDesign}/10`
    : "Scores: pending";

  const tier3Summary = [
    capsule.signatureSoundSummary,
    capsule.artisticDna,
    scoreLine
  ].join(" ");

  return { tier1Facts, tier2Examples, tier3Summary };
};
