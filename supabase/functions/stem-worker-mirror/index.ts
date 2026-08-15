import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();
const WORKER_ID = /^[a-f0-9]{12}$/;
const NODE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["queued", "running", "cancelling", "completed", "failed", "cancelled"]);
const ACTIVE = new Set(["queued", "running", "cancelling"]);
const LEASE_SECONDS = 60;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2 !== 0) throw new Error("invalid hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const modern = Deno.env.get("SUPABASE_SECRET_KEYS");
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const key = legacy || (modern ? JSON.parse(modern)["default"] : undefined);
  if (!url || !key) throw new Error("Supabase admin environment is unavailable");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function verifyHmac(payloadText: string, signatureHex: string, derivedKeyHex: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToBytes(derivedKeyHex),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify("HMAC", key, hexToBytes(signatureHex), encoder.encode(payloadText));
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  let admin;
  try {
    admin = adminClient();
  } catch {
    return json({ error: "server configuration unavailable" }, 503);
  }

  const { data: config } = await admin
    .from("music_worker_config")
    .select("value_hash")
    .eq("key", "separator_gateway_hmac_key")
    .maybeSingle();

  if (req.method === "GET") {
    return json({
      status: "ok",
      service: "stem-worker-mirror",
      auth: "derived-hmac-sha256",
      configReady: Boolean(config?.value_hash),
      orchestrationLeases: true,
    });
  }

  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!config?.value_hash) return json({ error: "worker authentication is not configured" }, 503);

  const body = await req.json().catch(() => null) as { payload_text?: unknown; signature_hex?: unknown } | null;
  if (!body || typeof body.payload_text !== "string" || typeof body.signature_hex !== "string") {
    return json({ error: "invalid payload envelope" }, 400);
  }

  const validSignature = await verifyHmac(body.payload_text, body.signature_hex, config.value_hash);
  if (!validSignature) return json({ error: "invalid worker signature" }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body.payload_text);
  } catch {
    return json({ error: "invalid worker payload" }, 400);
  }

  const sentAt = Number(payload.sentAt);
  const projectId = String(payload.project_id ?? "");
  const userId = String(payload.user_id ?? "");
  const workerJobId = String(payload.worker_job_id ?? "");
  const workerNodeId = String(payload.worker_node_id ?? "");
  const orchestrationId = String(payload.orchestration_id ?? "");
  const status = String(payload.status ?? "queued");
  const progress = Math.max(0, Math.min(100, Number(payload.progress ?? 0)));

  if (!Number.isFinite(sentAt) || Math.abs(Math.floor(Date.now() / 1000) - sentAt) > 300) {
    return json({ error: "expired worker payload" }, 401);
  }
  if (!UUID.test(projectId) || !UUID.test(userId) || !WORKER_ID.test(workerJobId) || !STATUSES.has(status)) {
    return json({ error: "invalid worker job identity" }, 400);
  }

  const { data: ownedProject } = await admin
    .from("music_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!ownedProject) return json({ error: "project ownership mismatch" }, 403);

  const row = {
    project_id: projectId,
    user_id: userId,
    worker_job_id: workerJobId,
    parent_worker_job_id: payload.parent_worker_job_id || null,
    status,
    stage: String(payload.stage ?? "queued"),
    progress: Math.round(progress),
    mode: payload.mode === "core" ? "core" : "deep",
    strategy: String(payload.strategy ?? "auto"),
    instruction: String(payload.instruction ?? ""),
    requested_targets: Array.isArray(payload.requested_targets) ? payload.requested_targets : [],
    plan: payload.plan ?? null,
    quality_summary: payload.quality_summary ?? null,
    agent_report: payload.agent_report ?? null,
    manifest: payload.manifest ?? null,
    error: payload.error || null,
    started_at: payload.started_at || null,
    completed_at: payload.completed_at || null,
    events: Array.isArray(payload.events) ? payload.events.slice(-200) : [],
    source_profile: payload.source_profile ?? null,
    routing_summary: Array.isArray(payload.routing_summary) ? payload.routing_summary.slice(-120) : [],
    current_target: payload.current_target || null,
    source_lane: payload.source_lane || null,
    resume_count: Math.max(0, Number(payload.resume_count ?? 0)),
    worker_version: String(payload.worker_version ?? ""),
    source_sha256: payload.source_sha256 || null,
  };

  if (UUID.test(orchestrationId)) {
    if (!NODE_ID.test(workerNodeId)) return json({ error: "invalid orchestration worker node" }, 400);
    const { data: existing } = await admin
      .from("music_stem_jobs")
      .select("id,worker_node_id,recovery_generation")
      .eq("orchestration_id", orchestrationId)
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!existing) return json({ error: "cloud orchestration was not staged" }, 404);
    if (existing.worker_node_id && existing.worker_node_id !== workerNodeId) {
      return json({ error: "stale worker no longer owns this orchestration", code: "STALE_EXECUTION" }, 409);
    }

    const { data: node } = await admin
      .from("music_worker_nodes")
      .select("origin")
      .eq("node_id", workerNodeId)
      .maybeSingle();
    if (!node) return json({ error: "worker node is not registered" }, 409);

    const leaseExpiresAt = ACTIVE.has(status)
      ? new Date(Date.now() + LEASE_SECONDS * 1000).toISOString()
      : null;
    const patch = {
      ...row,
      orchestration_id: orchestrationId,
      worker_node_id: workerNodeId,
      worker_origin: node.origin,
      worker_lease_expires_at: leaseExpiresAt,
      recovery_generation: Math.max(Number(existing.recovery_generation ?? 0), Number(payload.recovery_generation ?? 0)),
    };
    const { error } = await admin.from("music_stem_jobs").update(patch).eq("id", existing.id);
    if (error) return json({ error: "orchestration mirror failed" }, 500);
    return json({ ok: true, workerJobId, orchestrationId, status, progress: row.progress, leaseExpiresAt });
  }

  const { error } = await admin.from("music_stem_jobs").upsert(row, { onConflict: "user_id,worker_job_id" });
  if (error) return json({ error: "job mirror failed" }, 500);
  return json({ ok: true, workerJobId, status, progress: row.progress });
});
