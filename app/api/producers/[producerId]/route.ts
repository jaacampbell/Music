import { NextResponse } from "next/server";

import { averageScore, getProducer } from "@/lib/producer-dna/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const producer = getProducer(producerId);
  if (!producer) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({
    producer: { ...producer, overallScore: averageScore(producer.scores) }
  });
}
