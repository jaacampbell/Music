import { NextResponse } from "next/server";

import { dimensionLeaders, producerFacets } from "@/lib/producer-dna/store";
import {
  CONFIDENCE_TIERS,
  ERA_TAXONOMY,
  GENRE_TAXONOMY,
  PROFILE_BUILD_ORDER,
  ROLE_TAXONOMY,
  SCORE_DIMENSIONS,
  SOURCE_ARCHITECTURE
} from "@/lib/producer-dna/taxonomy";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    facets: producerFacets(),
    dimensionLeaders: dimensionLeaders(),
    confidenceTiers: CONFIDENCE_TIERS,
    eras: ERA_TAXONOMY,
    roles: ROLE_TAXONOMY,
    genres: GENRE_TAXONOMY,
    scoreDimensions: SCORE_DIMENSIONS,
    sourceArchitecture: SOURCE_ARCHITECTURE,
    profileBuildOrder: PROFILE_BUILD_ORDER
  });
}
