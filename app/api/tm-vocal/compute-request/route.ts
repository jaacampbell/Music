import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  accessToken: z.string().min(20),
  requestId: z.string().uuid(),
  status: z.enum(["completed", "failed", "cancelled"]),
  detail: z.string().max(500).nullable().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid compute request update." }, { status: 400 });

  const verify = await fetch(url + "/auth/v1/user", {
    headers: { apikey: key, Authorization: "Bearer " + parsed.data.accessToken },
    cache: "no-store",
  });
  if (!verify.ok) return NextResponse.json({ error: "Session could not be verified." }, { status: 401 });
  const user = await verify.json() as { id?: string };
  if (!user.id) return NextResponse.json({ error: "Verified session did not include a user." }, { status: 401 });

  const params = new URLSearchParams({ request_id: "eq." + parsed.data.requestId, user_id: "eq." + user.id });
  const response = await fetch(url + "/rest/v1/music_compute_requests?" + params.toString(), {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: "Bearer " + parsed.data.accessToken,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      status: parsed.data.status,
      last_error: parsed.data.status === "failed" ? parsed.data.detail ?? "Worker correction failed." : null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) return NextResponse.json({ error: "Could not update compute request." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
