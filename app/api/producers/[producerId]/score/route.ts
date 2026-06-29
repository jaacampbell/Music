import { NextResponse } from "next/server";
import { z } from "zod";

import { SCORING_AXES } from "@/lib/producer-dna/taxonomy";
import { getProducerRecord, updateScore } from "@/lib/producer-dna/store";

const axesShape: Record<string, z.ZodType> = {};
for (const axis of SCORING_AXES) {
  axesShape[axis] = z.number().int().min(1).max(10).optional();
}
const schema = z.object({
  ...axesShape,
  notes: z.string().optional()
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const score = updateScore(
    producerId,
    parsed.data as Parameters<typeof updateScore>[1]
  );
  if (!score) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ score });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const record = getProducerRecord(producerId);
  if (!record) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ score: record.score });
}
