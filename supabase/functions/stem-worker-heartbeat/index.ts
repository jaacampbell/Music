import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();
const NODE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const STATUSES = new Set(["ready", "busy", "draining", "degraded", "offline"]);

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

function safeOrigin(raw: string, provider: string, providerNodeId: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    const origin = url.origin;
    if (provider === "runpod") {
      const expected = `https://${providerNodeId}-8000.proxy.runpod.net`;
      if (origin !== expected) return null;
    }
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return null;
    return origin;
  } catch {
    return null;
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
    const cutoff = new Date(Date.now() - 60_000).toISOString();
    const { data: nodes, error } = await admin
      .from("music_worker_nodes")
      .select("node_id,status,deep_ready,current_jobs,capacity,gpu_name,worker_version,last_seen,hierarchical_routing,restart_recovery,cloud_mirror,sam_audio")
      .gte("last_seen", cutoff)
      .order("last_seen", { ascending: false });
    if (error) return json({ error: "worker mesh registry unavailable" }, 503);
    const active = nodes ?? [];
    const ready = active.filter((node) => node.status === "ready" && node.current_jobs < node.capacity);
    const deep = ready.filter((node) => node.deep_ready === true);
    return json({
      status: "ok",
      service: "stem-worker-heartbeat",
      auth: "derived-hmac-sha256",
      configReady: Boolean(config?.value_hash),
      activeNodes: active.length,
      readyNodes: ready.length,
      deepReadyNodes: deep.length,
      hierarchicalNodes: ready.filter((node) => node.hierarchical_routing === true).length,
      recoveryNodes: ready.filter((node) => node.restart_recovery === true).length,
      cloudMirrorNodes: ready.filter((node) => node.cloud_mirror === true).length,
      samReadyNodes: ready.filter((node) => node.sam_audio === true).length,
      fleet: active.map((node) => ({
        nodeId: node.node_id,
        status: node.status,
        deepReady: node.deep_ready,
        load: `${node.current_jobs}/${node.capacity}`,
        gpu: node.gpu_name,
        version: node.worker_version,
        lastSeen: node.last_seen,
      })),
    });
  }

  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!config?.value_hash) return json({ error: "worker authentication is not configured" }, 503);

  const body = await req.json().catch(() => null) as { payload_text?: unknown; signature_hex?: unknown } | null;
  if (!body || typeof body.payload_text !== "string" || typeof body.signature_hex !== "string") {
    return json({ error: "invalid payload envelope" }, 400);
  }
  if (!await verifyHmac(body.payload_text, body.signature_hex, config.value_hash)) {
    return json({ error: "invalid worker signature" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body.payload_text);
  } catch {
    return json({ error: "invalid worker payload" }, 400);
  }

  const sentAt = Number(payload.sentAt);
  const nodeId = String(payload.node_id ?? "");
  const provider = String(payload.provider ?? "custom").toLowerCase();
  const providerNodeId = String(payload.provider_node_id ?? "");
  const status = String(payload.status ?? "ready");
  const origin = safeOrigin(String(payload.origin ?? ""), provider, providerNodeId);
  const currentJobs = Math.max(0, Number(payload.current_jobs ?? 0));
  const capacity = Math.max(1, Math.min(16, Number(payload.capacity ?? 1)));

  if (!Number.isFinite(sentAt) || Math.abs(Math.floor(Date.now() / 1000) - sentAt) > 300) {
    return json({ error: "expired worker payload" }, 401);
  }
  if (!NODE_ID.test(nodeId) || !STATUSES.has(status) || !origin || !Number.isFinite(currentJobs) || !Number.isFinite(capacity)) {
    return json({ error: "invalid worker node identity" }, 400);
  }

  const row = {
    node_id: nodeId,
    provider,
    provider_node_id: providerNodeId || null,
    origin,
    status,
    worker_version: String(payload.worker_version ?? ""),
    region: String(payload.region ?? "") || null,
    gpu_name: String(payload.gpu_name ?? "") || null,
    cuda_version: String(payload.cuda_version ?? "") || null,
    sam_audio: payload.sam_audio === true,
    deep_ready: payload.deep_ready === true,
    hierarchical_routing: payload.hierarchical_routing === true,
    restart_recovery: payload.restart_recovery === true,
    cloud_mirror: payload.cloud_mirror === true,
    current_jobs: Math.round(currentJobs),
    capacity: Math.round(capacity),
    cost_per_hr: Number.isFinite(Number(payload.cost_per_hr)) ? Number(payload.cost_per_hr) : null,
    capabilities: payload.capabilities && typeof payload.capabilities === "object" ? payload.capabilities : {},
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {},
    last_seen: new Date().toISOString(),
  };

  const { error } = await admin.from("music_worker_nodes").upsert(row, { onConflict: "node_id" });
  if (error) return json({ error: "worker registration failed" }, 500);
  return json({ ok: true, nodeId, status, acceptedAt: row.last_seen });
});
