import { NextResponse } from "next/server";

import {
  BATCH_001,
  CONFIDENCE_TIERS,
  J_DILLA_CAPSULE,
  NEXT_PRODUCER_DNA_BATCHES,
  PRODUCER_DNA_OPERATING_ORDER,
  PRODUCER_DNA_SCORING_RUBRIC,
  PRODUCER_DNA_SOURCE_OPTIONS,
  PRODUCER_DNA_TABLES,
  PRODUCER_DNA_TAXONOMY,
  type ResearchConfidenceTier,
  searchProducerDnaSeeds
} from "@/lib/producer-dna";

const confidenceTiers: ResearchConfidenceTier[] = ["A", "B", "C", "D", "E", "Unknown"];

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";
  const confidenceParam = searchParams.get("confidence") as ResearchConfidenceTier | null;
  const confidenceTier =
    confidenceParam && confidenceTiers.includes(confidenceParam) ? confidenceParam : undefined;
  const seeds = searchProducerDnaSeeds(query, confidenceTier);

  return NextResponse.json({
    architecture: {
      sources: PRODUCER_DNA_SOURCE_OPTIONS,
      tables: PRODUCER_DNA_TABLES,
      confidenceTiers: CONFIDENCE_TIERS,
      taxonomy: PRODUCER_DNA_TAXONOMY,
      scoringRubric: PRODUCER_DNA_SCORING_RUBRIC,
      operatingOrder: PRODUCER_DNA_OPERATING_ORDER
    },
    batch: {
      ...BATCH_001,
      seeds
    },
    exampleCapsule: J_DILLA_CAPSULE,
    nextBatches: NEXT_PRODUCER_DNA_BATCHES,
    search: {
      query,
      confidenceTier: confidenceTier ?? null,
      resultCount: seeds.length
    }
  });
}
