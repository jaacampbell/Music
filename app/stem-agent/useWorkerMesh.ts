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
  };
  services?: {
    workerFleet?: { ok: boolean; data?: { activeNodes?: number; readyNodes?: number; deepReadyNodes?: number } };
  };
};

export function useWorkerMesh(projectId: string | null, mode: "core" | "deep") {
  const [worker, setWorker] = useState<WorkerSelection | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [readiness, setReadiness] = useState<StemReadiness | null>(null);

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

  const acquire = useCallback(async (): Promise<WorkerSession> => {
    const accessToken = await getSessionAccessToken();
    if (!accessToken) throw new Error("Sign in before using the Agentic Stem System.");
    const response = await fetch("/api/stem-agent/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, projectId, mode })
    });
    const body = await response.json().catch(() => ({})) as Partial<WorkerSession> & { error?: string };
    if (!response.ok || !body.token || !body.worker?.origin) {
      throw new Error(body.error ?? "No compatible Stem Worker is currently available.");
    }
    const session = body as WorkerSession;
    setToken(session.token);
    setWorker(session.worker);
    await probeWorker(session.worker.origin);
    return session;
  }, [mode, probeWorker, projectId]);

  const clear = useCallback(() => {
    setToken(null);
    setWorker(null);
    setHealth(null);
  }, []);

  useEffect(() => { void refreshReadiness(); }, [refreshReadiness]);
  useEffect(() => { clear(); }, [mode, projectId, clear]);

  return {
    worker,
    token,
    health,
    readiness,
    acquire,
    clear,
    refreshReadiness,
    probeWorker,
  };
}
