import { getSessionAccessToken } from "@/lib/persistence/supabase-rest";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function encodedStoragePath(path: string): string {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

export async function createPrivateSignedUrl(path: string, expiresIn = 60 * 60): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Supabase is not configured.");
  const accessToken = await getSessionAccessToken();
  if (!accessToken) throw new Error("Sign in to load permanent Stem Director results.");
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/music-assets/${encodedStoragePath(path)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expiresIn })
  });
  const body = await response.json().catch(() => ({})) as { signedURL?: string; signedUrl?: string; error?: string; message?: string };
  if (!response.ok) throw new Error(body.error ?? body.message ?? `Could not sign private result (${response.status}).`);
  const signed = body.signedUrl ?? body.signedURL;
  if (!signed) throw new Error("Supabase did not return a signed result URL.");
  return /^https?:\/\//i.test(signed) ? signed : `${SUPABASE_URL}${signed.startsWith("/") ? "" : "/"}${signed}`;
}
