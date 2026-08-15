import { NextResponse } from "next/server";

type Probe = {
  ok: boolean;
  status?: number;
  latencyMs?: number;
  error?: string;
  data?: Record<string, unknown>;
};

async function probeJson(url: string, timeoutMs = 4500): Promise<Probe> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    const data = await response.json().catch(() => ({})) as Record<string, unknown>;
    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - started,
      data,
      error: response.ok ? undefined : typeof data.error === "string" ? data.error : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "probe failed"
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const separatorUrl = process.env.NEXT_PUBLIC_SEPARATOR_URL?.replace(/\/$/, "") ?? "";
  const gatewayConfigured = Boolean(process.env.SEPARATOR_GATEWAY_SECRET?.trim());

  const edgeMirror = supabaseUrl
    ? await probeJson(`${supabaseUrl}/functions/v1/stem-worker-mirror`)
    : { ok: false, error: "Supabase URL is not configured." } satisfies Probe;

  const workerHealth = separatorUrl
    ? await probeJson(`${separatorUrl}/agent/health`)
    : { ok: false, error: "No GPU/CPU worker URL is configured." } satisfies Probe;

  const workerSystem = separatorUrl && workerHealth.ok
    ? await probeJson(`${separatorUrl}/agent/system`)
    : { ok: false, error: separatorUrl ? "Worker health probe failed." : "Worker URL is not configured." } satisfies Probe;

  const workerMirror = separatorUrl && workerHealth.ok
    ? await probeJson(`${separatorUrl}/agent/mirror/edge`)
    : { ok: false, error: separatorUrl ? "Worker health probe failed." : "Worker URL is not configured." } satisfies Probe;

  const healthData = workerHealth.data ?? {};
  const samAudio = (healthData.samAudio ?? {}) as Record<string, unknown>;
  const systemData = workerSystem.data ?? {};
  const recovery = (systemData.restartRecovery ?? {}) as Record<string, unknown>;

  const controlPlaneReady = Boolean(supabaseUrl && gatewayConfigured && edgeMirror.ok);
  const computeReady = Boolean(separatorUrl && workerHealth.ok);
  const deepReady = Boolean(computeReady && samAudio.installed === true && samAudio.cudaAvailable === true);

  const nextAction = !supabaseUrl
    ? "Configure Supabase for Music OS."
    : !gatewayConfigured
      ? "Configure the server-only Stem Director gateway secret."
      : !edgeMirror.ok
        ? "Repair the Supabase stem-worker-mirror Edge gateway."
        : !separatorUrl
          ? "Launch the Phase 7 GPU worker and set NEXT_PUBLIC_SEPARATOR_URL on Netlify."
          : !workerHealth.ok
            ? "The configured worker URL is unreachable. Check the GPU host, HTTPS port, container health and CORS."
            : !deepReady
              ? "Core separation is reachable. Enable CUDA + SAM-Audio to unlock Agentic Deep mode."
              : "Stem Director control plane and deep compute are ready.";

  return NextResponse.json({
    status: controlPlaneReady && computeReady ? "ready" : controlPlaneReady ? "control-plane-ready" : "degraded",
    checkedAt: new Date().toISOString(),
    nextAction,
    configuration: {
      supabase: Boolean(supabaseUrl),
      gatewaySecret: gatewayConfigured,
      separatorUrl: Boolean(separatorUrl)
    },
    services: {
      edgeMirror,
      workerHealth,
      workerSystem,
      workerMirror
    },
    capabilities: {
      controlPlaneReady,
      computeReady,
      deepReady,
      cuda: samAudio.cudaAvailable === true,
      samAudio: samAudio.installed === true,
      hierarchicalRouting: systemData.hierarchicalRouting === true,
      restartRecovery: recovery.enabled === true,
      cloudMirror: workerMirror.ok
    }
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
