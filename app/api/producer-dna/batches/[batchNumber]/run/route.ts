import { NextResponse } from "next/server";
import { z } from "zod";

import { runCatalogueBatchResearch } from "@/lib/parallel-agents/batch-runner";
import { getBatch, getProducersByBatch } from "@/lib/producer-dna/store";

const bodySchema = z.object({
  concurrency: z.number().int().min(1).max(10).optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ batchNumber: string }> }
): Promise<NextResponse> {
  const { batchNumber } = await context.params;
  const batch = getBatch(batchNumber);
  if (!batch) {
    return NextResponse.json({ error: "Catalogue batch not found" }, { status: 404 });
  }

  const producers = getProducersByBatch(batchNumber);
  if (producers.length === 0) {
    return NextResponse.json(
      { error: "Batch not seeded yet", batchNumber },
      { status: 400 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const result = await runCatalogueBatchResearch(batchNumber, {
    concurrency: parsed.data.concurrency
  });

  return NextResponse.json({ result }, { status: 201 });
}
