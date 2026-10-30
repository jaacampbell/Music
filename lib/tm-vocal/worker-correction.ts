import { getSessionAccessToken } from "@/lib/persistence/supabase-rest";

export type WorkerCorrectionMeta = {
  engine?: string;
  key?: string | null;
  bpm?: number | null;
  pitchAmount?: number;
  timingTightness?: number;
  pitch?: { appliedSegments?: number; meanAbsCents?: number; formantPreserved?: boolean };
  timing?: { movedPhrases?: number; maxShiftMs?: number; referenceAligned?: boolean };
  [key: string]: unknown;
};

type TokenBody = {
  token?: string;
  worker?: { origin?: string; nodeId?: string; gpu?: string | null };
  error?: string;
  code?: string;
  retryAfterSeconds?: number | null;
  compute?: { state?: string; autoStartEnabled?: boolean; lastError?: string | null } | null;
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function decodeMeta(value: string | null): WorkerCorrectionMeta | null {
  if (!value) return null;
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
    return JSON.parse(atob(normalized)) as WorkerCorrectionMeta;
  } catch {
    return null;
  }
}

async function finishRequest(accessToken: string, requestId: string, status: "completed" | "failed" | "cancelled", detail?: string) {
  await fetch("/api/tm-vocal/compute-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, requestId, status, detail: detail?.slice(0, 500) ?? null }),
  }).catch(() => undefined);
}

export async function correctVocalOnWorker(args: {
  vocal: File;
  reference?: File | null;
  projectId?: string | null;
  key?: string | null;
  bpm?: number | null;
  pitchAmount: number;
  timingTightness: number;
  onStatus?: (message: string) => void;
}): Promise<{ file: File; meta: WorkerCorrectionMeta | null; worker: { nodeId?: string; gpu?: string | null } }> {
  const accessToken = await getSessionAccessToken();
  if (!accessToken) throw new Error("Sign in before using worker pitch/timing correction.");
  const requestId = crypto.randomUUID();
  const deadline = Date.now() + 4 * 60_000;
  let tokenBody: TokenBody | null = null;

  while (Date.now() < deadline) {
    const response = await fetch("/api/stem-agent/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken,
        projectId: args.projectId ?? null,
        mode: "deep",
        strategy: "vocal-correction",
        instruction: "Transparent note-region pitch correction and bounded phrase-onset alignment before the vocal mix chain.",
        targets: [],
        computeRequestId: requestId,
        computeKind: "vocal-correction",
      }),
    });
    tokenBody = await response.json().catch(() => ({})) as TokenBody;
    if (response.ok && tokenBody.token && tokenBody.worker?.origin) break;
    if (tokenBody.code === "COMPUTE_WAKING") {
      args.onStatus?.(tokenBody.error ?? "RunPod worker is waking…");
      await sleep(Math.max(3000, Math.min(15000, (tokenBody.retryAfterSeconds ?? 5) * 1000)));
      continue;
    }
    await finishRequest(accessToken, requestId, "failed", tokenBody.error);
    throw new Error(tokenBody.error ?? "No vocal-correction worker is available.");
  }

  if (!tokenBody?.token || !tokenBody.worker?.origin) {
    await finishRequest(accessToken, requestId, "failed", "Worker wake-up timed out.");
    throw new Error("Worker wake-up exceeded four minutes.");
  }

  args.onStatus?.("Worker online. Correcting pitch and phrase timing…");
  const form = new FormData();
  form.append("vocal", args.vocal);
  if (args.reference) form.append("reference", args.reference);
  form.append("key", args.key ?? "");
  if (args.bpm) form.append("bpm", String(args.bpm));
  form.append("pitch_amount", String(args.pitchAmount));
  form.append("timing_tightness", String(args.timingTightness));

  try {
    const response = await fetch(tokenBody.worker.origin + "/agent/vocal-correction", {
      method: "POST",
      headers: { Authorization: "Bearer " + tokenBody.token },
      body: form,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { detail?: string; error?: string };
      throw new Error(body.detail ?? body.error ?? "Worker vocal correction failed.");
    }
    const meta = decodeMeta(response.headers.get("X-TM-Correction-Meta"));
    const blob = await response.blob();
    const file = new File([blob], "tm-vocal-corrected.wav", { type: "audio/wav" });
    await finishRequest(accessToken, requestId, "completed");
    return { file, meta, worker: { nodeId: tokenBody.worker.nodeId, gpu: tokenBody.worker.gpu } };
  } catch (error) {
    await finishRequest(accessToken, requestId, "failed", error instanceof Error ? error.message : "Worker correction failed.");
    throw error;
  }
}
