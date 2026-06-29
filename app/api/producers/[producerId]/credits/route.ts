import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CONFIDENCE_TIERS,
  CREDIT_ROLES
} from "@/lib/producer-dna/taxonomy";
import { addCredit, getProducerRecord } from "@/lib/producer-dna/store";

const schema = z.object({
  workId: z.string().optional(),
  workTitle: z.string().optional(),
  primaryArtist: z.string().optional(),
  role: z.enum(CREDIT_ROLES),
  notes: z.string().optional(),
  researchConfidence: z.enum(CONFIDENCE_TIERS).default("E"),
  sourceIds: z.array(z.string()).default([])
});

export async function POST(
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
  const credit = addCredit(producerId, parsed.data);
  if (!credit) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ credit }, { status: 201 });
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
  return NextResponse.json({ credits: record.credits });
}
