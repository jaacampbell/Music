import { NextResponse } from "next/server";

import { applyLiveAudioResult, type LiveAudioResultInput } from "@/lib/store";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  const { projectId } = await context.params;
  const payload = (await request.json().catch(() => null)) as LiveAudioResultInput | null;

  if (
    !payload ||
    !payload.source ||
    !payload.analysis ||
    !Array.isArray(payload.stems) ||
    !["core", "deep"].includes(payload.mode)
  ) {
    return NextResponse.json({ error: "Invalid live audio payload" }, { status: 400 });
  }

  const project = applyLiveAudioResult(projectId, payload);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}
