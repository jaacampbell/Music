import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CONFIDENCE_TIERS,
  SOURCE_TYPES
} from "@/lib/producer-dna/taxonomy";
import { addSource, getProducerRecord } from "@/lib/producer-dna/store";

const schema = z.object({
  url: z.string().url().optional(),
  sourceType: z.enum(SOURCE_TYPES),
  dateAccessed: z.string().optional(),
  reliabilityTier: z.enum(CONFIDENCE_TIERS).default("C"),
  claimSupported: z.string().min(1),
  quote: z.string().optional(),
  citationStatus: z.enum(["verified", "pending", "rejected"]).default("pending")
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
  const source = addSource(producerId, {
    ...parsed.data,
    dateAccessed: parsed.data.dateAccessed ?? new Date().toISOString()
  });
  if (!source) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ source }, { status: 201 });
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
  return NextResponse.json({ sources: record.sources });
}
