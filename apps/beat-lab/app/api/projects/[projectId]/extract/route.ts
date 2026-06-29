import { NextResponse } from "next/server";
import { z } from "zod";

import { runExtraction } from "@/lib/store";

const bodySchema = z.object({
  mode: z.union([z.literal(2), z.literal(4), z.literal(6), z.literal(10)]).default(4)
});

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  const { projectId } = await context.params;
  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid mode", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const job = runExtraction(projectId, parsed.data.mode);
  if (!job) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ job });
}
