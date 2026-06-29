import { NextResponse } from "next/server";
import { z } from "zod";

import { executeMultiAgentCommands } from "@/lib/agent-loop";
import { getProject } from "@/lib/store";

const bodySchema = z.object({
  projectId: z.string().uuid(),
  commands: z.array(z.string().min(1)).min(1).max(20),
  concurrency: z.number().int().min(1).max(10).optional()
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

  const result = await executeMultiAgentCommands(
    parsed.data.projectId,
    parsed.data.commands,
    parsed.data.concurrency ?? 5
  );
  return NextResponse.json({ result });
}
