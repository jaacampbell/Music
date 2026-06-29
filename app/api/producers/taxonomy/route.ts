import { NextResponse } from "next/server";

import {
  CONFIDENCE_TIERS,
  CONFIDENCE_TIER_LABELS,
  CREDIT_ROLES,
  ERAS,
  GEAR_CLAIM_STATUS,
  GENRES,
  PRODUCER_ROLES,
  SCORING_AXES,
  SOURCE_TYPES
} from "@/lib/producer-dna/taxonomy";
import { getRoadmap } from "@/lib/producer-dna/store";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    eras: ERAS,
    genres: GENRES,
    producerRoles: PRODUCER_ROLES,
    creditRoles: CREDIT_ROLES,
    sourceTypes: SOURCE_TYPES,
    gearClaimStatuses: GEAR_CLAIM_STATUS,
    confidenceTiers: CONFIDENCE_TIERS,
    confidenceTierLabels: CONFIDENCE_TIER_LABELS,
    scoringAxes: SCORING_AXES,
    roadmap: getRoadmap()
  });
}
