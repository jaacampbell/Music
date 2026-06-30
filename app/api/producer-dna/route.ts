import { NextResponse } from "next/server";

import { getStoreStats, listProducers, getBatchingProgress } from "@/lib/producer-dna/store";

export async function GET(): Promise<NextResponse> {
  const producers = listProducers().map((record) => ({
    id: record.producer.id,
    name: record.producer.name,
    region: record.producer.region,
    country: record.producer.country,
    batchId: record.producer.batchId,
    coreDnaAngle: record.producer.coreDnaAngle,
    primaryGenres: record.capsule?.primaryGenres ?? [],
    signatureSoundSummary: record.capsule?.signatureSoundSummary,
    researchConfidence: record.capsule?.researchConfidence
  }));

  return NextResponse.json({
    producers,
    stats: getStoreStats(),
    batching: getBatchingProgress()
  });
}
