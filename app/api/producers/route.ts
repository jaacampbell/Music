import { NextResponse } from "next/server";

import { averageScore, searchProducers } from "@/lib/producer-dna/store";
import type { EraTag, RoleTag } from "@/lib/producer-dna/types";

type SortKey = "id" | "name" | "innovation" | "influence" | "originality" | "overall";

const SORT_KEYS: SortKey[] = [
  "id",
  "name",
  "innovation",
  "influence",
  "originality",
  "overall"
];

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const params = url.searchParams;

  const sortParam = params.get("sort");
  const sort = SORT_KEYS.includes(sortParam as SortKey)
    ? (sortParam as SortKey)
    : undefined;

  const producers = searchProducers({
    q: params.get("q") ?? undefined,
    genre: params.get("genre") ?? undefined,
    era: (params.get("era") as EraTag | null) ?? undefined,
    role: (params.get("role") as RoleTag | null) ?? undefined,
    region: params.get("region") ?? undefined,
    batch: params.get("batch") ?? undefined,
    sort
  });

  return NextResponse.json({
    count: producers.length,
    producers: producers.map((capsule) => ({
      ...capsule,
      overallScore: averageScore(capsule.scores)
    }))
  });
}
