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

function numberField(data: Record<string, unknown>, key: string): number {
  const value = Number(data[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export async function GET(): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const separatorUrl = process.env.NEXT_PUBLIC_SEPARATOR_URL?.replace(/\/$/, "") ?? "";
  const gatewayConfigured = Boolean(process.env.SEPARATOR_GATEWAY_SECRET?.trim());

  const edgeMirror = supabaseUrl
    ? await probeJson(`${supabaseUrl}/functions/v1/stem-worker-mirror`)
    : { ok: false, error: "Supabase URL is not configured." } satisfies Probe;
  const workerFleet = supabaseUrl
    ? await probeJson(`${supabaseUrl}/functions/v1/stem-worker-heartbeat`)
    : { ok: false, error: "Supabase URL is not configured." } satisfies Probe;
  const artifactBroker = supabaseUrl
    ? await probeJson(`${supabaseUrl}/functions/v1/stem-worker-artifacts`)
    : { ok: false, error: "Supabase URL is not configured." } satisfies Probe;

  const workerHealth = separatorUrl
    ? await probeJson(`${separatorUrl}/agent/health`)
    : { ok: false, error: "No static worker fallback URL is configured." } satisfies Probe;
  const workerSystem = separatorUrl && workerHealth.ok
    ? await probeJson(`${separatorUrl}/agent/system`)
    : { ok: false, error: separatorUrl ? "Static worker health probe failed." : "Static worker fallback is not configured." } satisfies Probe;
  const workerMirror = separatorUrl && workerHealth.ok
    ? await probeJson(`${separatorUrl}/agent/mirror/edge`)
    : { ok: false, error: separatorUrl ? "Static worker health probe failed." : "Static worker fallback is not configured." } satisfies Probe;

  const healthData = workerHealth.data ?? {};
  const samAudio = (healthData.samAudio ?? {}) as Record<string, unknown>;
  const systemData = workerSystem.data ?? {};
  const recovery = (systemData.restartRecovery ?? {}) as Record<string, unknown>;
  const fleetData = workerFleet.data ?? {};
  const artifactData = artifactBroker.data ?? {};
  const fleetReadyNodes = numberField(fleetData, "readyNodes");
  const fleetDeepNodes = numberField(fleetData, "deepReadyNodes");
  const fleetHierarchical = numberField(fleetData, "hierarchicalNodes");
  const fleetRecovery = numberField(fleetData, "recoveryNodes");
  const fleetMirror = numberField(fleetData, "cloudMirrorNodes");
  const fleetSam = numberField(fleetData, "samReadyNodes");

  const staticComputeReady = Boolean(separatorUrl && workerHealth.ok);
  const fleetComputeReady = Boolean(workerFleet.ok && fleetReadyNodes > 0);
  const permanentOutputs = Boolean(
    artifactBroker.ok &&
    artifactData.permanentOutputs === true &&
    artifactData.uploadProtocol === "tus-resumable-signed-token"
  );
  const controlPlaneReady = Boolean(
    supabaseUrl && gatewayConfigured && edgeMirror.ok && workerFleet.ok && artifactBroker.ok && permanentOutputs
  );
  const computeReady = staticComputeReady || fleetComputeReady;
  const deepReady = Boolean(fleetDeepNodes > 0 || (staticComputeReady && samAudio.installed === true && samAudio.cudaAvailable === true));
  const cloudRecovery = Boolean(artifactBroker.ok && edgeMirror.ok && workerFleet.ok);

  const nextAction = !supabaseUrl
    ? "Configure Supabase for Music OS."
    : !gatewayConfigured
      ? "Configure the server-only Stem Director gateway secret."
      : !edgeMirror.ok
        ? "Repair the Supabase stem-worker-mirror Edge gateway."
        : !workerFleet.ok
          ? "Repair the Stem Worker Mesh heartbeat gateway."
          : !artifactBroker.ok
            ? "Repair the stem artifact broker."
            : !permanentOutputs
              ? "Deploy the Phase 14 artifact broker with resumable permanent-output persistence."
              : !computeReady
                ? "Compute is safely in standby. Start or wake an approved Phase 14 worker when a stem job needs GPU capacity."
                : !deepReady
                  ? "Core workers are available. Add a CUDA + SAM-Audio node to unlock Agentic Deep mode."
                  : "Stem Director, wake-on-demand compute, cross-node recovery, and permanent private outputs are ready.";

  return NextResponse.json({
    status: controlPlaneReady && computeReady ? "ready" : controlPlaneReady ? "control-plane-ready" : "degraded",
    checkedAt: new Date().toISOString(),
    nextAction,
    configuration: {
      supabase: Boolean(supabaseUrl),
      gatewaySecret: gatewayConfigured,
      separatorUrl: Boolean(separatorUrl),
      workerMesh: Boolean(supabaseUrl)
    },
    services: {
      edgeMirror,
      workerFleet,
      artifactBroker,
      workerHealth,
      workerSystem,
      workerMirror
    },
    capabilities: {
      controlPlaneReady,
      computeReady,
      deepReady,
      cuda: fleetDeepNodes > 0 || samAudio.cudaAvailable === true,
      samAudio: fleetSam > 0 || samAudio.installed === true,
      hierarchicalRouting: fleetHierarchical > 0 || systemData.hierarchicalRouting === true,
      restartRecovery: fleetRecovery > 0 || recovery.enabled === true,
      cloudMirror: fleetMirror > 0 || workerMirror.ok,
      dynamicRouting: workerFleet.ok,
      cloudRecovery,
      permanentOutputs,
      resumableOutputUpload: permanentOutputs
    }
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
