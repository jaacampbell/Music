import { NextResponse } from "next/server";

import { getDatabaseStats, searchProducers } from "@/lib/producer-dna/store";
import type {
  ConfidenceTier,
  DnaScoreDimension,
  EraId,
  ProducerRole
} from "@/lib/producer-dna/types";

const ROLE_SET: ReadonlySet<ProducerRole> = new Set<ProducerRole>([
  "beatmaker",
  "producer-auteur",
  "studio-producer",
  "engineer-producer",
  "dj-producer",
  "composer-producer",
  "arranger",
  "remixer",
  "sound-designer",
  "executive-producer",
  "label-architect",
  "sampling-architect",
  "vocal-producer",
  "mix-engineer-as-producer",
  "band-member-as-producer",
  "production-collective"
]);

const ERA_SET: ReadonlySet<EraId> = new Set<EraId>([
  "pre-tape-studio",
  "tape-console",
  "wall-of-sound",
  "dub-soundsystem",
  "disco-electronic-studio",
  "early-hip-hop-sampling",
  "midi-sampler",
  "daw",
  "internet-beatmaker",
  "streaming-social",
  "ai-assisted"
]);

const TIER_SET: ReadonlySet<ConfidenceTier> = new Set<ConfidenceTier>([
  "A",
  "B",
  "C",
  "D",
  "E",
  "Unknown"
]);

const SCORE_DIMS: ReadonlySet<DnaScoreDimension> = new Set<DnaScoreDimension>([
  "innovation",
  "influence",
  "technicalCraft",
  "sonicIdentity",
  "arrangementSkill",
  "rhythmDesign",
  "melodicHarmonicIdentity",
  "soundDesign",
  "mixingAesthetics",
  "culturalImportance",
  "commercialImpact",
  "undergroundImpact",
  "longevity",
  "adaptability",
  "originality"
]);

const asRole = (value: string | null): ProducerRole | undefined =>
  value && ROLE_SET.has(value as ProducerRole) ? (value as ProducerRole) : undefined;

const asEra = (value: string | null): EraId | undefined =>
  value && ERA_SET.has(value as EraId) ? (value as EraId) : undefined;

const asTier = (value: string | null): ConfidenceTier | undefined =>
  value && TIER_SET.has(value as ConfidenceTier) ? (value as ConfidenceTier) : undefined;

const asScoreDim = (value: string | null): DnaScoreDimension | undefined =>
  value && SCORE_DIMS.has(value as DnaScoreDimension) ? (value as DnaScoreDimension) : undefined;

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const params = url.searchParams;

  const minScoreValueRaw = params.get("minScoreValue");
  const minScoreValue =
    minScoreValueRaw !== null && !Number.isNaN(Number(minScoreValueRaw))
      ? Math.max(0, Math.min(10, Number(minScoreValueRaw)))
      : undefined;

  const producers = searchProducers({
    query: params.get("q") ?? undefined,
    region: params.get("region") ?? undefined,
    genre: params.get("genre") ?? undefined,
    role: asRole(params.get("role")),
    era: asEra(params.get("era")),
    minHistoricalTier: asTier(params.get("minHistoricalTier")),
    minScoreDimension: asScoreDim(params.get("minScoreDimension")),
    minScoreValue
  });

  return NextResponse.json({
    producers,
    count: producers.length,
    stats: getDatabaseStats()
  });
}
