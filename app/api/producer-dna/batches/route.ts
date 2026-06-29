import { NextResponse } from "next/server";

import { listBatches } from "@/lib/producer-dna/store";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ batches: listBatches() });
}
