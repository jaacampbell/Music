import { NextResponse } from "next/server";

import { getPromptCacheStats } from "@/lib/prompt-cache";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ cache: getPromptCacheStats() });
}
