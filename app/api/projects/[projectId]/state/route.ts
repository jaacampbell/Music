import { NextResponse } from "next/server";
import { z } from "zod";

import { saveProjectState } from "@/lib/store";

const bodySchema = z.object({
  brief: z.string().optional(),
  mixNotes: z.string().optional(),
  revisionPrompt: z.string().optional(),
  exportPlan: z.string().optional()
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  const { projectId } = await context.params;
  const payload = await request.json();
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const project = saveProjectState(projectId, parsed.data);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}
