"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { getProjectAudio, loadStoredProjects } from "@/lib/browser-project-storage";
import {
  getCurrentUser,
  isCloudConfigured,
  supabaseRest,
  uploadPrivateFile,
  uploadPrivateUrl
} from "@/lib/persistence/supabase-rest";
import type { CloudUser, MusicAssetRow } from "@/lib/persistence/types";
import { PRESETS, STEM_GROUPS, STEM_TARGETS } from "@/app/stem-studio/catalog";
import { useRealStemPlayer, type StemInfo } from "@/app/stem-studio/useRealStemPlayer";
import { useWorkerMesh, type WorkerSelection, type WorkerSession } from "./useWorkerMesh";
import "./stemAgent.css";

type JobState = {
  jobId: string;
  orchestrationId?: string;
  status: "queued" | "running" | "cancelling" | "completed" | "failed" | "cancelled";
  stage: string;
  progress: number;
  error?: string;
  plan?: AgentPlan;
  qualitySummary?: QualitySummary;
  events?: AgentEvent[];
  recoveryGeneration?: number;
  recoveredFromNode?: string | null;
};

type AgentEvent = { at: string; agent: string; message: string; data?: Record<string, unknown> };
type AgentPlan = { strategy: string; targets: string[]; reasoning: string[]; qaFocus: string[]; planner?: string };
type QualitySummary = { stemCount: number; excellent: number; good: number; review: number; failedTargets: number };
type TechnicalQa = { score: number; grade: string; reasons: string[]; meaning: string; metrics: Record<string, number | null> };
type AgentStem = StemInfo & { technicalQa?: TechnicalQa; attemptCount?: number; agentDecision?: Record<string, unknown>; sourceLane?: string };
type Manifest = {
  jobId: string;
  source: { filename: string; sha256?: string };
  model: string;
  device?: string;
  mode: "core" | "deep";
  sampleRate: number;
  channels: number;
  durationSec: number;
  stems: AgentStem[];
  requestedTargets: string[];
  plannedTargets: string[];
  failedTargets: { id: string; error: string }[];
  alignment: { reconErrorDb: number; note: string };
  warnings: string[];
  agentPlan: AgentPlan;
  qualitySummary: QualitySummary;
  zipUrl: string;
};
type StemJobRow = {
  id: string;
  orchestration_id: string;
  project_id: string;
  user_id: string;
  worker_job_id: string | null;
  worker_node_id?: string | null;
  worker_origin?: string | null;
  worker_lease_expires_at?: string | null;
  recovery_generation?: number;
  status: string;
  stage?: string;
  progress: number;
  error?: string | null;
};

const strategies = [
  ["auto", "Auto Director", "Agent chooses a focused plan from your goal."],
  ["vocal-suite", "Vocal Suite", "Lead, backgrounds, doubles, ad-libs and vocal layers."],
  ["drum-suite", "Drum Suite", "Kick, snare, hats, percussion and drum detail."],
  ["beat-rebuild", "Beat Rebuild", "Drums, 808/sub and musical components for reconstruction."],
  ["instrument-suite", "Instrument Suite", "Keys, guitars, orchestral and melodic layers."],
  ["surgical", "Surgical", "Only the exact targets you select."],
] as const;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function StemAgentPage(): React.JSX.Element {
  const player = useRealStemPlayer();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const stopPolling = useRef(false);
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState("No source selected");
  const [sourceCloudPath, setSourceCloudPath] = useState<string | null>(null);
  const [mode, setMode] = useState<"core" | "deep">("deep");
  const mesh = useWorkerMesh(projectId, mode);
  const [activeSession, setActiveSession] = useState<WorkerSession | null>(null);
  const [orchestrationId, setOrchestrationId] = useState<string | null>(null);
  const [recoveryGeneration, setRecoveryGeneration] = useState(0);
  const [resultOrigin, setResultOrigin] = useState<string | null>(null);
  const [strategy, setStrategy] = useState("auto");
  const [instruction, setInstruction] = useState("Build production-ready stems. Prioritize a clean vocal stack, drums, 808/sub and the main musical layers, then retry technically weak isolates.");
  const [targets, setTargets] = useState<string[]>([]);
  const [job, setJob] = useState<JobState | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [cloudSaved, setCloudSaved] = useState(0);
  const [message, setMessage] = useState("Connect a source and give the Stem Director a production goal.");

  const project = useMemo(
    () => projectId ? loadStoredProjects().find((item) => item.id === projectId) ?? null : null,
    [projectId, manifest]
  );
  const health = mesh.health;
  const online = health?.status === "ok";
  const fleetReady = mesh.readiness?.capabilities.computeReady === true;
  const deepReady = health?.samAudio.installed === true && health?.samAudio.cudaAvailable === true;
  const groupedTargets = useMemo(() => STEM_GROUPS.map((group) => ({ group, items: STEM_TARGETS.filter((target) => target.group === group) })), []);
  const events = job?.events ?? [];
  const fleetSummary = mesh.readiness?.services?.workerFleet?.data;
  const cloudRecoveryReady = mesh.readiness?.capabilities.cloudRecovery === true;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("projectId");
    setProjectId(linked);
    if (isCloudConfigured()) void getCurrentUser().then(setCloudUser).catch(() => setCloudUser(null));
    if (linked) {
      const local = loadStoredProjects().find((item) => item.id === linked);
      if (local?.sourceAudio?.name) setSourceName(local.sourceAudio.name);
      if (local?.sourceAudio?.cloudPath) setSourceCloudPath(local.sourceAudio.cloudPath);
      void getProjectAudio(linked).then((file) => {
        if (file) {
          setSourceFile(file);
          setSourceName(file.name);
        }
      });
    }
    return () => { stopPolling.current = true; };
  }, []);

  useEffect(() => {
    setActiveSession(null);
    setOrchestrationId(null);
    setRecoveryGeneration(0);
    setResultOrigin(null);
  }, [projectId]);

  const authHeaders = (token: string): HeadersInit => ({ Authorization: `Bearer ${token}` });

  const loadCloudJob = async (id: string): Promise<StemJobRow | null> => {
    if (!projectId || !cloudUser || !isCloudConfigured()) return null;
    const rows = await supabaseRest<StemJobRow[]>("music_stem_jobs", {
      query: `select=id,orchestration_id,project_id,user_id,worker_job_id,worker_node_id,worker_origin,worker_lease_expires_at,recovery_generation,status,stage,progress,error&orchestration_id=eq.${id}&limit=1`
    });
    return rows[0] ?? null;
  };

  const stageCloudSource = async (): Promise<{ orchestrationId: string; storagePath: string }> => {
    if (!projectId || !cloudUser || !sourceFile || !isCloudConfigured()) {
      throw new Error("Cross-node recovery requires a signed-in Music OS project and source audio.");
    }
    const storagePath = sourceCloudPath ?? await uploadPrivateFile(projectId, sourceFile, "stem-ingress");
    const id = crypto.randomUUID();
    await supabaseRest<StemJobRow[]>("music_stem_jobs", {
      method: "POST",
      body: {
        orchestration_id: id,
        project_id: projectId,
        user_id: cloudUser.id,
        worker_job_id: null,
        status: "staging",
        stage: "durable-source-staged",
        progress: 0,
        mode,
        strategy,
        instruction,
        requested_targets: targets,
        source_storage_path: storagePath,
        source_original_name: sourceFile.name,
        source_mime_type: sourceFile.type || null,
        source_byte_size: sourceFile.size,
        recovery_generation: 0
      }
    });
    setSourceCloudPath(storagePath);
    setOrchestrationId(id);
    setRecoveryGeneration(0);
    return { orchestrationId: id, storagePath };
  };

  const persistJob = async (
    next: JobState,
    plan?: AgentPlan,
    finalManifest?: Manifest,
    finalReport?: Record<string, unknown>,
    worker?: WorkerSelection | null,
    orchestration?: string | null
  ): Promise<void> => {
    if (!projectId || !cloudUser || !isCloudConfigured()) return;
    const keyQuery = orchestration
      ? `orchestration_id=eq.${orchestration}`
      : `worker_job_id=eq.${next.jobId}`;
    const existing = await supabaseRest<StemJobRow[]>("music_stem_jobs", {
      query: `select=id,orchestration_id,project_id,user_id,worker_job_id,status,progress&${keyQuery}&limit=1`
    });
    const body = {
      ...(orchestration ? { orchestration_id: orchestration } : {}),
      project_id: projectId,
      user_id: cloudUser.id,
      worker_job_id: next.jobId,
      worker_node_id: worker?.nodeId ?? null,
      worker_origin: worker?.origin ?? null,
      status: next.status,
      stage: next.stage,
      progress: next.progress,
      mode,
      strategy,
      instruction,
      requested_targets: targets,
      plan: plan ?? next.plan ?? null,
      quality_summary: next.qualitySummary ?? finalManifest?.qualitySummary ?? null,
      agent_report: finalReport ?? null,
      manifest: finalManifest ?? null,
      error: next.error ?? null,
      recovery_generation: next.recoveryGeneration ?? recoveryGeneration,
      completed_at: ["completed", "failed", "cancelled"].includes(next.status) ? new Date().toISOString() : null
    };
    if (existing[0]) {
      await supabaseRest<StemJobRow[]>("music_stem_jobs", { method: "PATCH", query: `id=eq.${existing[0].id}`, body });
    } else {
      await supabaseRest<StemJobRow[]>("music_stem_jobs", { method: "POST", body });
    }
  };

  const copyOutputsToCloud = async (next: Manifest, origin: string): Promise<number> => {
    if (!projectId || !cloudUser || !isCloudConfigured()) return 0;
    let count = 0;
    for (const stem of next.stems) {
      try {
        const url = stem.url.startsWith("http") ? stem.url : `${origin}${stem.url}`;
        const filename = stem.downloadName ?? `${stem.name}.wav`;
        const uploaded = await uploadPrivateUrl(projectId, url, filename, `agentic-stems/${next.jobId}`);
        await supabaseRest<MusicAssetRow[]>("music_assets", {
          method: "POST",
          body: {
            project_id: projectId,
            user_id: cloudUser.id,
            kind: "stem",
            label: `${stem.label ?? stem.name} · Agent ${stem.technicalQa?.score ?? "—"}`,
            storage_path: uploaded.path,
            original_name: uploaded.file.name,
            mime_type: uploaded.file.type || "audio/wav",
            byte_size: uploaded.file.size,
            duration_sec: next.durationSec
          }
        });
        count += 1;
      } catch {
        // Preserve every successful cloud copy even if a single generated file expires.
      }
    }
    setCloudSaved(count);
    return count;
  };

  const finishJob = async (session: WorkerSession, completed: JobState, orchestration?: string | null): Promise<void> => {
    const origin = session.worker.origin;
    const [manifestResponse, reportResponse] = await Promise.all([
      fetch(`${origin}/agent/jobs/${completed.jobId}/manifest`, { headers: authHeaders(session.token), cache: "no-store" }),
      fetch(`${origin}/agent/jobs/${completed.jobId}/report`, { headers: authHeaders(session.token), cache: "no-store" })
    ]);
    if (!manifestResponse.ok) throw new Error("The worker completed but the stem manifest could not be loaded.");
    const nextManifest = await manifestResponse.json() as Manifest;
    const nextReport = reportResponse.ok ? await reportResponse.json() as Record<string, unknown> : null;
    setManifest(nextManifest);
    setReport(nextReport);
    setResultOrigin(origin);
    const mixable = nextManifest.stems.filter((stem) => stem.mixable);
    if (mixable.length) await player.loadStems(origin, mixable);
    setMessage("Agent job complete. Copying generated stems into the private project library…");
    const saved = await copyOutputsToCloud(nextManifest, origin);
    await persistJob(completed, nextManifest.agentPlan, nextManifest, nextReport ?? undefined, session.worker, orchestration);
    setMessage(`Complete · ${nextManifest.stems.length} outputs · ${saved} copied to private cloud storage · ${nextManifest.qualitySummary.review} flagged for review.`);
    void mesh.refreshReadiness();
  };

  const recoverCloudExecution = async (previous: WorkerSession, orchestration: string): Promise<void> => {
    setMessage(`Execution lease expired on ${previous.worker.nodeId}. Routing the durable source to another worker…`);
    const nextSession = await mesh.acquire({
      orchestrationId: orchestration,
      excludeNodeId: previous.worker.nodeId,
      strategy,
      instruction,
      targets
    });
    const workerHealth = await mesh.probeWorker(nextSession.worker.origin);
    if (!workerHealth?.status || workerHealth.status !== "ok") {
      throw new Error("Replacement worker stopped responding before recovery could start.");
    }
    const response = await fetch(`${nextSession.worker.origin}/agent/jobs/cloud`, {
      method: "POST",
      headers: { ...authHeaders(nextSession.token), "Content-Type": "application/json" },
      body: JSON.stringify({ orchestrationId: orchestration })
    });
    const body = await response.json().catch(() => ({})) as JobState & { detail?: string };
    if (!response.ok) throw new Error(body.detail ?? `Cross-node recovery failed (${response.status}).`);
    setActiveSession(nextSession);
    setRecoveryGeneration(body.recoveryGeneration ?? recoveryGeneration + 1);
    setJob(body);
    await persistJob(body, undefined, undefined, undefined, nextSession.worker, orchestration).catch(() => undefined);
    setMessage(`Recovered on ${nextSession.worker.nodeId} · generation ${body.recoveryGeneration ?? recoveryGeneration + 1}. Replaying from durable private source…`);
    await pollJob(nextSession, body.jobId, orchestration);
  };

  const pollJob = async (session: WorkerSession, jobId: string, orchestration?: string | null): Promise<void> => {
    stopPolling.current = false;
    let lastProgress = -1;
    while (!stopPolling.current) {
      try {
        const response = await fetch(`${session.worker.origin}/agent/jobs/${jobId}`, { headers: authHeaders(session.token), cache: "no-store" });
        const body = await response.json().catch(() => ({})) as JobState & { detail?: string };
        if (!response.ok) throw new Error(body.detail ?? `Worker status failed (${response.status}).`);
        setJob(body);
        setMessage(`${body.stage.replaceAll("-", " ")} · ${body.progress}% · ${session.worker.nodeId}${recoveryGeneration ? ` · recovery ${recoveryGeneration}` : ""}`);
        if (body.progress !== lastProgress) {
          lastProgress = body.progress;
          await persistJob(body, undefined, undefined, undefined, session.worker, orchestration).catch(() => undefined);
        }
        if (body.status === "completed") {
          await finishJob(session, body, orchestration);
          return;
        }
        if (body.status === "failed" || body.status === "cancelled") {
          await persistJob(body, undefined, undefined, undefined, session.worker, orchestration).catch(() => undefined);
          throw new Error(body.error ?? `Stem job ${body.status}.`);
        }
        await sleep(1500);
      } catch (error) {
        if (!orchestration || !projectId || !cloudUser) throw error;
        const cloud = await loadCloudJob(orchestration).catch(() => null);
        if (!cloud) throw error;
        setJob((current) => current ? { ...current, progress: cloud.progress, stage: cloud.stage ?? current.stage } : current);
        if (cloud.status === "failed" || cloud.status === "cancelled") {
          throw new Error(cloud.error ?? `Cloud orchestration ${cloud.status}.`);
        }
        if (cloud.status === "completed") {
          throw new Error("The cloud record says this execution completed, but its worker is unreachable before result handoff. The source remains durable; run recovery to regenerate the outputs on another node.");
        }
        const leaseExpires = cloud.worker_lease_expires_at ? Date.parse(cloud.worker_lease_expires_at) : 0;
        if (leaseExpires > Date.now()) {
          setMessage(`Lost direct contact with ${session.worker.nodeId}, but its cloud lease is still alive · ${cloud.progress}% · ${cloud.stage ?? "running"}.`);
          await sleep(5000);
          continue;
        }
        await recoverCloudExecution(session, orchestration);
        return;
      }
    }
  };

  const startJob = async (): Promise<void> => {
    if (!sourceFile) { fileRef.current?.click(); return; }
    setBusy(true);
    setManifest(null);
    setReport(null);
    setResultOrigin(null);
    setCloudSaved(0);
    setRecoveryGeneration(0);
    try {
      const canCloudRecover = Boolean(projectId && cloudUser && isCloudConfigured());
      if (canCloudRecover) {
        setMessage(sourceCloudPath ? "Using durable private project source…" : `Staging ${sourceFile.name} in private cloud storage before compute…`);
        const staged = await stageCloudSource();
        setMessage(`Finding the best ${mode === "deep" ? "Deep GPU" : "Core"} worker for cloud orchestration…`);
        const session = await mesh.acquire({ orchestrationId: staged.orchestrationId, strategy, instruction, targets });
        setActiveSession(session);
        const workerHealth = await mesh.probeWorker(session.worker.origin);
        if (!workerHealth?.status || workerHealth.status !== "ok") throw new Error("The selected worker stopped responding before source claim. Try again to route to another node.");
        if (mode === "deep" && (!workerHealth.samAudio.installed || !workerHealth.samAudio.cudaAvailable)) {
          throw new Error("The selected node does not currently have CUDA + SAM-Audio ready. Try again to route to another Deep worker.");
        }
        setMessage(`Claiming durable source on ${session.worker.nodeId}…`);
        const response = await fetch(`${session.worker.origin}/agent/jobs/cloud`, {
          method: "POST",
          headers: { ...authHeaders(session.token), "Content-Type": "application/json" },
          body: JSON.stringify({ orchestrationId: staged.orchestrationId })
        });
        const body = await response.json().catch(() => ({})) as JobState & { detail?: string };
        if (!response.ok) throw new Error(body.detail ?? `Cloud job submission failed (${response.status}).`);
        setJob(body);
        await persistJob(body, undefined, undefined, undefined, session.worker, staged.orchestrationId).catch(() => undefined);
        await pollJob(session, body.jobId, staged.orchestrationId);
        return;
      }

      setMessage(`Finding the best ${mode === "deep" ? "Deep GPU" : "Core"} worker…`);
      const session = await mesh.acquire({ strategy, instruction, targets });
      setActiveSession(session);
      const workerHealth = await mesh.probeWorker(session.worker.origin);
      if (!workerHealth?.status || workerHealth.status !== "ok") throw new Error("The selected worker stopped responding before upload. Try again to route to another node.");
      if (mode === "deep" && (!workerHealth.samAudio.installed || !workerHealth.samAudio.cudaAvailable)) {
        throw new Error("The selected node does not currently have CUDA + SAM-Audio ready. Try again to route to another Deep worker.");
      }
      const form = new FormData();
      form.append("file", sourceFile);
      form.append("mode", mode);
      form.append("strategy", strategy);
      form.append("instruction", instruction);
      form.append("targets", JSON.stringify(targets));
      if (projectId) form.append("project_id", projectId);
      setMessage(`Uploading ${sourceFile.name} directly to ${session.worker.nodeId}…`);
      const response = await fetch(`${session.worker.origin}/agent/jobs`, { method: "POST", headers: authHeaders(session.token), body: form });
      const body = await response.json().catch(() => ({})) as JobState & { detail?: string };
      if (!response.ok) throw new Error(body.detail ?? `Job submission failed (${response.status}).`);
      setJob(body);
      await persistJob(body, undefined, undefined, undefined, session.worker, null).catch(() => undefined);
      await pollJob(session, body.jobId, null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unexpected Agentic Stem error.");
      void mesh.refreshReadiness();
    } finally {
      setBusy(false);
    }
  };

  const refine = async (): Promise<void> => {
    if (!job || !activeSession) return;
    setBusy(true);
    try {
      const response = await fetch(`${activeSession.worker.origin}/agent/jobs/${job.jobId}/refine`, {
        method: "POST",
        headers: { ...authHeaders(activeSession.token), "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, strategy, targets })
      });
      const body = await response.json().catch(() => ({})) as JobState & { detail?: string };
      if (!response.ok) throw new Error(body.detail ?? "Could not start refinement job.");
      setManifest(null);
      setReport(null);
      setResultOrigin(null);
      setJob(body);
      await persistJob(body, undefined, undefined, undefined, activeSession.worker, null).catch(() => undefined);
      await pollJob(activeSession, body.jobId, null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Refinement failed.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (): Promise<void> => {
    if (!job || !activeSession || !["queued", "running", "cancelling"].includes(job.status)) return;
    await fetch(`${activeSession.worker.origin}/agent/jobs/${job.jobId}`, { method: "DELETE", headers: authHeaders(activeSession.token) }).catch(() => undefined);
    setMessage("Cancellation requested. The active model step will finish before the worker stops.");
  };

  const applyPreset = (name: keyof typeof PRESETS): void => {
    setMode("deep");
    setTargets([...PRESETS[name]]);
    setStrategy(name === "vocals" ? "vocal-suite" : name === "drums" ? "drum-suite" : name === "beat" ? "beat-rebuild" : name === "instruments" ? "instrument-suite" : "auto");
  };

  const toggleTarget = (id: string): void => setTargets((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const healthTitle = online
    ? `Worker online · ${activeSession?.worker.nodeId ?? "mesh"}`
    : fleetReady
      ? "Worker Mesh available"
      : mesh.readiness?.capabilities.controlPlaneReady
        ? "Control plane ready · compute pending"
        : "Stem system degraded";
  const healthDetail = online
    ? `${health?.version ?? activeSession?.worker.version ?? "worker"} · ${health?.coreModel ?? "Core 6"}`
    : mesh.readiness?.nextAction ?? "Discovering Worker Mesh…";

  return (
    <main className="agentPage">
      <header className="agentTopbar">
        <Link href={projectId ? `/?projectId=${projectId}` : "/"} className="agentBrand"><span>JO₵YN</span> Stem Director</Link>
        <nav><Link href={projectId ? `/dashboard?projectId=${projectId}` : "/dashboard"}>Dashboard</Link><Link href="/stem-agent/status">Ops</Link><Link href={projectId ? `/stem-studio?projectId=${projectId}` : "/stem-studio"}>Classic Stem Studio</Link></nav>
      </header>

      <section className="agentHero">
        <div><p className="eyebrow">Agentic production system · Resilient Worker Mesh v3.12</p><h1>Tell it what you need.<br/><span>It survives the worker.</span></h1><p>The Stem Director stages project audio privately before compute, discovers available nodes, coordinates Core 6 + hierarchical deep isolation, and can replay the same cloud orchestration on another worker after a real lease failure.</p></div>
        <div className="healthCard">
          <span className={`dot ${online || fleetReady ? "online" : ""}`} />
          <div><strong>{healthTitle}</strong><small>{healthDetail}</small></div>
          <div className="healthGrid">
            <span>Nodes<strong>{fleetSummary?.readyNodes ?? (online ? 1 : 0)}</strong></span>
            <span>Recovery<strong>{cloudRecoveryReady ? "CLOUD" : projectId ? "PENDING" : "DIRECT"}</strong></span>
            <span>GPU<strong>{health?.samAudio.cudaAvailable ? "CUDA" : activeSession?.worker.gpu ?? "—"}</strong></span>
          </div>
        </div>
      </section>

      <section className="agentGrid">
        <div className="panel directorPanel">
          <div className="panelHead"><div><p className="eyebrow">01 · Direction</p><h2>Production goal</h2></div><span className="projectChip">{project?.title ?? "Standalone session"}</span></div>
          <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={5} placeholder="Example: Give me the cleanest lead vocal possible, separate the ad-libs/backgrounds, then pull kick, snare and 808 for a remix." />
          <div className="strategyGrid">
            {strategies.map(([id, label, detail]) => <button key={id} className={strategy === id ? "strategy active" : "strategy"} onClick={() => setStrategy(id)}><strong>{label}</strong><span>{detail}</span></button>)}
          </div>
          <div className="modeRow"><button className={mode === "core" ? "active" : ""} onClick={() => setMode("core")}>Core 6</button><button className={mode === "deep" ? "active" : ""} onClick={() => setMode("deep")}>Agentic Deep</button></div>
        </div>

        <aside className="panel sourcePanel">
          <p className="eyebrow">02 · Source</p><h2>{sourceName}</h2><p className="muted">{sourceFile ? `${(sourceFile.size / 1024 / 1024).toFixed(1)} MB · ${projectId && cloudUser ? "durable cloud ingress" : "direct worker upload"}` : "Use the song already attached to this project or select a new audio file."}</p>
          <button className="primary" onClick={() => fileRef.current?.click()}>Choose source audio</button>
          <input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) { setSourceFile(file); setSourceName(file.name); setSourceCloudPath(null); } }} />
          <div className="presetRow"><button onClick={() => applyPreset("vocals")}>Vocals</button><button onClick={() => applyPreset("drums")}>Drums</button><button onClick={() => applyPreset("beat")}>Beat</button><button onClick={() => applyPreset("instruments")}>Instruments</button></div>
          <button className="launch" onClick={() => void startJob()} disabled={busy || !sourceFile}>{busy ? "Agents working…" : "Launch Stem Director"}</button>
          {job && ["queued", "running", "cancelling"].includes(job.status) && <button className="danger" onClick={() => void cancel()}>Cancel job</button>}
          <p className="statusLine">{message}</p>
        </aside>
      </section>

      <section className="panel targetsPanel">
        <div className="panelHead"><div><p className="eyebrow">03 · Optional manual targets</p><h2>{targets.length ? `${targets.length} targets selected` : "Let the director choose"}</h2></div><button className="ghost" onClick={() => setTargets([])}>Clear manual targets</button></div>
        <div className="targetGroups">
          {groupedTargets.map(({ group, items }) => <div key={group} className="targetGroup"><h3>{group}</h3><div>{items.map((target) => <button key={target.id} className={targets.includes(target.id) ? "target active" : "target"} onClick={() => toggleTarget(target.id)}>{target.label}</button>)}</div></div>)}
        </div>
      </section>

      {job && <section className="panel runPanel">
        <div className="runHeader"><div><p className="eyebrow">04 · Live agent run</p><h2>{job.stage.replaceAll("-", " ")}</h2></div><strong>{job.progress}%</strong></div>
        <div className="progress"><span style={{ width: `${job.progress}%` }} /></div>
        {activeSession && <div className="plan"><div><strong>Worker Mesh</strong><p>{activeSession.worker.nodeId} · {activeSession.worker.gpu ?? "Core node"} · load {activeSession.worker.load.current}/{activeSession.worker.load.capacity}</p></div><div className="planTargets"><span>{activeSession.worker.source}</span><span>{orchestrationId ? `cloud job ${orchestrationId.slice(0, 8)}` : "direct session"}</span>{recoveryGeneration > 0 && <span>recovery {recoveryGeneration}</span>}</div></div>}
        {job.plan && <div className="plan"><div><strong>{job.plan.planner ?? "Planner"}</strong><p>{job.plan.reasoning?.join(" ")}</p></div><div className="planTargets">{job.plan.targets?.slice(0, 18).map((id) => <span key={id}>{STEM_TARGETS.find((target) => target.id === id)?.label ?? id}</span>)}</div></div>}
        <div className="timeline">{events.slice().reverse().map((event, index) => <article key={`${event.at}-${index}`}><span>{event.agent}</span><div><strong>{event.message}</strong><small>{new Date(event.at).toLocaleTimeString()}</small></div></article>)}</div>
      </section>}

      {manifest && <section className="resultsGrid">
        <div className="panel mixerPanel">
          <div className="panelHead"><div><p className="eyebrow">05 · Core mixer</p><h2>Synchronized Core 6</h2></div><div className="mixerActions"><button onClick={player.play}>Play</button><button onClick={player.stop}>Stop</button><button onClick={player.karaoke}>Karaoke</button><button onClick={player.acapella}>Acapella</button></div></div>
          <div className="channels">{player.stems.map((stem) => <div className="channel" key={stem.name}><strong>{stem.name}</strong><input type="range" min="0" max="1.25" step="0.01" value={stem.gain} onChange={(event) => player.setGain(stem.name, Number(event.target.value))}/><button className={stem.muted ? "active" : ""} onClick={() => player.setMuted(stem.name, !stem.muted)}>M</button><button className={stem.solo ? "active" : ""} onClick={() => player.setSolo(stem.name, !stem.solo)}>S</button></div>)}</div>
        </div>
        <aside className="panel scorePanel"><p className="eyebrow">Quality control</p><h2>{manifest.qualitySummary.stemCount} outputs</h2><div className="scoreGrid"><span>Excellent<strong>{manifest.qualitySummary.excellent}</strong></span><span>Good<strong>{manifest.qualitySummary.good}</strong></span><span>Review<strong>{manifest.qualitySummary.review}</strong></span><span>Cloud<strong>{cloudSaved}</strong></span></div>{resultOrigin && <a className="primary download" href={`${resultOrigin}${manifest.zipUrl}`}>Download organized pack</a>}<button className="ghost full" onClick={() => void refine()} disabled={busy || !activeSession}>Refine from same source</button></aside>
      </section>}

      {manifest && <section className="panel outputsPanel"><div className="panelHead"><div><p className="eyebrow">06 · Generated assets</p><h2>Agent-reviewed stems</h2></div><span>{manifest.failedTargets.length} failed targets</span></div><div className="outputs">{manifest.stems.map((stem) => <article key={`${stem.group}-${stem.name}`}><div><span className="family">{stem.family}</span><h3>{stem.label ?? stem.name}</h3><p>{stem.engine}{stem.sourceLane ? ` · ${stem.sourceLane}` : ""}</p></div><div className="qa"><strong>{stem.technicalQa?.score ?? "—"}</strong><span>{stem.technicalQa?.grade ?? "QA"}</span></div><div className="outputActions">{resultOrigin && <><audio controls preload="none" src={`${resultOrigin}${stem.url}`} /><a href={`${resultOrigin}${stem.url}`} download={stem.downloadName}>WAV</a></>}</div>{stem.technicalQa?.reasons?.length ? <small>{stem.technicalQa.reasons.join(" · ")}</small> : <small>Technical integrity passed. Isolation quality should still be judged by ear.</small>}</article>)}</div></section>}

      {report && <section className="panel reportPanel"><p className="eyebrow">07 · Agent report</p><h2>Decision trail preserved</h2><p>The full plan, source measurements, routing lane, retry decisions, recovery generation, quality summary and failures are bundled with the stem pack and persisted with the project job record.</p><pre>{JSON.stringify(report, null, 2)}</pre></section>}
    </main>
  );
}
