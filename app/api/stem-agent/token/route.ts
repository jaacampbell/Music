import { createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  accessToken: z.string().min(20),
  projectId: z.string().uuid().nullable().optional()
});

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

function canonicalJson(payload: Record<string, unknown>): string {
  return JSON.stringify(Object.fromEntries(Object.entries(payload).sort(([a], [b]) => a.localeCompare(b))));
}

function base64url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function signWorkerToken(secret: string, userId: string, projectId?: string | null): string {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 6 * 60 * 60,
    nonce: randomBytes(8).toString("hex"),
    projectId: projectId ?? null,
    scope: "worker",
    sub: userId
  };
  const encoded = base64url(canonicalJson(payload));
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

async function verifyProjectOwnership(
  config: { url: string; key: string },
  accessToken: string,
  userId: string,
  projectId: string
): Promise<boolean> {
  const query = new URLSearchParams({
    select: "id",
    id: `eq.${projectId}`,
    user_id: `eq.${userId}`,
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/music_projects?${query.toString()}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });
  if (!response.ok) return false;
  const rows = (await response.json().catch(() => [])) as Array<{ id?: string }>;
  return rows.some((row) => row.id === projectId);
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.SEPARATOR_GATEWAY_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Stem Agent gateway is not configured." }, { status: 503 });

  const config = supabaseConfig();
  if (!config) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "A valid signed-in session is required." }, { status: 400 });

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

  if (parsed.data.projectId) {
    const ownsProject = await verifyProjectOwnership(config, parsed.data.accessToken, user.id, parsed.data.projectId);
    if (!ownsProject) {
      return NextResponse.json({ error: "The selected Music OS project does not belong to this account." }, { status: 403 });
    }
  }

  return NextResponse.json({
    token: signWorkerToken(secret, user.id, parsed.data.projectId),
    expiresIn: 6 * 60 * 60
  });
}
