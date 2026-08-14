"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useRealStemPlayer, type StemInfo } from "../stem-studio/useRealStemPlayer";
import "./stemLab.css";

const SEPARATOR_URL =
  process.env.NEXT_PUBLIC_SEPARATOR_URL ?? "http://localhost:8000";

interface WorkerHealth {
  status: string;
  version: string;
  coreModel: string;
  deepTargetCount: number;
  organization?: string;
  samAudio: {
    installed: boolean;
    model: string;
    cudaAvailable: boolean;
    hfTokenPresent: boolean;
  };
}

interface Manifest {
  jobId: string;
  source: { filename: string };
  model: string;
  device?: string;
  mode: "core" | "deep";
  sampleRate: number;
  channels: number;
  durationSec: number;
  stems: StemInfo[];
  zipUrl?: string;
  alignment: { reconErrorDb: number; note: string };
  warnings: string[];
  organization?: {
    root: string;
    strategy: string;
    families: string[];
  };
}

export default function StemLabPage(): React.JSX.Element {
  const player = useRealStemPlayer();
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("Ready — upload a real track to inspect the Core 6 separation.");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const workerOnline = health?.status === "ok";
  const deepReady = health?.samAudio.installed === true;

  const loadHealth = async (): Promise<void> => {
    try {
      const response = await fetch(`${SEPARATOR_URL}/health`);
      if (!response.ok) throw new Error(`health failed (${response.status})`);
      setHealth((await response.json()) as WorkerHealth);
    } catch {
      setHealth(null);
    }
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  const handleManifest = async (next: Manifest): Promise<void> => {
    setManifest(next);
    const mixable = next.stems.filter((stem) => stem.mixable);
    setStatus(`Separation finished. Loading ${mixable.length} synchronized stems into the lab mixer…`);
    await player.loadStems(SEPARATOR_URL, mixable);
    setStatus(
      `Ready · ${next.source.filename} · ${next.model} · ${next.durationSec}s · recon ${next.alignment.reconErrorDb} dB.`
    );
  };

  const parseError = async (response: Response): Promise<string> => {
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    return body.detail ?? `separator failed (${response.status})`;
  };

  const separateFile = async (file: File): Promise<void> => {
    setBusy(true);
    setStatus(`Uploading ${file.name} and running real Core 6 separation…`);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mode", "core");
      form.append("targets", "[]");
      const response = await fetch(`${SEPARATOR_URL}/separate`, { method: "POST", body: form });
      if (!response.ok) throw new Error(await parseError(response));
      await handleManifest((await response.json()) as Manifest);
      await loadHealth();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected separation error");
    } finally {
      setBusy(false);
      setDragging(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const separateDemo = async (): Promise<void> => {
    setBusy(true);
    setStatus("Generating the synthetic test mix and running the real Core 6 engine…");
    try {
      const response = await fetch(`${SEPARATOR_URL}/separate/demo`, { method: "POST" });
      if (!response.ok) throw new Error(await parseError(response));
      await handleManifest((await response.json()) as Manifest);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Demo separation failed");
    } finally {
      setBusy(false);
    }
  };

  const stemMeta = (name: string): StemInfo | undefined =>
    manifest?.stems.find((stem) => stem.name === name);

  const mixableStems = manifest?.stems.filter((stem) => stem.mixable) ?? [];
  const nonMixable = manifest?.stems.filter((stem) => !stem.mixable) ?? [];

  return (
    <main className="sl-shell">
      <div className="sl-wrap">
        <nav className="sl-topbar" aria-label="Music OS navigation">
          <div className="sl-brand">Stem Lab · Live QA</div>
          <div className="sl-nav">
            <Link href="/">Agentic Beat Lab</Link>
            <Link href="/stem-lab">Stem Lab</Link>
            <Link href="/stem-studio">Stem Studio 60+</Link>
          </div>
        </nav>

        <section className="sl-hero">
          <div className="sl-hero-main">
            <p className="sl-kicker">Real audio inspection workspace</p>
            <h1>Stem Lab is now the QA bench, not a simulation.</h1>
            <p className="sl-lede">
              Upload a real song, run the production Core 6 separator, audition synchronized stems, solo and mute channels, inspect reconstruction quality, and download the organized package. Use Stem Studio when you need the deeper 60+ instrument and vocal target library.
            </p>
            <div className="sl-actions">
              <button className="sl-button" onClick={() => fileRef.current?.click()} disabled={busy || !workerOnline}>
                {busy ? "Working…" : "Upload track"}
              </button>
              <Link className="sl-link-button secondary" href="/stem-studio">Open Deep 60+</Link>
            </div>
          </div>

          <aside className="sl-panel sl-status-grid">
            <div className="sl-panel-head"><div><h3>Engine status</h3><p>What Stem Lab can do right now.</p></div></div>
            <div className="sl-status-card">
              <strong><span className={`sl-dot ${workerOnline ? "live" : ""}`} /> Core separator</strong>
              <p>{workerOnline ? `${health?.coreModel} is reachable.` : "Separator worker is not reachable from this browser."}</p>
            </div>
            <div className="sl-status-card">
              <strong><span className={`sl-dot ${deepReady ? "live" : ""}`} /> Deep engine</strong>
              <p>{deepReady ? `${health?.deepTargetCount ?? 0} deep targets are available in Stem Studio.` : "Deep target runtime is not available on the current worker."}</p>
            </div>
            <div className="sl-status-card">
              <strong>Role of this page</strong>
              <p>Fast Core 6 separation, quality inspection, mixer auditioning, and export verification.</p>
            </div>
          </aside>
        </section>

        <section className="sl-upload-panel">
          <div className="sl-panel">
            <div
              className={`sl-drop ${dragging ? "drag" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file && !busy && workerOnline) void separateFile(file);
              }}
            >
              <div>
                <strong>Drop a mix here</strong>
                <p>WAV, MP3, FLAC, M4A, or AIFF. Core 6 returns vocals, drums, bass, guitar, piano, and other, plus an instrumental mixdown.</p>
                <div className="sl-actions" style={{ justifyContent: "center" }}>
                  <button className="sl-button" onClick={() => fileRef.current?.click()} disabled={busy || !workerOnline}>Choose audio</button>
                  <button className="sl-button secondary" onClick={() => void separateDemo()} disabled={busy || !workerOnline}>Run test mix</button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void separateFile(file);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="sl-panel">
            <div className="sl-panel-head"><div><h2>Job inspector</h2><p>Real metadata returned by the worker.</p></div></div>
            {!manifest ? (
              <div className="sl-empty"><div><strong>No job yet.</strong><p>Upload audio or run the test mix.</p></div></div>
            ) : (
              <div className="sl-info-list">
                <div className="sl-info-row"><span>Source</span><strong>{manifest.source.filename}</strong></div>
                <div className="sl-info-row"><span>Model</span><strong>{manifest.model}</strong></div>
                <div className="sl-info-row"><span>Device</span><strong>{manifest.device ?? "worker default"}</strong></div>
                <div className="sl-info-row"><span>Duration</span><strong>{manifest.durationSec}s</strong></div>
                <div className="sl-info-row"><span>Format</span><strong>{manifest.sampleRate / 1000} kHz · {manifest.channels}ch</strong></div>
                <div className="sl-info-row"><span>Core stems</span><strong>{mixableStems.length}</strong></div>
                <div className="sl-info-row"><span>Recon error</span><strong>{manifest.alignment.reconErrorDb} dB</strong></div>
                <div className="sl-info-row"><span>Job</span><span className="sl-mono">{manifest.jobId}</span></div>
                {manifest.zipUrl && (
                  <a className="sl-link-button" href={`${SEPARATOR_URL}${manifest.zipUrl}`} download="Stem_Studio_Organized_Stems.zip">Download organized ZIP</a>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="sl-workspace">
          <section className="sl-panel">
            <div className="sl-panel-head">
              <div><h2>Core 6 mixer</h2><p>These are synchronized, non-overlapping mixable stems from the live worker.</p></div>
              <span className="sl-badge">{player.stems.length} channels loaded</span>
            </div>

            {player.stems.length === 0 ? (
              <div className="sl-empty"><div><strong>No channels loaded.</strong><p>Run a real separation first.</p></div></div>
            ) : (
              <>
                <div className="sl-mixer-actions">
                  <button className="sl-button" onClick={player.play} disabled={player.isLoading}>▶ Play</button>
                  <button className="sl-button secondary" onClick={player.stop}>■ Stop</button>
                  <button className="sl-button secondary" onClick={player.karaoke}>Instrumental</button>
                  <button className="sl-button secondary" onClick={player.acapella}>Vocals only</button>
                  <button className="sl-button secondary" onClick={player.reset}>Reset mix</button>
                </div>
                <div className="sl-mixer">
                  {player.stems.map((ui) => {
                    const meta = stemMeta(ui.name);
                    return (
                      <article className="sl-channel" key={ui.name}>
                        <h3>{meta?.label ?? ui.name}</h3>
                        <div className="sl-channel-meta">
                          {meta?.family ?? "Core 6"} · {meta?.integratedDb ?? "—"} dB
                          <br />
                          <span className="sl-mono">{meta?.file ?? ""}</span>
                        </div>
                        <div className="sl-channel-controls">
                          <button className={`sl-pill ${ui.solo ? "active-solo" : ""}`} onClick={() => player.setSolo(ui.name, !ui.solo)}>Solo</button>
                          <button className={`sl-pill ${ui.muted ? "active-mute" : ""}`} onClick={() => player.setMuted(ui.name, !ui.muted)}>Mute</button>
                        </div>
                        <input type="range" min={0} max={1} step={0.01} value={ui.gain} onChange={(event) => player.setGain(ui.name, Number(event.target.value))} aria-label={`${ui.name} gain`} />
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <section className="sl-panel">
            <div className="sl-panel-head">
              <div><h2>Outputs + QA</h2><p>Preview files, confirm names/families, and verify the handoff package.</p></div>
              {manifest && <span className="sl-badge">recon {manifest.alignment.reconErrorDb} dB</span>}
            </div>

            {!manifest ? (
              <div className="sl-empty"><div><strong>Nothing to inspect yet.</strong><p>Separated outputs will appear here.</p></div></div>
            ) : (
              <>
                <div className="sl-output-list">
                  {manifest.stems.map((stem) => (
                    <article className="sl-output" key={`${stem.name}-${stem.url}`}>
                      <div className="sl-output-head">
                        <div>
                          <h3>{stem.label ?? stem.name}</h3>
                          <p>{stem.family ?? stem.group ?? "Core"} · {stem.integratedDb} dB</p>
                          <div className="sl-mono">{stem.file ?? stem.url}</div>
                        </div>
                        <a className="sl-download" href={`${SEPARATOR_URL}${stem.url}`} download={stem.downloadName ?? true}>Download WAV</a>
                      </div>
                      <audio controls preload="none" src={`${SEPARATOR_URL}${stem.url}`} />
                    </article>
                  ))}
                </div>

                <div className="sl-status-card" style={{ marginTop: ".75rem" }}>
                  <strong>Alignment check</strong>
                  <p>{manifest.alignment.note}</p>
                </div>

                {manifest.organization && (
                  <div className="sl-status-card" style={{ marginTop: ".65rem" }}>
                    <strong>Organized export</strong>
                    <p>{manifest.organization.strategy} · {manifest.organization.families.join(" · ")}</p>
                  </div>
                )}

                <div className="sl-status-card" style={{ marginTop: ".65rem" }}>
                  <strong>Worker notes</strong>
                  <ul className="sl-notes">
                    {manifest.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </div>

                {nonMixable.length > 0 && (
                  <div className="sl-status-card" style={{ marginTop: ".65rem" }}>
                    <strong>Additional outputs</strong>
                    <p>{nonMixable.length} non-mixer output{nonMixable.length === 1 ? "" : "s"}, such as the instrumental mixdown, are included above and in the ZIP.</p>
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      </div>

      <div className="sl-footer-status" role="status" aria-live="polite">{busy || player.isLoading ? "Working · " : ""}{status}</div>
    </main>
  );
}
