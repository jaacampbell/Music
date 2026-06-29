import { NextResponse } from "next/server";

import { getProducerTaxonomy } from "@/lib/producer-dna";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ taxonomy: getProducerTaxonomy() });
}
