import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getStoreStats,
  listProducerDnaRecords,
  searchProducers
} from "@/lib/producer-dna/store";

const searchSchema = z.object({
  query: z.string().optional(),
  batchId: z.string().optional(),
  region: z.string().optional(),
  genre: z.string().optional(),
  profileStatus: z.enum(["capsule", "draft", "reviewed", "published"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse({
    query: url.searchParams.get("query") ?? undefined,
    batchId: url.searchParams.get("batchId") ?? undefined,
    region: url.searchParams.get("region") ?? undefined,
    genre: url.searchParams.get("genre") ?? undefined,
    profileStatus: url.searchParams.get("profileStatus") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const hasFilters = Object.values(parsed.data).some((v) => v !== undefined);

  if (hasFilters) {
    const { results, total } = searchProducers(parsed.data);
    return NextResponse.json({ results, total, stats: getStoreStats() });
  }

  const records = listProducerDnaRecords();
  return NextResponse.json({
    producers: records.map((r) => ({
      producer: r.producer,
      capsule: r.capsule,
      scores: r.scores,
      profileStatus: r.profile?.profileStatus ?? "capsule"
    })),
    total: records.length,
    stats: getStoreStats()
  });
}
