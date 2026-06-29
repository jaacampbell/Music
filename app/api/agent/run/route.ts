import { NextResponse } from "next/server";
import { z } from "zod";

import { executeAgentCommand } from "@/lib/agent-loop";
import { getProject } from "@/lib/store";

const bodySchema = z.object({
  projectId: z.string().uuid(),
  command: z.string().min(1)
});

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json();
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const project = getProject(parsed.data.projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const result = executeAgentCommand(parsed.data.projectId, parsed.data.command);
  return NextResponse.json({ result });
}
