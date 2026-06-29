import { NextResponse } from "next/server";

import { getProducerDnaRecord, producerDnaResearchMeta } from "@/lib/producer-dna/research-base";

export async function GET(
  _request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const row = getProducerDnaRecord(producerId);

  if (!row) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }

  return NextResponse.json({ row, metadata: producerDnaResearchMeta });
}
