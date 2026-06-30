import { NextResponse } from "next/server";

import { runSeparation } from "@/lib/stem-extraction/store";

// Steps 3-7: run 4-stem htdemucs_ft separation, verify alignment, detect BPM/key,
// and write the manifest.
export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  const { projectId } = await context.params;
  const project = runSeparation(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}
