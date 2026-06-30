import { NextResponse } from "next/server";
import { z } from "zod";

import type { ProfileGenerationStep } from "@/lib/producer-dna/confidence";
import { PROFILE_GENERATION_ORDER } from "@/lib/producer-dna/confidence";
import { runParallelProducerResearch } from "@/lib/parallel-agents/producer-dna-pipeline";
import { getBatch, getParallelStats, listBatches, saveBatch } from "@/lib/parallel-agents/store";
import { getProducer } from "@/lib/producer-dna/store";

const stepSchema = z.enum(PROFILE_GENERATION_ORDER as unknown as [string, ...string[]]);

const bodySchema = z.object({
  producerIds: z.array(z.string().regex(/^PDNA-\d{6}$/)).min(1).max(105),
  concurrency: z.number().int().min(1).max(10).optional(),
  steps: z.array(stepSchema).optional()
});

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");

  if (batchId) {
    const batch = getBatch(batchId);
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }
    return NextResponse.json({ batch });
  }

  return NextResponse.json({
    batches: listBatches(),
    stats: getParallelStats()
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json();
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const missing = parsed.data.producerIds.filter((id) => !getProducer(id));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Unknown producer IDs", details: missing },
      { status: 400 }
    );
  }

  const batch = await runParallelProducerResearch(parsed.data.producerIds, {
    concurrency: parsed.data.concurrency,
    steps: parsed.data.steps as ProfileGenerationStep[] | undefined
  });
  saveBatch(batch);

  return NextResponse.json({ batch }, { status: 201 });
}
