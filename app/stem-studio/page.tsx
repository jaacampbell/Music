"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { ProducerDnaPanel } from "./ProducerDnaPanel";
import { useRealStemPlayer, type StemInfo } from "./useRealStemPlayer";

const SEPARATOR_URL =
  process.env.NEXT_PUBLIC_SEPARATOR_URL ?? "http://localhost:8000";

interface Manifest {
  jobId: string;
  source: { filename: string };
  model: string;
  sampleRate: number;
  durationSec: number;
  stems: StemInfo[];
  alignment: { reconErrorDb: number; note: string };
  warnings: string[];
}

export default function StemStudioPage(): React.JSX.Element {
  const player = useRealStemPlayer();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready — separate a track to begin.");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleManifest = async (m: Manifest): Promise<void> => {
    setManifest(m);
    setStatus(`Separated ${m.stems.length} stems with ${m.model}. Loading audio…`);
    await player.loadStems(SEPARATOR_URL, m.stems);
    setStatus(
      `Ready: ${m.model} · ${m.durationSec}s · recon error ${m.alignment.reconErrorDb} dB`
    );
  };

  const separateDemo = async (): Promise<void> => {
    setBusy(true);
    setStatus("Running real Demucs separation on the demo mixture…");
    try {
      const res = await fetch(`${SEPARATOR_URL}/separate/demo`, { method: "POST" });
      if (!res.ok) throw new Error(`separate failed (${res.status})`);
      await handleManifest((await res.json()) as Manifest);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const separateUpload = async (file: File): Promise<void> => {
    setBusy(true);
    setStatus(`Uploading ${file.name} and separating (real Demucs, may take a while)…`);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${SEPARATOR_URL}/separate`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`separate failed (${res.status})`);
      await handleManifest((await res.json()) as Manifest);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const dbFor = (name: string): number | undefined =>
    manifest?.stems.find((s) => s.name === name)?.integratedDb;

  return (
    <main className="page">
      <header className="header">
        <h1>Stem Studio (live)</h1>
        <p>
          Real Demucs stem separation ·{" "}
          <Link href="/" style={{ color: "var(--accent)" }}>
            ← Command center
          </Link>
        </p>
      </header>

      <section className="controls">
        <div>
          <p className="meta" style={{ marginTop: 0 }}>
            Separate a track into real <b>vocals / drums / bass / other</b> WAVs, then mix
            them live. Backend: <span className="mono">{SEPARATOR_URL}</span>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void separateUpload(f);
            }}
          />
        </div>
        <div className="buttons">
          <button onClick={() => void separateDemo()} disabled={busy}>
            Separate demo track
          </button>
          <button
            className="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            Upload audio…
          </button>
        </div>
      </section>

      <section className="layout" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel main">
          <h3 style={{ marginTop: 0 }}>Mixer (real stems)</h3>
          {player.stems.length === 0 && (
            <p className="meta">Separate a track to load the real 4-stem mixer.</p>
          )}
          {player.stems.length > 0 && (
            <>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem", flexWrap: "wrap" }}>
                <button onClick={player.play} style={btn(true)} disabled={player.isLoading}>
                  ▶ Play
                </button>
                <button onClick={player.stop} style={btn(false)}>
                  ⏹ Stop
                </button>
                <button onClick={player.karaoke} style={btn(false)}>
                  🎤 Karaoke
                </button>
                <button onClick={player.acapella} style={btn(false)}>
                  🎙 Acapella
                </button>
                <button onClick={player.reset} style={btn(false)}>
                  ↺ Reset
                </button>
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {player.stems.map((ui) => (
                  <div className="card" key={ui.name}>
                    <h3 style={{ textTransform: "capitalize" }}>{ui.name}</h3>
                    <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                      <button
                        onClick={() => player.setSolo(ui.name, !ui.solo)}
                        style={pill(ui.solo, "#e0a83a")}
                      >
                        Solo
                      </button>
                      <button
                        onClick={() => player.setMuted(ui.name, !ui.muted)}
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
                      onChange={(e) => player.setGain(ui.name, Number(e.target.value))}
                      style={{ width: "100%" }}
                      aria-label={`${ui.name} gain`}
                    />
                    <div className="mono" style={{ marginTop: "0.4rem" }}>
                      {dbFor(ui.name) ?? "—"} dB {ui.loaded ? "· loaded" : "· …"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="panel main">
          <h3 style={{ marginTop: 0 }}>Separation manifest</h3>
          {!manifest && <p className="meta">No separation yet.</p>}
          {manifest && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <div className="card">
                <h3>Source · {manifest.model}</h3>
                <div className="mono">
                  {manifest.source.filename}
                  {"\n"}
                  {manifest.durationSec}s · {manifest.sampleRate / 1000} kHz · job {manifest.jobId}
                </div>
              </div>
              <div className="card">
                <h3>Alignment</h3>
                <div className="meta">
                  Recon error {manifest.alignment.reconErrorDb} dB — {manifest.alignment.note}
                </div>
              </div>
              <div className="card">
                <h3>Notes</h3>
                <ul className="list">
                  {manifest.warnings.map((w) => (
                    <li key={w} className="meta">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
        <ProducerDnaPanel trackName={manifest?.source.filename} />
      </section>

      <div className="status">{busy || player.isLoading ? "Working…" : status}</div>
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
