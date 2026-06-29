import crypto from "node:crypto";

import {
  BATCH_001_PRODUCERS,
  BATCH_ROADMAP,
  type SeedBatchPlan,
  type SeedProducer
} from "@/lib/producer-dna/seed";
import type {
  CollaboratorEdge,
  CreativeIteration,
  Credit,
  FusionPath,
  GearClaim,
  InfluenceEdge,
  InspiredDirection,
  OriginalityWarning,
  Producer,
  ProducerDnaRecord,
  ProducerProfile,
  ProducerScoreCard,
  ProducerSearchFilters,
  ProducerSummary,
  PromptExport,
  Source,
  Work
} from "@/lib/producer-dna/types";
import { SCORING_AXES } from "@/lib/producer-dna/taxonomy";

const now = (): string => new Date().toISOString();
const newId = (): string => crypto.randomUUID();

interface ProducerDnaState {
  producers: Map<string, Producer>;
  profiles: Map<string, ProducerProfile>;
  works: Map<string, Work>;
  credits: Map<string, Credit>;
  sources: Map<string, Source>;
  gearClaims: Map<string, GearClaim>;
  collaboratorEdges: Map<string, CollaboratorEdge>;
  influenceEdges: Map<string, InfluenceEdge>;
  inspiredDirections: Map<string, InspiredDirection>;
  creativeIterations: Map<string, CreativeIteration>;
  originalityWarnings: Map<string, OriginalityWarning>;
  fusionPaths: Map<string, FusionPath>;
  promptExports: Map<string, PromptExport>;
  scores: Map<string, ProducerScoreCard>;
  seeded: boolean;
}

const createInitialState = (): ProducerDnaState => ({
  producers: new Map(),
  profiles: new Map(),
  works: new Map(),
  credits: new Map(),
  sources: new Map(),
  gearClaims: new Map(),
  collaboratorEdges: new Map(),
  influenceEdges: new Map(),
  inspiredDirections: new Map(),
  creativeIterations: new Map(),
  originalityWarnings: new Map(),
  fusionPaths: new Map(),
  promptExports: new Map(),
  scores: new Map(),
  seeded: false
});

const globalRef = globalThis as typeof globalThis & {
  __producerDnaStore?: ProducerDnaState;
};

const state: ProducerDnaState =
  globalRef.__producerDnaStore ?? createInitialState();
globalRef.__producerDnaStore = state;

const buildSkeletonProfile = (
  producerId: string,
  seed: SeedProducer
): ProducerProfile => ({
  id: newId(),
  producerId,
  longForm: `${seed.name} — ${seed.coreDnaAngle}. Profile pending expansion through the standard order: metadata → source verification → key works → listening analysis → DNA summary → type-beat translation → originality warnings → iteration matrix → scoring → open questions.`,
  sonicDna: { notes: "Pending listening pass." },
  rhythmicDna: { notes: "Pending rhythmic pass." },
  melodicHarmonicDna: { notes: "Pending harmonic pass." },
  arrangementDna: { notes: "Pending arrangement pass." },
  mixingDna: { notes: "Pending mix pass." },
  samplingDna: {
    clearanceStatus: "unknown",
    notes: "Pending sample-tradition pass."
  },
  styleNuanceMap: {},
  analysisConfidence: "E",
  updatedAt: now()
});

const seedFromBatch = (): void => {
  if (state.seeded) return;
  for (const seed of BATCH_001_PRODUCERS) {
    const producer: Producer = {
      id: seed.id,
      name: seed.name,
      aliases: [],
      country: seed.country,
      city: seed.city,
      region: seed.region,
      activeYearsStart: seed.activeYearsStart,
      activeYearsEnd: seed.activeYearsEnd,
      primaryScenes: seed.primaryScenes,
      primaryGenres: seed.primaryGenres,
      primaryRoles: seed.primaryRoles,
      primaryEras: seed.primaryEras,
      officialLinks: [],
      coreDnaAngle: seed.coreDnaAngle,
      researchConfidence: seed.researchConfidence,
      createdAt: now(),
      updatedAt: now()
    };
    state.producers.set(producer.id, producer);
    const profile = buildSkeletonProfile(producer.id, seed);
    state.profiles.set(producer.id, profile);
    state.scores.set(producer.id, {});
  }
  state.seeded = true;
};

seedFromBatch();

const scoreAverage = (score: ProducerScoreCard | undefined): number | null => {
  if (!score) return null;
  const values = SCORING_AXES.map((axis) => score[axis]).filter(
    (value): value is number => typeof value === "number"
  );
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
};

const toSummary = (producer: Producer): ProducerSummary => ({
  id: producer.id,
  name: producer.name,
  country: producer.country,
  region: producer.region,
  primaryGenres: producer.primaryGenres,
  primaryRoles: producer.primaryRoles,
  primaryEras: producer.primaryEras,
  coreDnaAngle: producer.coreDnaAngle,
  researchConfidence: producer.researchConfidence,
  scoreAverage: scoreAverage(state.scores.get(producer.id))
});

const byProducer = <T extends { producerId: string }>(
  map: Map<string, T>,
  producerId: string
): T[] => [...map.values()].filter((row) => row.producerId === producerId);

export const listProducers = (
  filters: ProducerSearchFilters = {}
): ProducerSummary[] => {
  const q = filters.q?.toLowerCase().trim();
  return [...state.producers.values()]
    .filter((producer) => {
      if (
        q &&
        ![producer.name, producer.coreDnaAngle, ...producer.primaryScenes]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      if (filters.era && !producer.primaryEras.includes(filters.era as never)) {
        return false;
      }
      if (
        filters.genre &&
        !producer.primaryGenres.includes(filters.genre as never)
      ) {
        return false;
      }
      if (
        filters.role &&
        !producer.primaryRoles.includes(filters.role as never)
      ) {
        return false;
      }
      if (filters.region) {
        const haystack = [producer.country, producer.region, producer.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(filters.region.toLowerCase())) {
          return false;
        }
      }
      if (
        filters.confidence &&
        producer.researchConfidence !== filters.confidence
      ) {
        return false;
      }
      if (filters.minScoreAxis && typeof filters.minScoreValue === "number") {
        const score = state.scores.get(producer.id);
        const value = score?.[filters.minScoreAxis];
        if (typeof value !== "number" || value < filters.minScoreValue) {
          return false;
        }
      }
      return true;
    })
    .map(toSummary)
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getProducerRecord = (
  producerId: string
): ProducerDnaRecord | undefined => {
  const producer = state.producers.get(producerId);
  if (!producer) return undefined;
  const profile =
    state.profiles.get(producerId) ?? buildSkeletonProfile(producer.id, {
      id: producer.id,
      name: producer.name,
      primaryScenes: producer.primaryScenes,
      primaryGenres: producer.primaryGenres,
      primaryRoles: producer.primaryRoles,
      primaryEras: producer.primaryEras,
      coreDnaAngle: producer.coreDnaAngle,
      researchConfidence: producer.researchConfidence
    });
  return {
    producer,
    profile,
    works: byProducer(state.works, producerId),
    credits: byProducer(state.credits, producerId),
    sources: byProducer(state.sources, producerId),
    gearClaims: byProducer(state.gearClaims, producerId),
    collaboratorEdges: byProducer(state.collaboratorEdges, producerId),
    influenceEdges: byProducer(state.influenceEdges, producerId),
    inspiredDirections: byProducer(state.inspiredDirections, producerId),
    creativeIterations: byProducer(state.creativeIterations, producerId),
    originalityWarnings: byProducer(state.originalityWarnings, producerId),
    fusionPaths: byProducer(state.fusionPaths, producerId),
    promptExports: byProducer(state.promptExports, producerId),
    score: state.scores.get(producerId) ?? {}
  };
};

export interface CreateProducerInput {
  name: string;
  realName?: string;
  country?: string;
  city?: string;
  region?: string;
  publicIdentity?: string;
  activeYearsStart?: number;
  activeYearsEnd?: number;
  primaryScenes?: string[];
  primaryGenres?: Producer["primaryGenres"];
  primaryRoles?: Producer["primaryRoles"];
  primaryEras?: Producer["primaryEras"];
  officialLinks?: Producer["officialLinks"];
  coreDnaAngle: string;
  researchConfidence?: Producer["researchConfidence"];
}

const nextProducerId = (): string => {
  const existing = [...state.producers.keys()]
    .filter((id) => /^PDNA-\d+$/.test(id))
    .map((id) => Number(id.slice(5)))
    .sort((a, b) => b - a);
  const next = (existing[0] ?? 0) + 1;
  return `PDNA-${String(next).padStart(6, "0")}`;
};

export const createProducer = (input: CreateProducerInput): Producer => {
  const id = nextProducerId();
  const producer: Producer = {
    id,
    name: input.name,
    realName: input.realName,
    aliases: [],
    publicIdentity: input.publicIdentity,
    country: input.country,
    city: input.city,
    region: input.region,
    activeYearsStart: input.activeYearsStart,
    activeYearsEnd: input.activeYearsEnd,
    primaryScenes: input.primaryScenes ?? [],
    primaryGenres: input.primaryGenres ?? [],
    primaryRoles: input.primaryRoles ?? [],
    primaryEras: input.primaryEras ?? [],
    officialLinks: input.officialLinks ?? [],
    coreDnaAngle: input.coreDnaAngle,
    researchConfidence: input.researchConfidence ?? "E",
    createdAt: now(),
    updatedAt: now()
  };
  state.producers.set(id, producer);
  state.profiles.set(
    id,
    buildSkeletonProfile(id, {
      id,
      name: producer.name,
      primaryScenes: producer.primaryScenes,
      primaryGenres: producer.primaryGenres,
      primaryRoles: producer.primaryRoles,
      primaryEras: producer.primaryEras,
      coreDnaAngle: producer.coreDnaAngle,
      researchConfidence: producer.researchConfidence
    })
  );
  state.scores.set(id, {});
  return producer;
};

export const updateProducer = (
  id: string,
  updates: Partial<Omit<Producer, "id" | "createdAt">>
): Producer | undefined => {
  const existing = state.producers.get(id);
  if (!existing) return undefined;
  const next: Producer = { ...existing, ...updates, id, updatedAt: now() };
  state.producers.set(id, next);
  return next;
};

export const updateProfile = (
  producerId: string,
  updates: Partial<Omit<ProducerProfile, "id" | "producerId">>
): ProducerProfile | undefined => {
  const existing = state.profiles.get(producerId);
  if (!existing) return undefined;
  const next: ProducerProfile = {
    ...existing,
    ...updates,
    id: existing.id,
    producerId,
    updatedAt: now()
  };
  state.profiles.set(producerId, next);
  return next;
};

export const addCredit = (
  producerId: string,
  credit: Omit<Credit, "id" | "producerId">
): Credit | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const row: Credit = { ...credit, id: newId(), producerId };
  state.credits.set(row.id, row);
  return row;
};

export const addWork = (
  producerId: string,
  work: Omit<Work, "id" | "producerId">
): Work | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const row: Work = { ...work, id: newId(), producerId };
  state.works.set(row.id, row);
  return row;
};

export const addSource = (
  producerId: string,
  source: Omit<Source, "id" | "producerId">
): Source | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const row: Source = { ...source, id: newId(), producerId };
  state.sources.set(row.id, row);
  return row;
};

export const addGearClaim = (
  producerId: string,
  claim: Omit<GearClaim, "id" | "producerId">
): GearClaim | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const row: GearClaim = { ...claim, id: newId(), producerId };
  state.gearClaims.set(row.id, row);
  return row;
};

export const addCollaboratorEdge = (
  producerId: string,
  edge: Omit<CollaboratorEdge, "id" | "producerId">
): CollaboratorEdge | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const row: CollaboratorEdge = { ...edge, id: newId(), producerId };
  state.collaboratorEdges.set(row.id, row);
  return row;
};

export const addInfluenceEdge = (
  producerId: string,
  edge: Omit<InfluenceEdge, "id" | "producerId">
): InfluenceEdge | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const row: InfluenceEdge = { ...edge, id: newId(), producerId };
  state.influenceEdges.set(row.id, row);
  return row;
};

export const addInspiredDirection = (
  producerId: string,
  row: Omit<InspiredDirection, "id" | "producerId">
): InspiredDirection | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const entry: InspiredDirection = { ...row, id: newId(), producerId };
  state.inspiredDirections.set(entry.id, entry);
  return entry;
};

export const addCreativeIteration = (
  producerId: string,
  row: Omit<CreativeIteration, "id" | "producerId">
): CreativeIteration | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const entry: CreativeIteration = { ...row, id: newId(), producerId };
  state.creativeIterations.set(entry.id, entry);
  return entry;
};

export const addOriginalityWarning = (
  producerId: string,
  row: Omit<OriginalityWarning, "id" | "producerId">
): OriginalityWarning | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const entry: OriginalityWarning = { ...row, id: newId(), producerId };
  state.originalityWarnings.set(entry.id, entry);
  return entry;
};

export const addFusionPath = (
  producerId: string,
  row: Omit<FusionPath, "id" | "producerId">
): FusionPath | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const entry: FusionPath = { ...row, id: newId(), producerId };
  state.fusionPaths.set(entry.id, entry);
  return entry;
};

export const addPromptExport = (
  producerId: string,
  row: Omit<PromptExport, "id" | "producerId">
): PromptExport | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const entry: PromptExport = { ...row, id: newId(), producerId };
  state.promptExports.set(entry.id, entry);
  return entry;
};

export const updateScore = (
  producerId: string,
  score: ProducerScoreCard
): ProducerScoreCard | undefined => {
  if (!state.producers.has(producerId)) return undefined;
  const existing = state.scores.get(producerId) ?? {};
  const merged: ProducerScoreCard = {
    ...existing,
    ...score,
    scoredAt: now()
  };
  state.scores.set(producerId, merged);
  return merged;
};

export interface BaseStats {
  totalProducers: number;
  byConfidence: Record<string, number>;
  byPrimaryRegion: Array<{ region: string; count: number }>;
  byTopGenre: Array<{ genre: string; count: number }>;
  byEra: Array<{ era: string; count: number }>;
  scoredProducerCount: number;
  averageScoreOverall: number | null;
  totalWorks: number;
  totalCredits: number;
  totalSources: number;
  totalGearClaims: number;
  roadmap: SeedBatchPlan[];
}

const tally = <K extends string>(
  rows: Array<K | undefined>
): Array<{ key: K; count: number }> => {
  const map = new Map<K, number>();
  for (const row of rows) {
    if (!row) continue;
    map.set(row, (map.get(row) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
};

export const getStats = (): BaseStats => {
  const producers = [...state.producers.values()];
  const confidenceCounts: Record<string, number> = {};
  for (const producer of producers) {
    confidenceCounts[producer.researchConfidence] =
      (confidenceCounts[producer.researchConfidence] ?? 0) + 1;
  }

  const regions = tally(
    producers.map((producer) => producer.country ?? producer.region ?? "Unknown")
  );
  const genres = tally(producers.flatMap((producer) => producer.primaryGenres));
  const eras = tally(producers.flatMap((producer) => producer.primaryEras));

  const averages = producers
    .map((producer) => scoreAverage(state.scores.get(producer.id)))
    .filter((value): value is number => value !== null);
  const averageScoreOverall =
    averages.length > 0
      ? Math.round((averages.reduce((sum, value) => sum + value, 0) / averages.length) * 10) /
        10
      : null;

  return {
    totalProducers: producers.length,
    byConfidence: confidenceCounts,
    byPrimaryRegion: regions.slice(0, 12).map(({ key, count }) => ({
      region: key,
      count
    })),
    byTopGenre: genres.slice(0, 12).map(({ key, count }) => ({
      genre: key,
      count
    })),
    byEra: eras.map(({ key, count }) => ({ era: key, count })),
    scoredProducerCount: averages.length,
    averageScoreOverall,
    totalWorks: state.works.size,
    totalCredits: state.credits.size,
    totalSources: state.sources.size,
    totalGearClaims: state.gearClaims.size,
    roadmap: BATCH_ROADMAP
  };
};

export const getRoadmap = (): SeedBatchPlan[] => BATCH_ROADMAP;

export const __resetForTests = (): void => {
  state.producers.clear();
  state.profiles.clear();
  state.works.clear();
  state.credits.clear();
  state.sources.clear();
  state.gearClaims.clear();
  state.collaboratorEdges.clear();
  state.influenceEdges.clear();
  state.inspiredDirections.clear();
  state.creativeIterations.clear();
  state.originalityWarnings.clear();
  state.fusionPaths.clear();
  state.promptExports.clear();
  state.scores.clear();
  state.seeded = false;
  seedFromBatch();
};
