import { NextResponse } from "next/server";
import { z } from "zod";

import { buildExport } from "@/lib/stem-extraction/store";

// Step 8: export the aligned WAV ZIP pack.
const bodySchema = z.object({
  target: z.literal("universal_stem_pack_zip").default("universal_stem_pack_zip")
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
      { error: "Invalid target", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const result = buildExport(projectId, parsed.data.target);
  if (!result) {
    return NextResponse.json(
      { error: "Project not found or stems not ready" },
      { status: 404 }
    );
  }
  return NextResponse.json({ project: result.project, export: result.export });
}
