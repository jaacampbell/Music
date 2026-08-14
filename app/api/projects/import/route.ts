import { NextResponse } from "next/server";

import { importProjects } from "@/lib/store";
import type { Project } from "@/lib/types";

export async function POST(request: Request): Promise<NextResponse> {
  const payload = (await request.json().catch(() => null)) as { projects?: Project[] } | null;
  if (!payload || !Array.isArray(payload.projects)) {
    return NextResponse.json({ error: "projects must be an array" }, { status: 400 });
  }

  const safeProjects = payload.projects.filter(
    (project): project is Project =>
      Boolean(project && typeof project.id === "string" && typeof project.title === "string")
  );
  const imported = importProjects(safeProjects.slice(0, 100));
  return NextResponse.json({ imported });
}
