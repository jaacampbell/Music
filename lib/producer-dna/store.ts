import type {
  ProducerBatch,
  ProducerDnaRecord,
  ProducerSearchFilters,
  ProducerSearchResult
} from "@/lib/producer-dna/types";
import { ALL_BATCHES } from "@/lib/producer-dna/seed/batches";
import { ALL_SEED_RECORDS } from "@/lib/producer-dna/seed/index";

interface ProducerDnaStoreState {
  records: Map<string, ProducerDnaRecord>;
  batches: Map<string, ProducerBatch>;
}

const createInitialState = (): ProducerDnaStoreState => {
  const records = new Map<string, ProducerDnaRecord>();
  for (const record of ALL_SEED_RECORDS) {
    records.set(record.producer.id, record);
  }

  const batches = new Map<string, ProducerBatch>();
  for (const batch of ALL_BATCHES) {
    batches.set(batch.batchNumber, { ...batch });
  }

  return { records, batches };
};

const globalStore = globalThis as typeof globalThis & {
  __producerDnaStore?: ProducerDnaStoreState;
};

const state: ProducerDnaStoreState =
  globalStore.__producerDnaStore ?? createInitialState();
globalStore.__producerDnaStore = state;

export const listProducers = (): ProducerDnaRecord[] =>
  Array.from(state.records.values()).sort((a, b) =>
    a.producer.id.localeCompare(b.producer.id)
  );

export const getProducer = (producerId: string): ProducerDnaRecord | undefined =>
  state.records.get(producerId);

export const listBatches = (): ProducerBatch[] =>
  Array.from(state.batches.values()).sort((a, b) =>
    a.batchNumber.localeCompare(b.batchNumber)
  );

export const getBatch = (batchNumber: string): ProducerBatch | undefined =>
  state.batches.get(batchNumber);

export const getProducersByBatch = (batchNumber: string): ProducerDnaRecord[] =>
  listProducers().filter((r) => r.producer.batchId === batchNumber);

export const updateBatchStatus = (
  batchNumber: string,
  update: Partial<Pick<ProducerBatch, "status" | "lastResearchedAt" | "lastResearchBatchId">>
): ProducerBatch | undefined => {
  const batch = state.batches.get(batchNumber);
  if (!batch) return undefined;
  const updated = { ...batch, ...update };
  state.batches.set(batchNumber, updated);
  return updated;
};

export const getSeededBatchNumbers = (): string[] =>
  listBatches()
    .filter((b) => b.producerCount > 0)
    .map((b) => b.batchNumber);

export const getBatchingProgress = (): {
  totalProducers: number;
  seededBatches: number;
  plannedBatches: number;
  researchedBatches: number;
  nextBatchToSeed: string | undefined;
  nextBatchToResearch: string | undefined;
} => {
  const batches = listBatches();
  const seeded = batches.filter((b) => b.producerCount > 0);
  const researched = batches.filter((b) => b.status === "researched");
  const nextToResearch = batches.find(
    (b) => b.producerCount > 0 && b.status !== "researched" && b.status !== "researching"
  );
  const nextToSeed = batches.find((b) => b.producerCount === 0);

  return {
    totalProducers: listProducers().length,
    seededBatches: seeded.length,
    plannedBatches: batches.length,
    researchedBatches: researched.length,
    nextBatchToSeed: nextToSeed?.batchNumber,
    nextBatchToResearch: nextToResearch?.batchNumber
  };
};

export const getStoreStats = (): {
  totalProducers: number;
  totalBatches: number;
  seededBatches: number;
  verifiedClaims: number;
  analyticalClaims: number;
  creativeClaims: number;
} => {
  const records = listProducers();
  let verifiedClaims = 0;
  let analyticalClaims = 0;
  let creativeClaims = 0;

  for (const record of records) {
    verifiedClaims +=
      record.aliases.length +
      record.works.length +
      record.credits.length +
      record.sources.length +
      record.gearClaims.length +
      record.collaboratorEdges.length +
      record.influenceEdges.length;

    if (record.profile || record.sonicDna || record.rhythmicDna) {
      analyticalClaims += 1;
    }

    creativeClaims +=
      record.inspiredDirections.length +
      record.creativeIterations.length +
      record.originalityWarnings.length +
      record.fusionPaths.length +
      record.promptExports.length;
  }

  const seededBatches = new Set(records.map((r) => r.producer.batchId).filter(Boolean)).size;

  return {
    totalProducers: records.length,
    totalBatches: state.batches.size,
    seededBatches,
    verifiedClaims,
    analyticalClaims,
    creativeClaims
  };
};

const collectSearchableText = (
  record: ProducerDnaRecord,
  layer: ProducerSearchFilters["layer"]
): Array<{ text: string; field: string; layer: ProducerSearchResult["matchedLayer"] }> => {
  const items: Array<{
    text: string;
    field: string;
    layer: ProducerSearchResult["matchedLayer"];
  }> = [];

  const includeVerified = !layer || layer === "all" || layer === "verified";
  const includeAnalytical = !layer || layer === "all" || layer === "analytical";
  const includeCreative = !layer || layer === "all" || layer === "creative";

  if (includeVerified) {
    items.push(
      { text: record.producer.name, field: "name", layer: "verified" },
      { text: record.producer.coreDnaAngle ?? "", field: "coreDnaAngle", layer: "verified" },
      { text: record.producer.region ?? "", field: "region", layer: "verified" },
      { text: record.producer.country ?? "", field: "country", layer: "verified" },
      ...record.producer.primaryScenes.map((s) => ({
        text: s,
        field: "primaryScenes",
        layer: "verified" as const
      })),
      ...record.producer.aliases.map((a) => ({
        text: a,
        field: "aliases",
        layer: "verified" as const
      }))
    );
  }

  if (includeAnalytical) {
    if (record.capsule) {
      items.push(
        { text: record.capsule.signatureSoundSummary, field: "signatureSoundSummary", layer: "analytical" },
        { text: record.capsule.artisticDna, field: "artisticDna", layer: "analytical" },
        { text: record.capsule.technicalDna, field: "technicalDna", layer: "analytical" },
        { text: record.capsule.rhythmicDna, field: "rhythmicDna", layer: "analytical" },
        { text: record.capsule.melodicHarmonicDna, field: "melodicHarmonicDna", layer: "analytical" },
        { text: record.capsule.arrangementDna, field: "arrangementDna", layer: "analytical" },
        ...record.capsule.primaryGenres.map((g) => ({
          text: g,
          field: "primaryGenres",
          layer: "analytical" as const
        }))
      );
    }
    if (record.profile) {
      items.push({ text: record.profile.profileText, field: "profileText", layer: "analytical" });
    }
  }

  if (includeCreative) {
    for (const d of record.inspiredDirections) {
      items.push({ text: d.direction, field: "inspiredDirection", layer: "creative" });
    }
    for (const i of record.creativeIterations) {
      items.push({ text: i.direction, field: "creativeIteration", layer: "creative" });
    }
    for (const w of record.originalityWarnings) {
      items.push({ text: w.warning, field: "originalityWarning", layer: "creative" });
    }
    for (const f of record.fusionPaths) {
      items.push({ text: f.path, field: "fusionPath", layer: "creative" });
    }
    for (const p of record.promptExports) {
      items.push({ text: p.prompt, field: "promptExport", layer: "creative" });
    }
  }

  return items.filter((item) => item.text.length > 0);
};

export const searchProducers = (filters: ProducerSearchFilters = {}): ProducerSearchResult[] => {
  const query = filters.query?.toLowerCase().trim() ?? "";
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  let records = listProducers();

  if (filters.batchId) {
    records = records.filter((r) => r.producer.batchId === filters.batchId);
  }

  if (filters.region) {
    const region = filters.region.toLowerCase();
    records = records.filter(
      (r) =>
        r.producer.region?.toLowerCase().includes(region) ||
        r.producer.country?.toLowerCase().includes(region) ||
        r.capsule?.countryRegion.toLowerCase().includes(region)
    );
  }

  if (filters.genre) {
    const genre = filters.genre.toLowerCase();
    records = records.filter(
      (r) =>
        r.capsule?.primaryGenres.some((g) => g.toLowerCase().includes(genre)) ||
        r.producer.primaryScenes.some((s) => s.toLowerCase().includes(genre))
    );
  }

  const results: ProducerSearchResult[] = [];

  for (const record of records) {
    const searchable = collectSearchableText(record, filters.layer);
    const matchedFields: string[] = [];
    let snippet = record.producer.coreDnaAngle ?? record.capsule?.signatureSoundSummary ?? "";
    let matchedLayer: ProducerSearchResult["matchedLayer"] = "verified";

    if (query) {
      let matched = false;
      for (const item of searchable) {
        if (item.text.toLowerCase().includes(query)) {
          matched = true;
          matchedFields.push(item.field);
          matchedLayer = item.layer;
          if (item.text.length > snippet.length) {
            snippet = item.text.slice(0, 200);
          }
        }
      }
      if (!matched) continue;
    }

    results.push({
      producerId: record.producer.id,
      name: record.producer.name,
      region: record.producer.region,
      coreDnaAngle: record.producer.coreDnaAngle,
      matchedFields: matchedFields.length > 0 ? matchedFields : ["name"],
      matchedLayer,
      confidence: record.profile?.confidence ?? "D",
      snippet
    });
  }

  return results.slice(offset, offset + limit);
};
