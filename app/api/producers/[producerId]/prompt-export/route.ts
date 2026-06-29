import { NextResponse } from "next/server";
import { z } from "zod";

import { generatePromptExport } from "@/lib/producer-dna";

const bodySchema = z.object({
  fusionWith: z.string().optional(),
  emotionalTarget: z.string().optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ producerId: string }> }
): Promise<NextResponse> {
  const { producerId } = await context.params;
  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const result = generatePromptExport(producerId, parsed.data);
  if (!result) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ result });
}
