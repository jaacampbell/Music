"use client";

import Link from "next/link";
import { useState } from "react";

import { STEM_NAMES, type StemName, type StemProject } from "@/lib/stem-extraction/types";
import { useStemPlayer } from "./useStemPlayer";

const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
};

export default function StemLabPage(): React.JSX.Element {
  const player = useStemPlayer();
  const [filename, setFilename] = useState("late-night-demo.mp3");
  const [durationSec, setDurationSec] = useState(174);
  const [project, setProject] = useState<StemProject | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready");

  const ready = project?.status === "separated" || project?.status === "exported";

  const runExtraction = async (): Promise<void> => {
    setBusy(true);
    try {
      const created = await api<{ project: StemProject }>(
        "/api/stem-extraction/projects",
        { method: "POST", body: JSON.stringify({ filename, durationSec }) }
      );
      const separated = await api<{ project: StemProject }>(
        `/api/stem-extraction/projects/${created.project.id}/separate`,
        { method: "POST", body: JSON.stringify({}) }
      );
      setProject(separated.project);
      const a = separated.project.manifest.analysis;
      setStatus(
        `Separated 4 stems · ${a ? `${a.bpm} BPM, ${a.key}` : ""} · alignment ${
          separated.project.manifest.separation.alignment?.passed ? "passed" : "FAILED"
        }`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const exportZip = async (): Promise<void> => {
    if (!project) return;
    setBusy(true);
    try {
      const data = await api<{ project: StemProject; export: { files: string[] } }>(
        `/api/stem-extraction/projects/${project.id}/exports`,
        { method: "POST", body: JSON.stringify({ target: "universal_stem_pack_zip" }) }
      );
      setProject(data.project);
      setStatus(`Export ready: universal_stem_pack_zip (${data.export.files.length} files)`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const mixdown = async (kind: "karaoke" | "acapella"): Promise<void> => {
    if (!project) return;
    if (kind === "karaoke") player.karaoke();
    else player.acapella();
    setBusy(true);
    try {
      const data = await api<{ project: StemProject; export: { target: string } }>(
        `/api/stem-extraction/projects/${project.id}/mixdowns`,
        { method: "POST", body: JSON.stringify({ kind }) }
      );
      setProject(data.project);
      setStatus(`Mixdown created: ${data.export.target}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const manifest = project?.manifest;

  const stemMeta = (name: StemName) =>
    manifest?.stems.find((stem) => stem.name === name);

  return (
    <main className="page">
      <header className="header">
        <h1>Stem Lab</h1>
        <p>
          Phase 1 stem extraction + DAW export ·{" "}
          <Link href="/" style={{ color: "var(--accent)" }}>
            ← Command center
          </Link>
        </p>
      </header>

      <section className="controls">
        <div>
          <input
            value={filename}
            onChange={(event) => setFilename(event.target.value)}
            placeholder="Source filename (wav/mp3/flac/aiff/m4a/mp4)"
          />
          <div style={{ marginTop: "0.6rem" }}>
            <label className="meta">Duration (s): </label>
            <input
              type="number"
              min={5}
              max={3600}
              value={durationSec}
              onChange={(event) => setDurationSec(Number(event.target.value))}
              style={{ width: 120 }}
            />
          </div>
        </div>
        <div className="buttons">
          <button onClick={() => void runExtraction()} disabled={busy}>
            Run Stem Extraction
          </button>
          <button
            className="secondary"
            onClick={() => void exportZip()}
            disabled={busy || !ready}
          >
            Export WAV ZIP
          </button>
        </div>
      </section>

      <section className="layout" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel main">
          <h3 style={{ marginTop: 0 }}>Mixer</h3>
          {!ready && (
            <p className="meta">Run stem extraction to load the 4-stem mixer.</p>
          )}
          {ready && (
            <>
              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.8rem", flexWrap: "wrap" }}>
                <button className="buttons" onClick={player.toggle} style={btn(true)}>
                  {player.isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
                <button onClick={() => void mixdown("karaoke")} style={btn(false)} disabled={busy}>
                  🎤 Karaoke
                </button>
                <button onClick={() => void mixdown("acapella")} style={btn(false)} disabled={busy}>
                  🎙 Acapella
                </button>
                <button onClick={player.resetMix} style={btn(false)}>
                  ↺ Reset mix
                </button>
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {STEM_NAMES.map((name) => {
                  const ui = player.stems[name];
                  const meta = stemMeta(name);
                  return (
                    <div className="card" key={name}>
                      <h3 style={{ textTransform: "capitalize" }}>{name}</h3>
                      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                        <button
                          onClick={() => player.setSolo(name, !ui.solo)}
                          style={pill(ui.solo, "#e0a83a")}
                        >
                          Solo
                        </button>
                        <button
                          onClick={() => player.setMuted(name, !ui.muted)}
                          style={pill(ui.muted, "#e05a5a")}
                        >
                          Mute
                        </button>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={ui.gain}
                        onChange={(event) => player.setGain(name, Number(event.target.value))}
                        style={{ width: "100%" }}
                        aria-label={`${name} gain`}
                      />
                      {meta && (
                        <div className="mono" style={{ marginTop: "0.4rem" }}>
                          {meta.file}
                          {"\n"}
                          {meta.integratedLufs} LUFS · conf {(meta.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="panel main">
          <h3 style={{ marginTop: 0 }}>Manifest</h3>
          {!manifest && <p className="meta">No project yet.</p>}
          {manifest && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <div className="card">
                <h3>Source</h3>
                <div className="mono">
                  {manifest.source.filename}
                  {"\n"}
                  {manifest.source.durationSec}s · {manifest.source.sampleRate / 1000} kHz ·{" "}
                  {manifest.source.bitDepth}-bit · {manifest.source.channels}ch
                  {"\n"}
                  peak {manifest.source.peakDb} dB · {manifest.source.integratedLufs} LUFS
                  {"\n"}
                  sha256 {manifest.source.sha256.slice(0, 16)}…
                </div>
              </div>
              <div className="card">
                <h3>Analysis</h3>
                {manifest.analysis ? (
                  <div className="meta">
                    BPM {manifest.analysis.bpm} (conf{" "}
                    {(manifest.analysis.bpmConfidence * 100).toFixed(0)}%) · Key{" "}
                    {manifest.analysis.key} (conf{" "}
                    {(manifest.analysis.keyConfidence * 100).toFixed(0)}%)
                  </div>
                ) : (
                  <span className="meta">Pending.</span>
                )}
              </div>
              <div className="card">
                <h3>Separation · {manifest.separation.model}</h3>
                {manifest.separation.alignment && (
                  <div className="meta" style={{ marginBottom: "0.4rem" }}>
                    Alignment:{" "}
                    {manifest.separation.alignment.passed ? "✅ passed" : "❌ failed"} · sum RMS
                    error {manifest.separation.alignment.sumRmsErrorDb} dB (threshold{" "}
                    {manifest.separation.alignment.thresholdDb} dB)
                  </div>
                )}
                <ul className="list">
                  {manifest.separation.warnings.map((warning) => (
                    <li key={warning} className="meta">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
              {project && project.exports.length > 0 && (
                <div className="card">
                  <h3>Exports</h3>
                  <ul className="list">
                    {project.exports.map((artifact) => (
                      <li key={artifact.id} className="meta">
                        {artifact.target} ({artifact.files.length} files)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </section>

      <div className="status">{busy ? "Working..." : status}</div>
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
