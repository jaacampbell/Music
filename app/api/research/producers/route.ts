import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getProducerDnaResearchSummary,
  listProducerDnaRecords,
  producerDnaResearchMeta
} from "@/lib/producer-dna/research-base";
import type { ProducerDnaQuery } from "@/lib/producer-dna/types";

const tierSchema = z.enum(["A", "B", "C", "D", "E", "Unknown"]);
const scopeSchema = z.enum(["all", "verified", "analysis", "creative"]);

const parseCsv = (value: string | null): string[] =>
  value
    ? value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

const buildQuery = (url: URL): ProducerDnaQuery => {
  const limitValue = Number(url.searchParams.get("limit") ?? 25);
  const limit = Number.isFinite(limitValue) ? limitValue : 25;
  const scope = scopeSchema.safeParse(url.searchParams.get("scope") ?? "all");
  const tiers = parseCsv(url.searchParams.get("tiers"))
    .map((tier) => tierSchema.safeParse(tier))
    .filter((result): result is z.SafeParseSuccess<z.infer<typeof tierSchema>> => result.success)
    .map((result) => result.data);

  return {
    q: url.searchParams.get("q") ?? undefined,
    searchScope: scope.success ? scope.data : "all",
    genres: parseCsv(url.searchParams.get("genres")),
    scenes: parseCsv(url.searchParams.get("scenes")),
    producerRoles: parseCsv(url.searchParams.get("roles")),
    eras: parseCsv(url.searchParams.get("eras")),
    regions: parseCsv(url.searchParams.get("regions")),
    confidenceTiers: tiers.length > 0 ? tiers : undefined,
    limit
  };
};

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const query = buildQuery(url);
  const rows = listProducerDnaRecords(query);
  const summary = getProducerDnaResearchSummary();

  return NextResponse.json({
    query,
    count: rows.length,
    rows,
    summary,
    metadata: producerDnaResearchMeta
  });
}
