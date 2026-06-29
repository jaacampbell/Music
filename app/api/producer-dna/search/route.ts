import { NextResponse } from "next/server";
import { z } from "zod";

import { searchProducers } from "@/lib/producer-dna/store";

const bodySchema = z.object({
  query: z.string().optional(),
  batchId: z.string().optional(),
  region: z.string().optional(),
  genre: z.string().optional(),
  era: z.string().optional(),
  profileStatus: z.enum(["capsule", "draft", "reviewed", "published"]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional()
});

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json();
  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { results, total } = searchProducers(parsed.data);
  return NextResponse.json({ results, total });
}
