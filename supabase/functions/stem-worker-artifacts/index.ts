import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORKER_JOB = /^[a-f0-9]{12}$/;
const NODE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const ACTIVE = new Set(["staging", "queued", "running", "recovering"]);
const LEASE_SECONDS = 60;
const SOURCE_URL_SECONDS = 15 * 60;

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
  const key = modern ? JSON.parse(modern)["default"] : legacy;
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
      service: "stem-worker-artifacts",
      auth: "derived-hmac-sha256",
      configReady: Boolean(config?.value_hash),
      leaseSeconds: LEASE_SECONDS,
      signedSourceSeconds: SOURCE_URL_SECONDS,
    });
  }

  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!config?.value_hash) return json({ error: "worker authentication is not configured" }, 503);

  const envelope = await req.json().catch(() => null) as { payload_text?: unknown; signature_hex?: unknown } | null;
  if (!envelope || typeof envelope.payload_text !== "string" || typeof envelope.signature_hex !== "string") {
    return json({ error: "invalid payload envelope" }, 400);
  }
  if (!await verifyHmac(envelope.payload_text, envelope.signature_hex, config.value_hash)) {
    return json({ error: "invalid worker signature" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(envelope.payload_text);
  } catch {
    return json({ error: "invalid worker payload" }, 400);
  }

  const sentAt = Number(payload.sentAt);
  const action = String(payload.action ?? "");
  const orchestrationId = String(payload.orchestration_id ?? "");
  const nodeId = String(payload.node_id ?? "");
  const workerJobId = String(payload.worker_job_id ?? "");
  const projectId = String(payload.project_id ?? "");
  const userId = String(payload.user_id ?? "");

  if (!Number.isFinite(sentAt) || Math.abs(Math.floor(Date.now() / 1000) - sentAt) > 300) {
    return json({ error: "expired worker payload" }, 401);
  }
  if (action !== "claim-source" || !UUID.test(orchestrationId) || !UUID.test(projectId) || !UUID.test(userId) || !NODE_ID.test(nodeId) || !WORKER_JOB.test(workerJobId)) {
    return json({ error: "invalid artifact request" }, 400);
  }

  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: node } = await admin
    .from("music_worker_nodes")
    .select("node_id,origin,status,last_seen")
    .eq("node_id", nodeId)
    .gte("last_seen", cutoff)
    .maybeSingle();
  if (!node || !["ready", "busy"].includes(node.status)) {
    return json({ error: "worker node is not registered or fresh" }, 409);
  }

  const { data: job } = await admin
    .from("music_stem_jobs")
    .select("id,orchestration_id,project_id,user_id,status,source_storage_path,source_original_name,source_mime_type,source_byte_size,worker_node_id,worker_lease_expires_at,lease_version,recovery_generation")
    .eq("orchestration_id", orchestrationId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!job || !ACTIVE.has(job.status) || !job.source_storage_path) {
    return json({ error: "recoverable cloud job was not found" }, 404);
  }

  const expectedPrefix = `${userId}/${projectId}/`;
  if (!String(job.source_storage_path).startsWith(expectedPrefix)) {
    return json({ error: "source ownership boundary mismatch" }, 403);
  }

  const leaseUntil = job.worker_lease_expires_at ? Date.parse(job.worker_lease_expires_at) : 0;
  const leaseActive = Number.isFinite(leaseUntil) && leaseUntil > Date.now();
  const changingNode = Boolean(job.worker_node_id && job.worker_node_id !== nodeId);
  if (changingNode && leaseActive) {
    return json({
      error: "another worker still owns the execution lease",
      code: "LEASE_ACTIVE",
      leaseExpiresAt: job.worker_lease_expires_at,
    }, 409);
  }

  const nextLeaseVersion = Number(job.lease_version ?? 0) + 1;
  const nextGeneration = Number(job.recovery_generation ?? 0) + (changingNode ? 1 : 0);
  const leaseExpiresAt = new Date(Date.now() + LEASE_SECONDS * 1000).toISOString();
  const patch = {
    worker_job_id: workerJobId,
    worker_node_id: nodeId,
    worker_origin: node.origin,
    worker_lease_expires_at: leaseExpiresAt,
    lease_version: nextLeaseVersion,
    recovery_generation: nextGeneration,
    recovered_from_node: changingNode ? job.worker_node_id : null,
    last_recovery_at: changingNode ? new Date().toISOString() : null,
    status: changingNode ? "recovering" : "queued",
    stage: changingNode ? "cross-node-recovery" : "cloud-source-claim",
  };

  const { data: claimed, error: claimError } = await admin
    .from("music_stem_jobs")
    .update(patch)
    .eq("id", job.id)
    .eq("lease_version", Number(job.lease_version ?? 0))
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) {
    return json({ error: "execution lease changed while claiming source", code: "LEASE_RACE" }, 409);
  }

  const { data: signed, error: signedError } = await admin.storage
    .from("music-assets")
    .createSignedUrl(job.source_storage_path, SOURCE_URL_SECONDS);
  if (signedError || !signed?.signedUrl) {
    return json({ error: "could not authorize durable source download" }, 500);
  }

  return json({
    ok: true,
    orchestrationId,
    projectId,
    userId,
    workerJobId,
    nodeId,
    workerOrigin: node.origin,
    sourcePath: job.source_storage_path,
    sourceName: job.source_original_name || "source-audio",
    sourceMimeType: job.source_mime_type || null,
    sourceByteSize: job.source_byte_size || null,
    signedUrl: signed.signedUrl,
    signedUrlExpiresIn: SOURCE_URL_SECONDS,
    leaseExpiresAt,
    recoveryGeneration: nextGeneration,
    recoveredFromNode: changingNode ? job.worker_node_id : null,
  });
});
