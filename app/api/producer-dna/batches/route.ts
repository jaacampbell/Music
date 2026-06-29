import { NextResponse } from "next/server";

import { ALL_BATCHES, FUTURE_BATCHES } from "@/lib/producer-dna/batches";
import { getStoreStats } from "@/lib/producer-dna/store";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    current: ALL_BATCHES,
    roadmap: FUTURE_BATCHES,
    stats: getStoreStats()
  });
}
