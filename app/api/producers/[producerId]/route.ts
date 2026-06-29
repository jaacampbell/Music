import { NextResponse } from "next/server";

import { getProducer } from "@/lib/producer-dna";

export async function GET(
  _request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const producer = getProducer(producerId);
  if (!producer) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ producer });
}
