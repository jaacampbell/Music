import { NextRequest, NextResponse } from "next/server";

import { getBatchStats, listProducers } from "@/lib/producer-store";
import type { ProducerListResponse, ProducerSearchParams } from "@/lib/producer-types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse<ProducerListResponse | { error: string }>> {
  const { searchParams } = request.nextUrl;
  const params: ProducerSearchParams = {};

  const q = searchParams.get("q");
  if (q) params.q = q;

  const genre = searchParams.get("genre");
  if (genre) params.genre = genre as ProducerSearchParams["genre"];

  const era = searchParams.get("era");
  if (era) params.era = era as ProducerSearchParams["era"];

  const region = searchParams.get("region");
  if (region) params.region = region;

  const batchId = searchParams.get("batchId");
  if (batchId) params.batchId = batchId;

  const role = searchParams.get("role");
  if (role) params.role = role as ProducerSearchParams["role"];

  const producers = listProducers(params);
  const batchStats = getBatchStats();

  return NextResponse.json({ producers, total: producers.length, batchStats });
}
