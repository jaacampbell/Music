import { NextResponse } from "next/server";
import { z } from "zod";

import { GEAR_CLAIM_STATUS } from "@/lib/producer-dna/taxonomy";
import { addGearClaim, getProducerRecord } from "@/lib/producer-dna/store";

const schema = z.object({
  category: z.enum([
    "daw",
    "sampler",
    "synth",
    "drum-machine",
    "plugin",
    "console",
    "studio",
    "recording-method",
    "outboard"
  ]),
  item: z.string().min(1),
  status: z.enum(GEAR_CLAIM_STATUS).default("reported"),
  notes: z.string().optional(),
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
  const claim = addGearClaim(producerId, parsed.data);
  if (!claim) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ claim }, { status: 201 });
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
  return NextResponse.json({ gearClaims: record.gearClaims });
}
