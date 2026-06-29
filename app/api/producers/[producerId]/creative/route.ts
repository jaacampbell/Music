import { NextResponse } from "next/server";
import { z } from "zod";

import {
  addCreativeIteration,
  addFusionPath,
  addInspiredDirection,
  addOriginalityWarning,
  addPromptExport,
  getProducerRecord
} from "@/lib/producer-dna/store";

const inspired = z.object({
  kind: z.literal("inspired-direction"),
  title: z.string().min(1),
  description: z.string().min(1),
  ethicsNote: z.string().min(1)
});

const iteration = z.object({
  kind: z.literal("creative-iteration"),
  index: z.number().int().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  twist: z.string().min(1)
});

const warning = z.object({
  kind: z.literal("originality-warning"),
  category: z.enum([
    "melody",
    "drum-pattern",
    "vocal-tag",
    "exact-chain",
    "recognizable-sample",
    "arrangement-habit"
  ]),
  detail: z.string().min(1)
});

const fusion = z.object({
  kind: z.literal("fusion-path"),
  partner: z.string().min(1),
  partnerKind: z.enum(["producer", "genre", "region", "emotional-target"]),
  description: z.string().min(1)
});

const promptExport = z.object({
  kind: z.literal("prompt-export"),
  target: z.enum([
    "beat-making",
    "song-direction",
    "daw-session",
    "stem-generation",
    "mix-reference",
    "artist-coaching"
  ]),
  prompt: z.string().min(1)
});

const schema = z.discriminatedUnion("kind", [
  inspired,
  iteration,
  warning,
  fusion,
  promptExport
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }
  let created: unknown;
  switch (parsed.data.kind) {
    case "inspired-direction": {
      const { kind: _k, ...rest } = parsed.data;
      void _k;
      created = addInspiredDirection(producerId, rest);
      break;
    }
    case "creative-iteration": {
      const { kind: _k, ...rest } = parsed.data;
      void _k;
      created = addCreativeIteration(producerId, rest);
      break;
    }
    case "originality-warning": {
      const { kind: _k, ...rest } = parsed.data;
      void _k;
      created = addOriginalityWarning(producerId, rest);
      break;
    }
    case "fusion-path": {
      const { kind: _k, ...rest } = parsed.data;
      void _k;
      created = addFusionPath(producerId, rest);
      break;
    }
    case "prompt-export": {
      const { kind: _k, ...rest } = parsed.data;
      void _k;
      created = addPromptExport(producerId, rest);
      break;
    }
  }
  if (!created) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ entry: created, kind: parsed.data.kind }, { status: 201 });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const record = getProducerRecord(producerId);
  if (!record) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({
    inspiredDirections: record.inspiredDirections,
    creativeIterations: record.creativeIterations,
    originalityWarnings: record.originalityWarnings,
    fusionPaths: record.fusionPaths,
    promptExports: record.promptExports
  });
}
