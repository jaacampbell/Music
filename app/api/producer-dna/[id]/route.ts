import { NextResponse } from "next/server";

import { getProducerProfile } from "@/lib/producer-dna/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  const profile = getProducerProfile(id);
  if (!profile) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ profile });
}
