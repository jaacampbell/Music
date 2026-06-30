import { NextResponse } from "next/server";
import { z } from "zod";

import { searchProducers } from "@/lib/producer-dna/store";

const searchSchema = z.object({
  query: z.string().optional(),
  batchId: z.string().optional(),
  region: z.string().optional(),
  genre: z.string().optional(),
  layer: z.enum(["verified", "analytical", "creative", "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = searchSchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    batchId: searchParams.get("batchId") ?? undefined,
    region: searchParams.get("region") ?? undefined,
    genre: searchParams.get("genre") ?? undefined,
    layer: searchParams.get("layer") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const results = searchProducers(parsed.data);
  return NextResponse.json({ results, count: results.length });
}
