import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ accessToken: z.string().min(20) });
const cookieName = "music-os-auth";

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const config = supabaseConfig();
  if (!config) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid session payload." }, { status: 400 });

  const verify = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${parsed.data.accessToken}`
    },
    cache: "no-store"
  });
  if (!verify.ok) return NextResponse.json({ error: "Session could not be verified." }, { status: 401 });

  const user = (await verify.json()) as { id?: string };
  if (!user.id) return NextResponse.json({ error: "Verified session did not include a user." }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
