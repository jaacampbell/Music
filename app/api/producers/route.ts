import { NextResponse } from "next/server";

import {
  getProducerTaxonomy,
  searchProducers,
  type ProducerSearchFilters
} from "@/lib/producer-dna";
import type { ConfidenceTier, EraSlug } from "@/lib/types";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filters: ProducerSearchFilters = {
    query: searchParams.get("query") ?? undefined,
    era: (searchParams.get("era") as EraSlug | null) ?? undefined,
    genre: searchParams.get("genre") ?? undefined,
    role: searchParams.get("role") ?? undefined,
    confidence: (searchParams.get("confidence") as ConfidenceTier | null) ?? undefined
  };

  const producers = searchProducers(filters);
  return NextResponse.json({
    producers,
    total: producers.length,
    taxonomy: getProducerTaxonomy()
  });
}
