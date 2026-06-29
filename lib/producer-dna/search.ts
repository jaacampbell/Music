import type {
  ProducerDnaRecord,
  ProducerDnaSearchFilters,
  ProducerDnaSearchResult
} from "@/lib/producer-dna/types";

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);

const matchesQuery = (record: ProducerDnaRecord, query: string): string[] => {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const fields: Array<{ name: string; text: string }> = [
    { name: "name", text: record.producer.name },
    { name: "region", text: record.producer.region ?? "" },
    { name: "country", text: record.producer.country ?? "" },
    { name: "scene", text: record.producer.primaryScenes.join(" ") },
    { name: "coreDnaAngle", text: record.producer.coreDnaAngle },
    { name: "genres", text: record.capsule.primaryGenres.join(" ") },
    { name: "signatureSound", text: record.capsule.signatureSoundSummary },
    { name: "artisticDna", text: record.capsule.artisticDna },
    { name: "rhythmicDna", text: record.capsule.rhythmicDna },
    { name: "searchableText", text: record.producer.searchableText }
  ];

  const matched = new Set<string>();
  for (const token of tokens) {
    for (const field of fields) {
      if (field.text.toLowerCase().includes(token)) {
        matched.add(field.name);
      }
    }
  }
  return [...matched];
};

export const searchProducerDna = (
  records: ProducerDnaRecord[],
  filters: ProducerDnaSearchFilters
): { results: ProducerDnaSearchResult[]; total: number } => {
  let filtered = records;

  if (filters.batchId) {
    filtered = filtered.filter((r) => r.producer.batchId === filters.batchId);
  }

  if (filters.region) {
    const region = filters.region.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.producer.region?.toLowerCase().includes(region) ||
        r.producer.country?.toLowerCase().includes(region)
    );
  }

  if (filters.genre) {
    const genre = filters.genre.toLowerCase();
    filtered = filtered.filter((r) =>
      r.capsule.primaryGenres.some((g) => g.toLowerCase().includes(genre))
    );
  }

  if (filters.profileStatus) {
    filtered = filtered.filter((r) => r.profile?.profileStatus === filters.profileStatus);
  }

  let results: ProducerDnaSearchResult[] = filtered.map((record) => ({
    producer: record.producer,
    capsule: record.capsule,
    scores: record.scores,
    matchFields: filters.query ? matchesQuery(record, filters.query) : []
  }));

  if (filters.query) {
    results = results
      .filter((r) => r.matchFields.length > 0)
      .sort((a, b) => b.matchFields.length - a.matchFields.length);
  }

  const total = results.length;
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 50;

  return {
    results: results.slice(offset, offset + limit),
    total
  };
};

export const buildSearchIndex = (records: ProducerDnaRecord[]): Map<string, string[]> => {
  const index = new Map<string, string[]>();
  for (const record of records) {
    const tokens = tokenize(record.producer.searchableText);
    for (const token of tokens) {
      const existing = index.get(token) ?? [];
      existing.push(record.producer.id);
      index.set(token, existing);
    }
  }
  return index;
};
