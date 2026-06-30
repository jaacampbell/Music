import { NextResponse } from "next/server";

import { getBatch } from "@/lib/parallel-agents/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ batchId: string }> }
): Promise<NextResponse> {
  const { batchId } = await context.params;
  const batch = getBatch(batchId);

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json({ batch });
}
