import { NextResponse } from "next/server";

import { CONFIDENCE_TIERS, PROFILE_GENERATION_ORDER } from "@/lib/producer-dna/confidence";
import { METADATA_SOURCES } from "@/lib/producer-dna/metadata-sources";
import { SCORING_DIMENSION_LABELS, SCORING_DIMENSIONS } from "@/lib/producer-dna/scoring";
import {
  ERA_TAXONOMY,
  GENRE_SCENE_TAXONOMY,
  PRODUCER_ROLE_TAXONOMY
} from "@/lib/producer-dna/taxonomy";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    eras: ERA_TAXONOMY,
    genres: GENRE_SCENE_TAXONOMY,
    roles: PRODUCER_ROLE_TAXONOMY,
    confidenceTiers: CONFIDENCE_TIERS,
    scoringDimensions: SCORING_DIMENSIONS.map((key) => ({
      key,
      label: SCORING_DIMENSION_LABELS[key]
    })),
    profileGenerationOrder: PROFILE_GENERATION_ORDER,
    metadataSources: METADATA_SOURCES
  });
}
