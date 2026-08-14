"use client";

import type { CloudSession, CloudUser } from "@/lib/persistence/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";
const SESSION_KEY = "music-os-supabase-session-v1";

interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: CloudUser;
  error?: string;
  error_description?: string;
  message?: string;
}

export function isCloudConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export function getStoredSession(): CloudSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CloudSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function storeSession(response: AuthResponse): CloudSession {
  if (!response.access_token || !response.refresh_token || !response.user) {
    throw new Error("Supabase did not return a complete session.");
  }
  const session: CloudSession = {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    expires_at: Date.now() + Math.max((response.expires_in ?? 3600) - 30, 30) * 1000,
    user: response.user
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function authHeaders(accessToken?: string): HeadersInit {
  return {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };
}

async function parseError(response: Response): Promise<Error> {
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const message =
    (typeof payload.message === "string" && payload.message) ||
    (typeof payload.error_description === "string" && payload.error_description) ||
    (typeof payload.error === "string" && payload.error) ||
    `Request failed (${response.status})`;
  return new Error(message);
}

export async function signIn(email: string, password: string): Promise<CloudSession> {
  if (!isCloudConfigured()) throw new Error("Supabase environment variables are not configured.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) throw await parseError(response);
  return storeSession((await response.json()) as AuthResponse);
}

export async function signUp(email: string, password: string): Promise<{ session: CloudSession | null; message: string }> {
  if (!isCloudConfigured()) throw new Error("Supabase environment variables are not configured.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) throw await parseError(response);
  const payload = (await response.json()) as AuthResponse;
  if (payload.access_token && payload.refresh_token && payload.user) {
    return { session: storeSession(payload), message: "Account created and signed in." };
  }
  return { session: null, message: "Account created. Check your email to confirm the account, then sign in." };
}

export async function refreshSession(session: CloudSession): Promise<CloudSession> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  if (!response.ok) {
    clearStoredSession();
    throw await parseError(response);
  }
  return storeSession((await response.json()) as AuthResponse);
}

export async function getValidSession(): Promise<CloudSession | null> {
  const session = getStoredSession();
  if (!session) return null;
  if (session.expires_at > Date.now()) return session;
  return refreshSession(session);
}

export function clearStoredSession(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
}

export async function signOut(): Promise<void> {
  const session = await getValidSession().catch(() => null);
  if (session) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: authHeaders(session.access_token)
    }).catch(() => undefined);
  }
  clearStoredSession();
}

export async function getCurrentUser(): Promise<CloudUser | null> {
  const session = await getValidSession();
  if (!session) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: authHeaders(session.access_token)
  });
  if (!response.ok) {
    if (response.status === 401) clearStoredSession();
    return null;
  }
  return (await response.json()) as CloudUser;
}

interface RestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: string;
  body?: unknown;
  prefer?: string;
}

export async function supabaseRest<T>(table: string, options: RestOptions = {}): Promise<T> {
  if (!isCloudConfigured()) throw new Error("Cloud persistence is not configured yet.");
  const session = await getValidSession();
  if (!session) throw new Error("Sign in to access your private music library.");
  const query = options.query ? `?${options.query}` : "";
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: options.method ?? "GET",
    headers: {
      ...authHeaders(session.access_token),
      Prefer: options.prefer ?? (options.method === "POST" || options.method === "PATCH" ? "return=representation" : "")
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function safeStorageName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return cleaned || "file";
}

export async function uploadPrivateFile(
  projectId: string,
  file: File,
  folder = "assets"
): Promise<string> {
  if (!isCloudConfigured()) throw new Error("Cloud storage is not configured yet.");
  const session = await getValidSession();
  if (!session) throw new Error("Sign in before uploading files.");
  const path = `${session.user.id}/${projectId}/${folder}/${Date.now()}-${crypto.randomUUID()}-${safeStorageName(file.name)}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/music-assets/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false"
    },
    body: file
  });
  if (!response.ok) throw await parseError(response);
  return path;
}

export async function downloadPrivateFile(path: string): Promise<Blob> {
  const session = await getValidSession();
  if (!session) throw new Error("Sign in to load this private file.");
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/music-assets/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session.access_token}`
    }
  });
  if (!response.ok) throw await parseError(response);
  return response.blob();
}

export async function deletePrivateFile(path: string): Promise<void> {
  const session = await getValidSession();
  if (!session) throw new Error("Sign in to manage this private file.");
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/music-assets/${path}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session.access_token}`
    }
  });
  if (!response.ok) throw await parseError(response);
}
