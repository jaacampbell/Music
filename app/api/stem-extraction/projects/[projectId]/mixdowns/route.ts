import { NextResponse } from "next/server";
import { z } from "zod";

import { buildExport } from "@/lib/stem-extraction/store";

// Step 10: karaoke / acapella convenience mixdowns. These re-mix from the existing
// stems (karaoke = everything except vocals; acapella = vocals only) without
// re-running separation.
const bodySchema = z.object({
  kind: z.union([z.literal("karaoke"), z.literal("acapella")])
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
      { error: "Invalid kind", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const target = parsed.data.kind === "karaoke" ? "karaoke_wav" : "acapella_wav";
  const result = buildExport(projectId, target);
  if (!result) {
    return NextResponse.json(
      { error: "Project not found or stems not ready" },
      { status: 404 }
    );
  }
  return NextResponse.json({ project: result.project, export: result.export });
}
