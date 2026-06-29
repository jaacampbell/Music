import { NextResponse } from "next/server";

import { getStats } from "@/lib/producer-dna/store";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ stats: getStats() });
}
