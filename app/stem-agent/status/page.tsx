"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import "./status.css";

type Probe = {
  ok: boolean;
  status?: number;
  latencyMs?: number;
  error?: string;
  data?: Record<string, unknown>;
};

type Readiness = {
  status: "ready" | "control-plane-ready" | "degraded";
  checkedAt: string;
  nextAction: string;
  configuration: { supabase: boolean; gatewaySecret: boolean; separatorUrl: boolean; workerMesh: boolean };
  services: { edgeMirror: Probe; workerFleet: Probe; artifactBroker: Probe; workerHealth: Probe; workerSystem: Probe; workerMirror: Probe };
  capabilities: {
    controlPlaneReady: boolean;
    computeReady: boolean;
    deepReady: boolean;
    cuda: boolean;
    samAudio: boolean;
    hierarchicalRouting: boolean;
    restartRecovery: boolean;
    cloudMirror: boolean;
    dynamicRouting: boolean;
    cloudRecovery: boolean;
  };
};

const labels: Record<keyof Readiness["services"], [string, string]> = {
  edgeMirror: ["Cloud lifecycle gateway", "Supabase Edge Function that receives signed worker job updates and renews active execution leases."],
  workerFleet: ["Worker Mesh registry", "Live heartbeats, capacity and Deep compatibility for all active compute nodes."],
  artifactBroker: ["Durable source broker", "HMAC-authorized execution leases and short-lived private source URLs for cross-node replay."],
  workerHealth: ["Static fallback worker", "Optional rollback worker URL; dynamic mesh routing does not require it."],
  workerSystem: ["Static agent orchestration", "Queue and recovery telemetry for the optional static fallback worker."],
  workerMirror: ["Static worker → cloud mirror", "Lifecycle mirror diagnostics for the optional static fallback worker."],
};

export default function StemAgentStatusPage(): React.JSX.Element {
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stem-agent/readiness", { cache: "no-store" });
      const body = await response.json() as Readiness & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `Readiness request failed (${response.status}).`);
      setData(body);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not load Stem Director readiness.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const capabilities = data ? [
    ["Control plane", data.capabilities.controlPlaneReady, "Netlify gateway + Supabase Edge services"],
    ["Dynamic routing", data.capabilities.dynamicRouting, "Worker Mesh discovery instead of a build-time URL"],
    ["Durable recovery", data.capabilities.cloudRecovery, "Private source + lease-controlled cross-node replay"],
    ["Compute", data.capabilities.computeReady, "At least one fresh worker with available capacity"],
    ["Agentic Deep", data.capabilities.deepReady, "At least one CUDA + SAM-Audio worker"],
    ["Hierarchical routing", data.capabilities.hierarchicalRouting, "Deep targets route through Core parent stems"],
    ["Restart recovery", data.capabilities.restartRecovery, "Persistent jobs can recover after same-node restart"],
    ["Cloud mirror", data.capabilities.cloudMirror, "Worker lifecycle sync into Music OS"],
  ] as const : [];

  return (
    <main className="opsPage">
      <header className="opsTopbar">
        <Link href="/stem-agent" className="opsBrand"><span>JO₵YN</span> Stem Director / Ops</Link>
        <nav><Link href="/stem-agent">Director</Link><Link href="/dashboard">Dashboard</Link></nav>
      </header>

      <section className="opsHero">
        <div><p className="opsEyebrow">Production control plane · Resilient Worker Mesh</p><h1>Know exactly what is <span>ready.</span></h1><p>Independent diagnostics for cloud orchestration, durable source recovery, fleet discovery and GPU compute—so a failed node does not have to become a lost job.</p></div>
        <button className="opsRefresh" onClick={() => void refresh()} disabled={loading}>{loading ? "Checking…" : "Run diagnostics"}</button>
      </section>

      {error && <section className="opsAlert bad"><strong>Readiness API failed</strong><span>{error}</span></section>}

      {data && <>
        <section className={`opsBanner ${data.status}`}>
          <div><span className="opsPulse"/><div><strong>{data.status === "ready" ? "System ready" : data.status === "control-plane-ready" ? "Control plane ready · compute pending" : "System degraded"}</strong><small>Checked {new Date(data.checkedAt).toLocaleString()}</small></div></div>
          <p>{data.nextAction}</p>
        </section>

        <section className="opsCapabilities">
          {capabilities.map(([label, ok, detail]) => <article key={label} className={ok ? "cap ready" : "cap pending"}><span>{ok ? "READY" : "PENDING"}</span><h2>{label}</h2><p>{detail}</p></article>)}
        </section>

        <section className="opsGrid">
          {(Object.keys(data.services) as Array<keyof Readiness["services"]>).map((key) => {
            const probe = data.services[key];
            const [label, detail] = labels[key];
            return <article className="serviceCard" key={key}>
              <div className="serviceHead"><span className={probe.ok ? "statusDot good" : "statusDot"}/><div><h2>{label}</h2><p>{detail}</p></div></div>
              <div className="serviceMeta"><span>{probe.ok ? "healthy" : "not ready"}</span>{typeof probe.latencyMs === "number" && <span>{probe.latencyMs} ms</span>}{probe.status && <span>HTTP {probe.status}</span>}</div>
              {probe.error && <div className="probeError">{probe.error}</div>}
              {probe.data && Object.keys(probe.data).length > 0 && <details><summary>Runtime details</summary><pre>{JSON.stringify(probe.data, null, 2)}</pre></details>}
            </article>;
          })}
        </section>

        <section className="opsConfig">
          <div><p className="opsEyebrow">Configuration boundary</p><h2>The project source lives beyond any one GPU.</h2><p>Project-linked runs stage source audio in private Supabase Storage before compute. Workers receive only a short-lived signed source URL after a lease claim; gateway/model credentials and permanent storage credentials remain inaccessible to browser code and GPU hosts.</p></div>
          <div className="configChecks"><span className={data.configuration.supabase ? "yes" : "no"}>Supabase</span><span className={data.configuration.gatewaySecret ? "yes" : "no"}>Gateway secret</span><span className={data.configuration.workerMesh ? "yes" : "no"}>Worker Mesh</span><span className={data.capabilities.cloudRecovery ? "yes" : "no"}>Cloud recovery</span><span className={data.configuration.separatorUrl ? "yes" : "no"}>Static fallback</span></div>
        </section>
      </>}
    </main>
  );
}
