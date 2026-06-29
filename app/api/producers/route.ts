import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CONFIDENCE_TIERS,
  ERAS,
  GENRES,
  PRODUCER_ROLES,
  SCORING_AXES
} from "@/lib/producer-dna/taxonomy";
import { createProducer, listProducers } from "@/lib/producer-dna/store";

const filterSchema = z.object({
  q: z.string().optional(),
  era: z.enum(ERAS).optional(),
  genre: z.enum(GENRES).optional(),
  role: z.enum(PRODUCER_ROLES).optional(),
  region: z.string().optional(),
  confidence: z.enum(CONFIDENCE_TIERS).optional(),
  minScoreAxis: z.enum(SCORING_AXES).optional(),
  minScoreValue: z.coerce.number().min(0).max(10).optional()
});

const createSchema = z.object({
  name: z.string().min(1),
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
  officialLinks: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .optional(),
  coreDnaAngle: z.string().min(1),
  researchConfidence: z.enum(CONFIDENCE_TIERS).optional()
});

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const parsed = filterSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid filters", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const producers = listProducers(parsed.data);
  return NextResponse.json({ producers });
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const producer = createProducer(parsed.data);
  return NextResponse.json({ producer }, { status: 201 });
}
