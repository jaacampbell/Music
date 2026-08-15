import { createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  accessToken: z.string().min(20),
  projectId: z.string().uuid().nullable().optional(),
  mode: z.enum(["core", "deep"]).default("deep"),
  strategy: z.string().max(80).default("auto"),
  instruction: z.string().max(2000).default(""),
  targets: z.array(z.string().max(120)).max(80).default([]),
  orchestrationId: z.string().uuid().nullable().optional(),
  excludeNodeId: z.string().max(128).nullable().optional()
});

type WorkerNode = {
  node_id: string;
  origin: string;
  status: "ready" | "busy" | "draining" | "degraded" | "offline";
  worker_version: string | null;
  gpu_name: string | null;
  deep_ready: boolean;
  current_jobs: number;
  capacity: number;
  last_seen: string;
};

type OrchestrationRow = {
  orchestration_id: string;
  status: string;
  source_storage_path: string | null;
  worker_node_id: string | null;
  worker_lease_expires_at: string | null;
  recovery_generation: number;
};

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

function signWorkerToken(
  secret: string,
  userId: string,
  input: {
    projectId?: string | null;
    mode: "core" | "deep";
    strategy: string;
    instruction: string;
    targets: string[];
    orchestrationId?: string | null;
  }
): string {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 6 * 60 * 60,
    nonce: randomBytes(8).toString("hex"),
    projectId: input.projectId ?? null,
    mode: input.mode,
    strategy: input.strategy,
    instruction: input.instruction,
    targets: input.targets,
    orchestrationId: input.orchestrationId ?? null,
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
  const query = new URLSearchParams({ select: "id", id: `eq.${projectId}`, user_id: `eq.${userId}`, limit: "1" });
  const response = await fetch(`${config.url}/rest/v1/music_projects?${query.toString()}`, {
    headers: { apikey: config.key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) return false;
  const rows = (await response.json().catch(() => [])) as Array<{ id?: string }>;
  return rows.some((row) => row.id === projectId);
}

async function loadOrchestration(
  config: { url: string; key: string },
  accessToken: string,
  userId: string,
  projectId: string,
  orchestrationId: string
): Promise<OrchestrationRow | null> {
  const query = new URLSearchParams({
    select: "orchestration_id,status,source_storage_path,worker_node_id,worker_lease_expires_at,recovery_generation",
    orchestration_id: `eq.${orchestrationId}`,
    project_id: `eq.${projectId}`,
    user_id: `eq.${userId}`,
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/music_stem_jobs?${query.toString()}`, {
    headers: { apikey: config.key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) return null;
  const rows = (await response.json().catch(() => [])) as OrchestrationRow[];
  return rows[0] ?? null;
}

async function selectWorker(
  config: { url: string; key: string },
  accessToken: string,
  mode: "core" | "deep",
  excludeNodeId?: string | null
): Promise<WorkerNode | null> {
  const params = new URLSearchParams({
    select: "node_id,origin,status,worker_version,gpu_name,deep_ready,current_jobs,capacity,last_seen",
    status: "eq.ready",
    order: "current_jobs.asc,last_seen.desc",
    limit: "20"
  });
  const response = await fetch(`${config.url}/rest/v1/music_worker_nodes?${params.toString()}`, {
    headers: { apikey: config.key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) return null;
  const rows = (await response.json().catch(() => [])) as WorkerNode[];
  const cutoff = Date.now() - 60_000;
  return rows.find((node) => {
    const fresh = Number.isFinite(Date.parse(node.last_seen)) && Date.parse(node.last_seen) >= cutoff;
    const available = node.current_jobs < node.capacity;
    const compatible = mode === "core" || node.deep_ready === true;
    const allowed = !excludeNodeId || node.node_id !== excludeNodeId;
    return fresh && available && compatible && allowed && /^https:\/\//.test(node.origin);
  }) ?? null;
}

function staticWorkerFallback(mode: "core" | "deep", excludeNodeId?: string | null): WorkerNode | null {
  if (excludeNodeId === "static-fallback") return null;
  const origin = process.env.NEXT_PUBLIC_SEPARATOR_URL?.replace(/\/$/, "");
  if (!origin || !/^https:\/\//.test(origin)) return null;
  return {
    node_id: "static-fallback",
    origin,
    status: "ready",
    worker_version: null,
    gpu_name: null,
    deep_ready: mode === "deep",
    current_jobs: 0,
    capacity: 1,
    last_seen: new Date().toISOString()
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.SEPARATOR_GATEWAY_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Stem Agent gateway is not configured." }, { status: 503 });
  const config = supabaseConfig();
  if (!config) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "A valid signed-in session is required." }, { status: 400 });

  const verify = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.key, Authorization: `Bearer ${parsed.data.accessToken}` },
    cache: "no-store"
  });
  if (!verify.ok) return NextResponse.json({ error: "Session could not be verified." }, { status: 401 });
  const user = (await verify.json()) as { id?: string };
  if (!user.id) return NextResponse.json({ error: "Verified session did not include a user." }, { status: 401 });

  if (parsed.data.projectId) {
    const ownsProject = await verifyProjectOwnership(config, parsed.data.accessToken, user.id, parsed.data.projectId);
    if (!ownsProject) return NextResponse.json({ error: "The selected Music OS project does not belong to this account." }, { status: 403 });
  }

  let orchestration: OrchestrationRow | null = null;
  if (parsed.data.orchestrationId) {
    if (!parsed.data.projectId) {
      return NextResponse.json({ error: "Cloud orchestration requires a linked Music OS project." }, { status: 400 });
    }
    orchestration = await loadOrchestration(config, parsed.data.accessToken, user.id, parsed.data.projectId, parsed.data.orchestrationId);
    if (!orchestration || !orchestration.source_storage_path) {
      return NextResponse.json({ error: "Cloud orchestration source is not staged for this account." }, { status: 404 });
    }
    if (["completed", "cancelled"].includes(orchestration.status)) {
      return NextResponse.json({ error: `Cloud orchestration is already ${orchestration.status}.` }, { status: 409 });
    }
  }

  const meshWorker = await selectWorker(config, parsed.data.accessToken, parsed.data.mode, parsed.data.excludeNodeId);
  const worker = meshWorker ?? staticWorkerFallback(parsed.data.mode, parsed.data.excludeNodeId);
  if (!worker) {
    return NextResponse.json({
      error: parsed.data.mode === "deep"
        ? "No healthy Agentic Deep worker is available. Launch or recover a CUDA + SAM-Audio node."
        : "No healthy Core 6 worker is available. Launch or recover a Stem Worker node.",
      code: "NO_COMPATIBLE_WORKER",
      mode: parsed.data.mode
    }, { status: 503 });
  }

  return NextResponse.json({
    token: signWorkerToken(secret, user.id, {
      projectId: parsed.data.projectId,
      mode: parsed.data.mode,
      strategy: parsed.data.strategy,
      instruction: parsed.data.instruction,
      targets: parsed.data.targets,
      orchestrationId: parsed.data.orchestrationId
    }),
    expiresIn: 6 * 60 * 60,
    orchestration: orchestration ? {
      id: orchestration.orchestration_id,
      status: orchestration.status,
      recoveryGeneration: orchestration.recovery_generation,
      previousNodeId: orchestration.worker_node_id,
      leaseExpiresAt: orchestration.worker_lease_expires_at
    } : null,
    worker: {
      nodeId: worker.node_id,
      origin: worker.origin,
      version: worker.worker_version,
      gpu: worker.gpu_name,
      deepReady: worker.deep_ready,
      load: { current: worker.current_jobs, capacity: worker.capacity },
      source: meshWorker ? "mesh" : "static-fallback"
    }
  }, { headers: { "Cache-Control": "no-store" } });
}
