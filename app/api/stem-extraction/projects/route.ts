import { NextResponse } from "next/server";
import { z } from "zod";

import { createStemProject, listStemProjects } from "@/lib/stem-extraction/store";

// Step 1: "upload audio". In this simulated slice we accept a filename + duration
// instead of a binary; a real endpoint would accept WAV/MP3/FLAC/AIFF/M4A/MP4.
const createSchema = z.object({
  filename: z.string().min(1),
  durationSec: z.number().positive().max(3600).default(174)
});

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ projects: listStemProjects() });
}

export async function POST(request: Request): Promise<NextResponse> {
  const raw = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const project = createStemProject(parsed.data.filename, parsed.data.durationSec);
  return NextResponse.json({ project }, { status: 201 });
}
