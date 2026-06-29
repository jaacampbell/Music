import { BATCH_001 } from "@/lib/producer-dna/seed";
import {
  ERA_TAXONOMY,
  GENRE_TAXONOMY,
  ROLE_TAXONOMY,
  SCORE_DIMENSIONS
} from "@/lib/producer-dna/taxonomy";
import type {
  EraTag,
  ProducerDnaCapsule,
  ProducerScores,
  RoleTag
} from "@/lib/producer-dna/types";

const ERA_LABEL = new Map(ERA_TAXONOMY.map((tag) => [tag.value, tag.label]));
const ROLE_LABEL = new Map(ROLE_TAXONOMY.map((tag) => [tag.value, tag.label]));

/** All capsules across all batches. */
const ALL_CAPSULES: ProducerDnaCapsule[] = [...BATCH_001];

export interface ProducerQuery {
  q?: string;
  genre?: string;
  era?: EraTag;
  role?: RoleTag;
  region?: string;
  batch?: string;
  /** Sort key. Defaults to id. */
  sort?: "id" | "name" | "innovation" | "influence" | "originality" | "overall";
}

export const eraLabel = (era: EraTag): string => ERA_LABEL.get(era) ?? era;
export const roleLabel = (role: RoleTag): string => ROLE_LABEL.get(role) ?? role;

export const averageScore = (scores: ProducerScores): number => {
  const values = Object.values(scores);
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
};

const searchableText = (capsule: ProducerDnaCapsule): string =>
  [
    capsule.id,
    capsule.name,
    capsule.realName ?? "",
    ...capsule.aliases,
    capsule.countryRegion,
    capsule.regionScene,
    capsule.sceneMovement,
    ...capsule.primaryGenres,
    ...capsule.eras.map(eraLabel),
    ...capsule.roles.map(roleLabel),
    capsule.coreDnaAngle,
    capsule.signatureSoundSummary,
    capsule.artisticDna,
    capsule.technicalDna,
    capsule.rhythmicDna,
    capsule.melodicHarmonicDna,
    capsule.arrangementDna,
    capsule.typeBeatDirection,
    capsule.originalityTwist
  ]
    .join(" \u2022 ")
    .toLowerCase();

const sortCapsules = (
  capsules: ProducerDnaCapsule[],
  sort: ProducerQuery["sort"]
): ProducerDnaCapsule[] => {
  const sorted = [...capsules];
  switch (sort) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "innovation":
      return sorted.sort((a, b) => b.scores.innovation - a.scores.innovation);
    case "influence":
      return sorted.sort((a, b) => b.scores.influence - a.scores.influence);
    case "originality":
      return sorted.sort((a, b) => b.scores.originality - a.scores.originality);
    case "overall":
      return sorted.sort((a, b) => averageScore(b.scores) - averageScore(a.scores));
    case "id":
    default:
      return sorted.sort((a, b) => a.id.localeCompare(b.id));
  }
};

export const searchProducers = (query: ProducerQuery = {}): ProducerDnaCapsule[] => {
  const needle = query.q?.trim().toLowerCase();
  const genre = query.genre?.trim().toLowerCase();
  const region = query.region?.trim().toLowerCase();

  const filtered = ALL_CAPSULES.filter((capsule) => {
    if (needle && !searchableText(capsule).includes(needle)) {
      return false;
    }
    if (
      genre &&
      !capsule.primaryGenres.some((value) => value.toLowerCase() === genre)
    ) {
      return false;
    }
    if (query.era && !capsule.eras.includes(query.era)) {
      return false;
    }
    if (query.role && !capsule.roles.includes(query.role)) {
      return false;
    }
    if (
      region &&
      !`${capsule.countryRegion} ${capsule.regionScene}`
        .toLowerCase()
        .includes(region)
    ) {
      return false;
    }
    if (query.batch && capsule.batch !== query.batch) {
      return false;
    }
    return true;
  });

  return sortCapsules(filtered, query.sort);
};

export const getProducer = (id: string): ProducerDnaCapsule | undefined =>
  ALL_CAPSULES.find((capsule) => capsule.id === id.toUpperCase());

export interface FacetCount {
  value: string;
  label: string;
  count: number;
}

const countBy = (
  pluck: (capsule: ProducerDnaCapsule) => Array<{ value: string; label: string }>
): FacetCount[] => {
  const counts = new Map<string, FacetCount>();
  for (const capsule of ALL_CAPSULES) {
    for (const { value, label } of pluck(capsule)) {
      const existing = counts.get(value);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(value, { value, label, count: 1 });
      }
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
};

export const producerFacets = (): {
  total: number;
  genres: FacetCount[];
  eras: FacetCount[];
  roles: FacetCount[];
} => ({
  total: ALL_CAPSULES.length,
  genres: countBy((capsule) =>
    capsule.primaryGenres.map((value) => ({ value, label: value }))
  ),
  eras: countBy((capsule) =>
    capsule.eras.map((value) => ({ value, label: eraLabel(value) }))
  ),
  roles: countBy((capsule) =>
    capsule.roles.map((value) => ({ value, label: roleLabel(value) }))
  )
});

export const dimensionLeaders = (): Array<{
  dimension: string;
  label: string;
  leader: { id: string; name: string; score: number };
}> =>
  SCORE_DIMENSIONS.map(({ key, label }) => {
    const leader = [...ALL_CAPSULES].sort(
      (a, b) => b.scores[key] - a.scores[key]
    )[0];
    return {
      dimension: key,
      label,
      leader: { id: leader.id, name: leader.name, score: leader.scores[key] }
    };
  });

export const knownGenres = (): string[] => GENRE_TAXONOMY;
