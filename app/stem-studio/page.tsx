"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ProducerDnaPanel } from "./ProducerDnaPanel";
import { PRESETS, STEM_GROUPS, STEM_TARGETS } from "./catalog";
import { useRealStemPlayer, type StemInfo } from "./useRealStemPlayer";

const SEPARATOR_URL =
  process.env.NEXT_PUBLIC_SEPARATOR_URL ?? "http://localhost:8000";

interface WorkerHealth {
  status: string;
  version: string;
  coreModel: string;
  deepTargetCount: number;
  samAudio: {
    installed: boolean;
    model: string;
    cudaAvailable: boolean;
    hfTokenPresent: boolean;
  };
}

interface FailedTarget {
  id: string;
  error: string;
}

interface Manifest {
  jobId: string;
  source: { filename: string };
  model: string;
  mode: "core" | "deep";
  sampleRate: number;
  durationSec: number;
  stems: StemInfo[];
  requestedTargets: string[];
  failedTargets: FailedTarget[];
  alignment: { reconErrorDb: number; note: string };
  warnings: string[];
  engines: { core: string; deep: string };
  zipUrl?: string;
  organization?: {
    root: string;
    strategy: string;
    families: string[];
  };
}

export default function StemStudioPage(): React.JSX.Element {
  const player = useRealStemPlayer();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [mode, setMode] = useState<"core" | "deep">("deep");
  const [selectedTargets, setSelectedTargets] = useState<string[]>(PRESETS.vocals);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready — choose stems and upload a track.");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`${SEPARATOR_URL}/health`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`health failed (${res.status})`);
        return (await res.json()) as WorkerHealth;
      })
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleManifest = async (m: Manifest): Promise<void> => {
    setManifest(m);
    const mixable = m.stems.filter((stem) => stem.mixable);
    setStatus(
      `Separated ${m.stems.length} outputs. Loading ${mixable.length} non-overlapping core stems into the mixer…`
    );
    await player.loadStems(SEPARATOR_URL, mixable);
    const deepCount = m.stems.filter((stem) => stem.group !== "Core 6").length;
    setStatus(
      `Ready · ${m.model} core · ${deepCount} deep target${deepCount === 1 ? "" : "s"} · organized by name and family · recon ${m.alignment.reconErrorDb} dB`
    );
  };

  const parseError = async (res: Response): Promise<string> => {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    return body.detail ?? `separation failed (${res.status})`;
  };

  const separateDemo = async (): Promise<void> => {
    setBusy(true);
    setStatus("Running the Core 6 demo separation…");
    try {
      const res = await fetch(`${SEPARATOR_URL}/separate/demo`, { method: "POST" });
      if (!res.ok) throw new Error(await parseError(res));
      await handleManifest((await res.json()) as Manifest);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const separateUpload = async (file: File): Promise<void> => {
    setBusy(true);
    const targetCount = mode === "deep" ? selectedTargets.length : 0;
    setStatus(
      mode === "deep"
        ? `Uploading ${file.name}. Running Core 6 + ${targetCount} deep target${targetCount === 1 ? "" : "s"}…`
        : `Uploading ${file.name}. Running Core 6 separation…`
    );
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mode", mode);
      form.append("targets", JSON.stringify(mode === "deep" ? selectedTargets : []));
      const res = await fetch(`${SEPARATOR_URL}/separate`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await parseError(res));
      await handleManifest((await res.json()) as Manifest);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleTarget = (id: string): void => {
    setSelectedTargets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectPreset = (preset: keyof typeof PRESETS): void => {
    setSelectedTargets([...PRESETS[preset]]);
    setMode("deep");
  };

  const stemMeta = (name: string): StemInfo | undefined =>
    manifest?.stems.find((stem) => stem.name === name);

  const deepOutputs =
    manifest?.stems.filter((stem) => stem.group !== "Core 6") ?? [];
  const coreDownloads =
    manifest?.stems.filter((stem) => stem.group === "Core 6" && !stem.mixable) ?? [];
  const samReady = health?.samAudio.installed === true;
  const workerOnline = health?.status === "ok";

  return (
    <main className="page">
      <header className="header">
        <h1>Stem Studio · 60+ Separator</h1>
        <p>
          Core 6 mixing + text-prompt deep isolation ·{" "}
          <Link href="/" style={{ color: "var(--accent)" }}>
            ← Command center
          </Link>
        </p>
      </header>

      <section className="panel main" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={badge(workerOnline ? "#6ee7a8" : "#f2b36c")}>
            {workerOnline ? "● worker online" : "● worker not detected"}
          </span>
          <span style={badge(samReady ? "#6ee7a8" : "#f2b36c")}>
            {samReady ? "● SAM-Audio 60-target engine ready" : "● deep engine needs GPU worker"}
          </span>
          {health?.samAudio.cudaAvailable && <span style={badge("#6ee7a8")}>CUDA</span>}
          <span className="mono" style={{ fontSize: "0.78rem", opacity: 0.75 }}>
            {SEPARATOR_URL}
          </span>
        </div>
        <p className="meta" style={{ marginBottom: 0 }}>
          Every output is named for the detected/selected stem and filed under its vocal or instrument
          family. Core 6 stems are non-overlapping; deep isolates may overlap each other.
        </p>
      </section>

      <section className="controls" style={{ alignItems: "stretch" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <button onClick={() => setMode("core")} style={modeBtn(mode === "core")}>
              Core 6
            </button>
            <button onClick={() => setMode("deep")} style={modeBtn(mode === "deep")}>
              Deep 60+
            </button>
          </div>
          <p className="meta" style={{ margin: 0 }}>
            {mode === "core"
              ? "Vocals · Drums · Bass · Guitar · Piano · Other + Instrumental"
              : `${selectedTargets.length} deep targets selected + Core 6 base stems`}
          </p>
        </div>
        <div className="buttons">
          <button onClick={() => fileRef.current?.click()} disabled={busy || (mode === "deep" && selectedTargets.length === 0)}>
            Upload & Separate
          </button>
          <button className="secondary" onClick={() => void separateDemo()} disabled={busy}>
            Core 6 demo
          </button>
          {manifest?.zipUrl && (
            <a
              href={`${SEPARATOR_URL}${manifest.zipUrl}`}
              download="Stem_Studio_Organized_Stems.zip"
              style={{ ...btn(false), display: "inline-flex", alignItems: "center", textDecoration: "none" }}
            >
              Download Organized ZIP
            </a>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void separateUpload(file);
            }}
          />
        </div>
      </section>

      {manifest?.organization && (
        <section className="panel main" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Output organization</h3>
          <p className="meta">
            Folder strategy: <b>{manifest.organization.strategy}</b>. Your ZIP preserves these folders.
          </p>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            {manifest.organization.families.map((family) => (
              <span key={family} style={badge("var(--text)")}>{family}</span>
            ))}
          </div>
        </section>
      )}

      {mode === "deep" && (
        <section className="panel main" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: "0.25rem" }}>Choose deep stems</h3>
              <p className="meta" style={{ marginTop: 0 }}>
                {selectedTargets.length} of {STEM_TARGETS.length} selected. Each selection is a separate
                AI isolation pass.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignContent: "flex-start" }}>
              <button onClick={() => selectPreset("vocals")} style={presetBtn()}>Vocals</button>
              <button onClick={() => selectPreset("drums")} style={presetBtn()}>Drums</button>
              <button onClick={() => selectPreset("beat")} style={presetBtn()}>Beat</button>
              <button onClick={() => selectPreset("instruments")} style={presetBtn()}>Instruments</button>
              <button onClick={() => selectPreset("all")} style={presetBtn()}>All 60</button>
              <button onClick={() => setSelectedTargets([])} style={presetBtn()}>Clear</button>
            </div>
          </div>

          {selectedTargets.length > 12 && (
            <div className="status" style={{ marginBottom: "0.85rem" }}>
              Large deep jobs can take a long time because every selected target is isolated separately.
              Start with the stems you actually need when speed matters.
            </div>
          )}

          <div style={{ display: "grid", gap: "0.9rem" }}>
            {STEM_GROUPS.map((group) => (
              <div className="card" key={group}>
                <h3 style={{ marginTop: 0 }}>{group}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "0.45rem" }}>
                  {STEM_TARGETS.filter((target) => target.group === group).map((target) => {
                    const checked = selectedTargets.includes(target.id);
                    return (
                      <label key={target.id} style={targetCard(checked)}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTarget(target.id)}
                        />
                        <span>{target.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="layout" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel main">
          <h3 style={{ marginTop: 0 }}>Core 6 mixer</h3>
          {player.stems.length === 0 && (
            <p className="meta">Separate a track to load the synchronized non-overlapping mixer.</p>
          )}
          {player.stems.length > 0 && (
            <>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem", flexWrap: "wrap" }}>
                <button onClick={player.play} style={btn(true)} disabled={player.isLoading}>▶ Play</button>
                <button onClick={player.stop} style={btn(false)}>⏹ Stop</button>
                <button onClick={player.karaoke} style={btn(false)}>🎤 Instrumental</button>
                <button onClick={player.acapella} style={btn(false)}>🎙 Vocals only</button>
                <button onClick={player.reset} style={btn(false)}>↺ Reset</button>
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {player.stems.map((ui) => {
                  const meta = stemMeta(ui.name);
                  return (
                    <div className="card" key={ui.name}>
                      <h3 style={{ textTransform: "capitalize" }}>{meta?.label ?? ui.name}</h3>
                      <div className="meta" style={{ marginBottom: "0.5rem" }}>
                        {meta?.family ?? "Core 6"} · {meta?.file ?? ""}
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                        <button onClick={() => player.setSolo(ui.name, !ui.solo)} style={pill(ui.solo, "#e0a83a")}>Solo</button>
                        <button onClick={() => player.setMuted(ui.name, !ui.muted)} style={pill(ui.muted, "#e05a5a")}>Mute</button>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={ui.gain}
                        onChange={(event) => player.setGain(ui.name, Number(event.target.value))}
                        style={{ width: "100%" }}
                        aria-label={`${ui.name} gain`}
                      />
                      <div className="mono" style={{ marginTop: "0.4rem" }}>
                        {meta?.integratedDb ?? "—"} dB {ui.loaded ? "· loaded" : "· …"}
                      </div>
                    </div>
                  );
                })}
              </div>
              {coreDownloads.map((stem) => (
                <div className="card" key={stem.name} style={{ marginTop: "0.65rem" }}>
                  <strong>{stem.label ?? stem.name}</strong>{" "}
                  <span className="meta">({stem.family ?? "Mixdown"})</span>{" "}
                  <a
                    href={`${SEPARATOR_URL}${stem.url}`}
                    download={stem.downloadName ?? true}
                    style={{ color: "var(--accent)" }}
                  >
                    Download WAV
                  </a>
                </div>
              ))}
            </>
          )}
        </section>

        <section className="panel main">
          <h3 style={{ marginTop: 0 }}>Deep isolated outputs</h3>
          {!manifest && <p className="meta">No separation yet.</p>}
          {manifest && deepOutputs.length === 0 && (
            <p className="meta">
              No deep outputs were produced. {manifest.mode === "core" ? "This was a Core 6 job." : "Check the worker notes below."}
            </p>
          )}
          {deepOutputs.length > 0 && (
            <div style={{ display: "grid", gap: "0.7rem" }}>
              {STEM_GROUPS.map((group) => {
                const stems = deepOutputs.filter((stem) => stem.group === group);
                if (stems.length === 0) return null;
                return (
                  <div className="card" key={group}>
                    <h3 style={{ marginTop: 0 }}>{group}</h3>
                    <div style={{ display: "grid", gap: "0.65rem" }}>
                      {stems.map((stem) => (
                        <div key={stem.name} style={{ borderTop: "1px solid var(--line)", paddingTop: "0.55rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", alignItems: "baseline" }}>
                            <div>
                              <strong>{stem.label ?? stem.name}</strong>
                              <div className="meta">{stem.family ?? stem.group} · {stem.file}</div>
                            </div>
                            <a
                              href={`${SEPARATOR_URL}${stem.url}`}
                              download={stem.downloadName ?? true}
                              style={{ color: "var(--accent)", whiteSpace: "nowrap" }}
                            >
                              Download WAV
                            </a>
                          </div>
                          <div className="meta">{stem.integratedDb} dB · {stem.engine}</div>
                          <audio controls preload="none" src={`${SEPARATOR_URL}${stem.url}`} style={{ width: "100%", marginTop: "0.4rem" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {manifest && (
        <section className="panel main" style={{ marginTop: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Job manifest</h3>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <div className="card">
              <h3>Source</h3>
              <div className="mono">
                {manifest.source.filename}
                {"\n"}
                {manifest.durationSec}s · {manifest.sampleRate / 1000} kHz · job {manifest.jobId}
              </div>
            </div>
            <div className="card">
              <h3>Engines</h3>
              <div className="meta">
                Core: {manifest.engines.core}
                <br />
                Deep: {manifest.engines.deep}
              </div>
            </div>
            <div className="card">
              <h3>Alignment</h3>
              <div className="meta">
                Core recon error {manifest.alignment.reconErrorDb} dB
              </div>
            </div>
          </div>
          {manifest.failedTargets.length > 0 && (
            <div className="card" style={{ marginTop: "0.7rem" }}>
              <h3>Failed deep targets</h3>
              <ul className="list">
                {manifest.failedTargets.map((failure) => (
                  <li key={failure.id} className="meta">
                    {failure.id}: {failure.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="card" style={{ marginTop: "0.7rem" }}>
            <h3>Notes</h3>
            <ul className="list">
              {manifest.warnings.map((warning) => (
                <li key={warning} className="meta">{warning}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <ProducerDnaPanel trackName={manifest?.source.filename} />

      <div className="status">{busy || player.isLoading ? "Working… " : ""}{status}</div>
    </main>
  );
}

const btn = (primary: boolean): React.CSSProperties => ({
  background: primary ? "var(--accent)" : "#2f3548",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "0.5rem 0.85rem",
  cursor: "pointer"
});

const modeBtn = (active: boolean): React.CSSProperties => ({
  ...btn(active),
  background: active ? "var(--accent)" : "transparent",
  border: active ? "1px solid transparent" : "1px solid var(--line)"
});

const presetBtn = (): React.CSSProperties => ({
  background: "transparent",
  color: "var(--text)",
  border: "1px solid var(--line)",
  borderRadius: 999,
  padding: "0.35rem 0.65rem",
  cursor: "pointer"
});

const targetCard = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "0.45rem",
  padding: "0.55rem 0.65rem",
  borderRadius: 8,
  border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
  background: active ? "rgba(120, 124, 255, 0.12)" : "transparent",
  cursor: "pointer"
});

const badge = (color: string): React.CSSProperties => ({
  border: "1px solid var(--line)",
  borderRadius: 999,
  padding: "0.3rem 0.55rem",
  color
});

const pill = (active: boolean, activeColor: string): React.CSSProperties => ({
  flex: 1,
  padding: "0.35rem",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: active ? activeColor : "transparent",
  color: active ? "#0c0d10" : "var(--text)",
  fontWeight: active ? 700 : 400,
  cursor: "pointer"
});
