import { NextResponse } from "next/server";

import { CONFIDENCE_TIERS, PROFILE_GENERATION_ORDER, PROFILE_GENERATION_LABELS } from "@/lib/producer-dna/confidence";
import { DNA_SCORE_DIMENSIONS } from "@/lib/producer-dna/scoring";
import { METADATA_SOURCES } from "@/lib/producer-dna/sources";
import {
  ERA_LABELS,
  ERA_TAXONOMY,
  GENRE_LABELS,
  GENRE_SCENE_TAXONOMY,
  PRODUCER_ROLE_TAXONOMY,
  ROLE_LABELS
} from "@/lib/producer-dna/taxonomy";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    eras: ERA_TAXONOMY.map((id) => ({ id, label: ERA_LABELS[id] })),
    genres: GENRE_SCENE_TAXONOMY.map((id) => ({ id, label: GENRE_LABELS[id] })),
    roles: PRODUCER_ROLE_TAXONOMY.map((id) => ({ id, label: ROLE_LABELS[id] })),
    confidenceTiers: CONFIDENCE_TIERS,
    scoreDimensions: DNA_SCORE_DIMENSIONS,
    metadataSources: METADATA_SOURCES,
    profileGenerationOrder: PROFILE_GENERATION_ORDER.map((step) => ({
      step,
      label: PROFILE_GENERATION_LABELS[step]
    }))
  });
}
