import { NextResponse } from "next/server";
import { z } from "zod";

import { createProject, listProjects } from "@/lib/store";

const createSchema = z.object({
  title: z.string().min(1),
  brief: z.string().min(1)
});

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const project = createProject(parsed.data.title, parsed.data.brief);
  return NextResponse.json({ project }, { status: 201 });
}
