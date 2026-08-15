"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionAccessToken } from "@/lib/persistence/supabase-rest";

export type WorkerHealth = {
  status: string;
  version: string;
  system?: string;
  coreModel: string;
  deepTargetCount: number;
  auth?: { required: boolean };
  samAudio: { installed: boolean; model: string; cudaAvailable: boolean; hfTokenPresent: boolean };
  planner?: { openaiConfigured: boolean; model: string; enabled: boolean };
};

export type WorkerSelection = {
  nodeId: string;
  origin: string;
  version: string | null;
  gpu: string | null;
  deepReady: boolean;
  load: { current: number; capacity: number };
  source: "mesh" | "static-fallback";
};

export type WorkerSession = {
  token: string;
  expiresIn: number;
  worker: WorkerSelection;
  orchestration?: {
    id: string;
    status: string;
    recoveryGeneration: number;
    previousNodeId: string | null;
    leaseExpiresAt: string | null;
  } | null;
};

export type ComputeState = {
  state: string;
  autoStartEnabled: boolean;
  autoStopEnabled: boolean;
  pendingJobs: number;
  activeJobs: number;
  controllerFresh: boolean;
  lastError: string | null;
};

export type StemReadiness = {
  status: "ready" | "control-plane-ready" | "degraded";
  checkedAt: string;
  nextAction: string;
  capabilities: {
    controlPlaneReady: boolean;
    computeReady: boolean;
    deepReady: boolean;
    cuda: boolean;
    samAudio: boolean;
    hierarchicalRouting: boolean;
    restartRecovery: boolean;
    cloudMirror: boolean;
    dynamicRouting?: boolean;
    cloudRecovery?: boolean;
  };
  services?: {
    workerFleet?: { ok: boolean; data?: { activeNodes?: number; readyNodes?: number; deepReadyNodes?: number } };
    artifactBroker?: { ok: boolean; data?: Record<string, unknown> };
  };
};

export type AcquireWorkerOptions = {
  orchestrationId?: string | null;
  excludeNodeId?: string | null;
  strategy?: string;
  instruction?: string;
  targets?: string[];
  waitForCompute?: boolean;
  maxWaitMs?: number;
  onComputeWait?: (message: string, compute: ComputeState | null) => void;
};

type SessionResponse = Partial<WorkerSession> & {
  error?: string;
  code?: string;
  retryAfterSeconds?: number | null;
  compute?: ComputeState | null;
};

const sleep = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function useWorkerMesh(projectId: string | null, mode: "core" | "deep") {
  const [worker, setWorker] = useState<WorkerSelection | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [readiness, setReadiness] = useState<StemReadiness | null>(null);
  const [compute, setCompute] = useState<ComputeState | null>(null);

  const refreshReadiness = useCallback(async (): Promise<StemReadiness | null> => {
    try {
      const response = await fetch("/api/stem-agent/readiness", { cache: "no-store" });
      if (!response.ok) return null;
      const body = await response.json() as StemReadiness;
      setReadiness(body);
      return body;
    } catch {
      return null;
    }
  }, []);

  const probeWorker = useCallback(async (origin: string): Promise<WorkerHealth | null> => {
    try {
      const response = await fetch(`${origin}/agent/health`, { cache: "no-store" });
      if (!response.ok) return null;
      const body = await response.json() as WorkerHealth;
      setHealth(body);
      return body;
    } catch {
      setHealth(null);
      return null;
    }
  }, []);

  const acquire = useCallback(async (options: AcquireWorkerOptions = {}): Promise<WorkerSession> => {
    const accessToken = await getSessionAccessToken();
    if (!accessToken) throw new Error("Sign in before using the Agentic Stem System.");

    const payload = {
      accessToken,
      projectId,
      mode,
      orchestrationId: options.orchestrationId ?? null,
      excludeNodeId: options.excludeNodeId ?? null,
      strategy: options.strategy ?? "auto",
      instruction: options.instruction ?? "",
      targets: options.targets ?? []
    };
    const waitForCompute = options.waitForCompute !== false && Boolean(options.orchestrationId);
    const deadline = Date.now() + Math.max(15_000, options.maxWaitMs ?? 4 * 60_000);

    while (true) {
      const response = await fetch("/api/stem-agent/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({})) as SessionResponse;

      if (response.ok && body.token && body.worker?.origin) {
        const session = body as WorkerSession;
        setCompute(null);
        setToken(session.token);
        setWorker(session.worker);
        await probeWorker(session.worker.origin);
        return session;
      }

      if (body.code === "COMPUTE_WAKING" && waitForCompute && Date.now() < deadline) {
        const nextCompute = body.compute ?? null;
        setCompute(nextCompute);
        options.onComputeWait?.(body.error ?? "GPU engine is waking from standby…", nextCompute);
        await refreshReadiness();
        const retrySeconds = Math.max(3, Math.min(15, body.retryAfterSeconds ?? 5));
        await sleep(retrySeconds * 1000);
        continue;
      }

      setCompute(body.compute ?? null);
      const suffix = body.code && body.code !== "NO_COMPATIBLE_WORKER" ? ` (${body.code})` : "";
      if (body.code === "COMPUTE_WAKING" && waitForCompute) {
        throw new Error("GPU wake-up exceeded four minutes. The durable job is still staged; check Stem System Status or the VPS controller.");
      }
      throw new Error(`${body.error ?? "No compatible Stem Worker is currently available."}${suffix}`);
    }
  }, [mode, probeWorker, projectId, refreshReadiness]);

  const clear = useCallback(() => {
    setToken(null);
    setWorker(null);
    setHealth(null);
    setCompute(null);
  }, []);

  useEffect(() => { void refreshReadiness(); }, [refreshReadiness]);
  useEffect(() => { clear(); }, [mode, projectId, clear]);

  return {
    worker,
    token,
    health,
    readiness,
    compute,
    acquire,
    clear,
    refreshReadiness,
    probeWorker,
  };
}
