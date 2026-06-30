import { NextResponse } from "next/server";

import { getStemProject } from "@/lib/stem-extraction/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  const { projectId } = await context.params;
  const project = getStemProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}
