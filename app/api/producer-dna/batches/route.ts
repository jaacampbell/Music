import { NextResponse } from "next/server";

import { ROADMAP_TARGET_PRODUCERS } from "@/lib/producer-dna/seed/batches";
import { getBatchingProgress, listBatches } from "@/lib/producer-dna/store";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const batchNumber = searchParams.get("batchNumber");

  if (batchNumber) {
    const batch = listBatches().find((b) => b.batchNumber === batchNumber);
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }
    return NextResponse.json({ batch });
  }

  return NextResponse.json({
    batches: listBatches(),
    roadmapTarget: ROADMAP_TARGET_PRODUCERS,
    batching: getBatchingProgress()
  });
}
