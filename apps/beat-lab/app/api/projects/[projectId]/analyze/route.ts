import { NextResponse } from "next/server";

import { runAnalysis } from "@/lib/store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  const { projectId } = await context.params;
  const job = runAnalysis(projectId);
  if (!job) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ job });
}
