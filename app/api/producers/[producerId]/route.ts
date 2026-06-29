import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CONFIDENCE_TIERS,
  ERAS,
  GENRES,
  PRODUCER_ROLES
} from "@/lib/producer-dna/taxonomy";
import {
  getProducerRecord,
  updateProducer,
  updateProfile
} from "@/lib/producer-dna/store";

const patchSchema = z.object({
  producer: z
    .object({
      name: z.string().optional(),
      realName: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      publicIdentity: z.string().optional(),
      activeYearsStart: z.number().int().optional(),
      activeYearsEnd: z.number().int().optional(),
      primaryScenes: z.array(z.string()).optional(),
      primaryGenres: z.array(z.enum(GENRES)).optional(),
      primaryRoles: z.array(z.enum(PRODUCER_ROLES)).optional(),
      primaryEras: z.array(z.enum(ERAS)).optional(),
      coreDnaAngle: z.string().optional(),
      researchConfidence: z.enum(CONFIDENCE_TIERS).optional()
    })
    .optional(),
  profile: z
    .object({
      longForm: z.string().optional(),
      analysisConfidence: z.enum(CONFIDENCE_TIERS).optional(),
      sonicDna: z.record(z.string(), z.unknown()).optional(),
      rhythmicDna: z.record(z.string(), z.unknown()).optional(),
      melodicHarmonicDna: z.record(z.string(), z.unknown()).optional(),
      arrangementDna: z.record(z.string(), z.unknown()).optional(),
      mixingDna: z.record(z.string(), z.unknown()).optional(),
      samplingDna: z.record(z.string(), z.unknown()).optional(),
      styleNuanceMap: z.record(z.string(), z.unknown()).optional()
    })
    .optional()
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const record = getProducerRecord(producerId);
  if (!record) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ record });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const payload = await request.json();
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }
  if (parsed.data.producer) {
    const updated = updateProducer(producerId, parsed.data.producer);
    if (!updated) {
      return NextResponse.json(
        { error: "Producer not found" },
        { status: 404 }
      );
    }
  }
  if (parsed.data.profile) {
    const updated = updateProfile(
      producerId,
      parsed.data.profile as Parameters<typeof updateProfile>[1]
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Producer not found" },
        { status: 404 }
      );
    }
  }
  const record = getProducerRecord(producerId);
  return NextResponse.json({ record });
}
