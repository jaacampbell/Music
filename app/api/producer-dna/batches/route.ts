import { NextResponse } from "next/server";

import { getBatch, listBatches } from "@/lib/producer-dna/store";
import { ROADMAP_TARGET_PRODUCERS } from "@/lib/producer-dna/seed/batches";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const batchNumber = searchParams.get("batchNumber");

  if (batchNumber) {
    const batch = getBatch(batchNumber);
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }
    return NextResponse.json({ batch });
  }

  return NextResponse.json({
    batches: listBatches(),
    roadmapTarget: ROADMAP_TARGET_PRODUCERS
  });
}
