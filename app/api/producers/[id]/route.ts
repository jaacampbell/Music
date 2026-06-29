import { NextResponse } from "next/server";

import { getProducer } from "@/lib/producer-store";
import type { ProducerDetailResponse } from "@/lib/producer-types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ProducerDetailResponse | { error: string }>> {
  const { id } = await params;
  const producer = getProducer(id);
  if (!producer) {
    return NextResponse.json({ error: "Producer not found" }, { status: 404 });
  }
  return NextResponse.json({ producer });
}
