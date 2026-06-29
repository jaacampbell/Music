import { NextResponse } from "next/server";

import { getTaxonomy } from "@/lib/producer-dna/store";
import { FULL_PROFILE_PIPELINE } from "@/lib/producer-dna/taxonomy";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    taxonomy: getTaxonomy(),
    fullProfilePipeline: FULL_PROFILE_PIPELINE
  });
}
