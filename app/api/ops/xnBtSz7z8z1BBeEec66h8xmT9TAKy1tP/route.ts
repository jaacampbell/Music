import { NextResponse } from "next/server";

const RUNPOD_API = "https://rest.runpod.io/v1";
const IMAGE = "ghcr.io/jaacampbell/music-separator:latest";

async function runpod(path: string, method: "GET" | "POST", body?: Record<string, unknown>) {
  const apiKey = process.env.RUNPOD_API_KEY?.trim();
  if (!apiKey) throw new Error("RUNPOD_API_KEY is not configured.");
  const response = await fetch(`${RUNPOD_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "TM-Music-Studio-Maintenance/1.0"
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof data.error === "string"
      ? data.error
      : typeof data.message === "string"
        ? data.message
        : `RunPod HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function GET(): Promise<NextResponse> {
  const podId = process.env.RUNPOD_STEM_POD_ID?.trim();
  const gateway = process.env.SEPARATOR_GATEWAY_SECRET?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  const hf = process.env.HF_TOKEN?.trim();

  if (!podId || !gateway) {
    return NextResponse.json({ ok: false, error: "Required production worker configuration is missing." }, { status: 503 });
  }

  try {
    const before = await runpod(`/pods/${podId}`, "GET");
    const env: Record<string, string> = {
      SEPARATOR_GATEWAY_SECRET: gateway,
      SUPABASE_URL: "https://jgnsrjjgeodqruafafav.supabase.co",
      CORS_ORIGINS: "https://tm-music-studio.netlify.app",
      DEMUCS_DEVICE: "cuda",
      SAM_AUDIO_DEVICE: "cuda",
      SAM_AUDIO_MODEL: "facebook/sam-audio-small",
      MAX_DEEP_TARGETS: "60",
      STEM_AGENT_HIERARCHICAL: "true",
      SEPARATOR_RESUME_ON_START: "true",
      SEPARATOR_MAX_RESTART_RESUMES: "2",
      SEPARATOR_CLOUD_SYNC_INTERVAL_SECONDS: "2",
      STEM_AGENT_USE_LLM: openai ? "true" : "false",
      STEM_AGENT_MODEL: "gpt-5-mini"
    };
    if (openai) env.OPENAI_API_KEY = openai;
    if (hf) {
      env.HF_TOKEN = hf;
      env.HUGGING_FACE_HUB_TOKEN = hf;
    }

    const updated = await runpod(`/pods/${podId}/update`, "POST", {
      name: "music-os-stem-director",
      imageName: IMAGE,
      containerDiskInGb: 60,
      volumeInGb: 80,
      volumeMountPath: "/workspace",
      ports: ["8000/http"],
      env
    });

    return NextResponse.json({
      ok: true,
      podId,
      action: "updated-existing-pod",
      image: IMAGE,
      deepTokenConfigured: Boolean(hf),
      before: {
        desiredStatus: before.desiredStatus ?? before.status ?? null,
        imageName: before.imageName ?? null
      },
      after: {
        desiredStatus: updated.desiredStatus ?? updated.status ?? null,
        imageName: updated.imageName ?? IMAGE
      }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "RunPod refresh failed."
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
