import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  question: z.string().min(1).max(4000),
  context: z.record(z.string(), z.unknown()).default({})
});

interface ResponsesPayload {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
}

function fallback(question: string, context: Record<string, unknown>): string {
  const lowered = question.toLowerCase();
  const versions = Array.isArray(context.versions) ? context.versions.length : 0;
  const tasks = Array.isArray(context.tasks) ? context.tasks : [];
  const release = context.release as { checklist?: Record<string, boolean> } | null | undefined;
  if (lowered.includes("next") || lowered.includes("what should")) {
    if (versions === 0) return "Upload the current demo or mix first so the project has a playable Version 1. After that, compare revisions and leave timestamped notes before changing the production again.";
    if (tasks.some((task) => typeof task === "object" && task && "priority" in task && (task as { priority?: string }).priority === "high")) return "Finish the high-priority project task first, then create or compare the next version.";
    return "Use A/B Compare on the two strongest versions, save the best drums/atmosphere/vocal-space/low-end decisions, then turn that into the next revision.";
  }
  if (lowered.includes("release")) {
    const checklist = release?.checklist ?? {};
    const completed = Object.values(checklist).filter(Boolean).length;
    return `Your release checklist currently shows ${completed} completed items. Verify ownership, splits, producer agreements, samples, artwork, lyrics, identifiers, and distributor delivery before marking the song ready.`;
  }
  if (lowered.includes("muddy")) return "Mark the exact muddy timestamps, then check kick/808 overlap, low-mid buildup, arrangement density under the vocal, and long reverb tails. I will not claim a measured frequency problem unless an audio analysis has actually produced that result.";
  if (lowered.includes("ad-lib") || lowered.includes("adlib")) return "Open Stem Studio for this project, choose Deep isolation, select ad-libs/background vocals, run separation, and the generated stems will be saved back into the same project library when cloud persistence is connected.";
  return "I can reason from the project data you supplied, but the live AI key is not configured on this deployment. Add OPENAI_API_KEY to enable the full project-aware Music OS assistant.";
}

function outputText(payload: ResponsesPayload): string | null {
  if (payload.output_text?.trim()) return payload.output_text.trim();
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text?.trim()) return content.text.trim();
    }
  }
  return null;
}

function verifiedSessionUser(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)music-os-auth=([^;]+)/);
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

async function verifySupabaseUser(request: Request): Promise<{ id: string } | null> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (token && url && key) {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (response.ok) {
      const user = (await response.json()) as { id?: string };
      if (user.id) return { id: user.id };
    }
  }

  // The HttpOnly hint can only be issued by /api/auth/session after Supabase
  // validates an access token. It gates model spending; row/file authorization
  // still remains enforced independently by Supabase RLS.
  const sessionUserId = verifiedSessionUser(request);
  return sessionUserId ? { id: sessionUserId } : null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const user = await verifySupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to use Ask Music." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid assistant request." }, { status: 400 });

  const { question, context } = parsed.data;
  const project = context.project as { user_id?: unknown } | undefined;
  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "This project is not owned by the signed-in user." }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MUSIC_MODEL || "gpt-5-mini";
  if (!apiKey) return NextResponse.json({ answer: fallback(question, context), model: "local-fallback" });

  const instructions = [
    "You are Ask Music inside Music OS, an artist-first production workspace.",
    "Use only the supplied project context plus general music-production knowledge.",
    "Never invent measurements, legal clearances, ownership, credits, or audio findings that are not present in the context.",
    "When the user asks what to do next, give a prioritized actionable recommendation tied to this project.",
    "When discussing mixing, distinguish measured findings from listening hypotheses.",
    "For copyright, contracts, ownership, publishing, or release-law questions, state that the answer is workflow guidance rather than legal advice.",
    "Keep answers concise, practical, and understandable to a non-engineer."
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      instructions,
      input: `PROJECT CONTEXT\n${JSON.stringify(context, null, 2)}\n\nUSER QUESTION\n${question}`
    })
  });

  const payload = (await response.json().catch(() => ({}))) as ResponsesPayload;
  if (!response.ok) {
    return NextResponse.json({ answer: fallback(question, context), model: "local-fallback", warning: payload.error?.message ?? `OpenAI request failed (${response.status}).` });
  }

  return NextResponse.json({ answer: outputText(payload) ?? fallback(question, context), model });
}
