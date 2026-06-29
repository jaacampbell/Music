import { NextResponse } from "next/server";
import { z } from "zod";

import { runExport } from "@/lib/store";

const bodySchema = z.object({
  type: z
    .union([
      z.literal("wav-zip"),
      z.literal("reaper-rpp"),
      z.literal("ableton-folder"),
      z.literal("logic-folder")
    ])
    .default("wav-zip")
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
      { error: "Invalid export type", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const job = runExport(projectId, parsed.data.type);
  if (!job) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ job });
}
