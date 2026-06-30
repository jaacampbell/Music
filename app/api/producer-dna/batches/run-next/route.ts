import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getBatchingQueue,
  runContinuousBatching
} from "@/lib/parallel-agents/batch-runner";

const bodySchema = z.object({
  batchNumbers: z.array(z.string()).optional(),
  concurrency: z.number().int().min(1).max(10).optional(),
  count: z.number().int().min(1).max(5).optional()
});

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(getBatchingQueue());
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  let batchNumbers = parsed.data.batchNumbers;
  if (!batchNumbers) {
    const { queue } = getBatchingQueue();
    const pending = queue.filter(
      (b) => b.producerCount > 0 && b.status !== "researched"
    );
    const count = parsed.data.count ?? 1;
    batchNumbers = pending.slice(0, count).map((b) => b.batchNumber);
  }

  if (batchNumbers.length === 0) {
    return NextResponse.json({ error: "No batches queued for research" }, { status: 400 });
  }

  const result = await runContinuousBatching(batchNumbers, {
    concurrency: parsed.data.concurrency
  });

  return NextResponse.json({ result }, { status: 201 });
}
