import { NextResponse } from "next/server";

import { getProducerDnaRecord } from "@/lib/producer-dna/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const record = getProducerDnaRecord(producerId);

  if (!record) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }

  return NextResponse.json({ record });
}
