"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ProducerDnaPanel } from "./ProducerDnaPanel";
import { PRESETS, STEM_GROUPS, STEM_TARGETS } from "./catalog";
import { useRealStemPlayer, type StemInfo } from "./useRealStemPlayer";
import "./stemStudio.css";

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
  const [dragging, setDragging] = useState(false);
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
      `Separated ${m.stems.length} outputs. Loading ${mixable.length} synchronized core stems…`
    );
    await player.loadStems(SEPARATOR_URL, mixable);
    const deepCount = m.stems.filter((stem) => stem.group !== "Core 6").length;
    setStatus(
      `Ready · ${m.model} · ${deepCount} deep target${deepCount === 1 ? "" : "s"} · organized by name and family · recon ${m.alignment.reconErrorDb} dB`
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

  const handleDrop = (event: React.DragEvent<HTMLElement>): void => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && !busy && !(mode === "deep" && selectedTargets.length === 0)) {
      void separateUpload(file);
    }
  };

  const stemMeta = (name: string): StemInfo | undefined =>
    manifest?.stems.find((stem) => stem.name === name);

  const deepOutputs = manifest?.stems.filter((stem) => stem.group !== "Core 6") ?? [];
  const coreDownloads =
    manifest?.stems.filter((stem) => stem.group === "Core 6" && !stem.mixable) ?? [];
  const samReady = health?.samAudio.installed === true;
  const workerOnline = health?.status === "ok";
  const canSeparate = !busy && !(mode === "deep" && selectedTargets.length === 0);

  return (
    <main className="stemStudio">
      <nav className="studioTopbar" aria-label="Stem Studio navigation">
        <div className="studioBrand">
          <span className="studioMark" aria-hidden="true">S</span>
          <span>Stem Studio</span>
        </div>
        <Link href="/" className="studioNavLink">
          Command center →
        </Link>
      </nav>

      <div className="studioShell">
        <header className="studioHero">
          <div>
            <p className="studioEyebrow">AI stem workstation · production build</p>
            <h1>
              Separate the mix.
              <span>Keep every layer.</span>
            </h1>
            <p className="studioHeroCopy">
              Split one song into synchronized Core 6 stems or isolate 60+ named vocal,
              drum, bass, instrument, orchestral, and FX targets. Every output is filed by
              family and ready to preview, mix, or download.
            </p>
          </div>
          <div className="studioHeroStat" aria-label="Stem Studio capabilities">
            <div className="studioStat"><strong>60+</strong><span>deep targets</span></div>
            <div className="studioStat"><strong>6</strong><span>mixable core stems</span></div>
            <div className="studioStat"><strong>WAV</strong><span>organized export</span></div>
          </div>
        </header>

        <section className="studioWorkspace">
          <div className="studioPanel studioUploadPanel">
            <div
              className={`studioDropzone${dragging ? " isDragging" : ""}`}
              role="button"
              tabIndex={0}
              aria-disabled={!canSeparate}
              onClick={() => canSeparate && fileRef.current?.click()}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && canSeparate) {
                  event.preventDefault();
                  fileRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (canSeparate) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div>
                <div className="studioDropIcon" aria-hidden="true">↑</div>
                <h2>{busy ? "Separation in progress" : "Drop your track here"}</h2>
                <p>
                  WAV, MP3, FLAC, M4A, or AIFF. {mode === "deep"
                    ? `${selectedTargets.length} deep targets selected in addition to the Core 6 base.`
                    : "Core 6 creates vocals, drums, bass, guitar, piano, other, and an instrumental."}
                </p>
                <div className="studioActions">
                  <button
                    className="studioButton"
                    onClick={(event) => {
                      event.stopPropagation();
                      fileRef.current?.click();
                    }}
                    disabled={!canSeparate}
                  >
                    {busy ? "Processing…" : "Choose audio file"}
                  </button>
                  <button
                    className="studioGhostButton"
                    onClick={(event) => {
                      event.stopPropagation();
                      void separateDemo();
                    }}
                    disabled={busy}
                  >
                    Run demo
                  </button>
                  {manifest?.zipUrl && (
                    <a
                      className="studioGhostButton"
                      href={`${SEPARATOR_URL}${manifest.zipUrl}`}
                      download="Stem_Studio_Organized_Stems.zip"
                      onClick={(event) => event.stopPropagation()}
                      style={{ textDecoration: "none" }}
                    >
                      Download organized ZIP
                    </a>
                  )}
                </div>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.wav,.mp3,.flac,.m4a,.aiff"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void separateUpload(file);
              }}
            />
          </div>

          <aside className="studioPanel studioControlPanel" aria-label="Separation settings">
            <p className="studioSectionLabel">Separation mode</p>
            <div className="studioModeSwitch">
              <button
                className={`studioModeButton${mode === "core" ? " active" : ""}`}
                aria-pressed={mode === "core"}
                onClick={() => setMode("core")}
              >
                Core 6
              </button>
              <button
                className={`studioModeButton${mode === "deep" ? " active" : ""}`}
                aria-pressed={mode === "deep"}
                onClick={() => setMode("deep")}
              >
                Deep 60+
              </button>
            </div>
            <p className="studioModeDescription">
              {mode === "core"
                ? "Fast, synchronized stems for mixing: vocals, drums, bass, guitar, piano, other + instrumental."
                : `${selectedTargets.length} independent deep isolates selected, plus the synchronized Core 6 base.`}
            </p>

            <p className="studioSectionLabel">Engine status</p>
            <div className="studioHealthGrid">
              <div className="studioHealthRow">
                <span>Worker</span>
                <strong className={workerOnline ? "studioGood" : "studioWarn"}>
                  {workerOnline ? "Online" : "Not detected"}
                </strong>
              </div>
              <div className="studioHealthRow">
                <span>Deep engine</span>
                <strong className={samReady ? "studioGood" : "studioWarn"}>
                  {samReady ? "Ready" : "GPU needed"}
                </strong>
              </div>
              <div className="studioHealthRow">
                <span>Compute</span>
                <strong>{health?.samAudio.cudaAvailable ? "CUDA GPU" : "CPU / unknown"}</strong>
              </div>
              <div className="studioHealthRow">
                <span>Endpoint</span>
                <span className="studioEndpoint" title={SEPARATOR_URL}>{SEPARATOR_URL}</span>
              </div>
            </div>
          </aside>
        </section>

        {mode === "deep" && (
          <section className="studioPanel studioSection">
            <div className="studioSectionHeader">
              <div>
                <p className="studioSectionLabel">Target library</p>
                <h2>Choose exactly what you want isolated</h2>
                <p>Each selected target becomes its own named WAV inside the correct family folder.</p>
              </div>
              <span className="studioCount">{selectedTargets.length}/{STEM_TARGETS.length}</span>
            </div>

            <div className="studioChips" aria-label="Stem presets">
              <button className="studioChip" onClick={() => selectPreset("vocals")}>Vocals</button>
              <button className="studioChip" onClick={() => selectPreset("drums")}>Drums</button>
              <button className="studioChip" onClick={() => selectPreset("beat")}>Beat</button>
              <button className="studioChip" onClick={() => selectPreset("instruments")}>Instruments</button>
              <button className="studioChip" onClick={() => selectPreset("all")}>All 60</button>
              <button className="studioChip" onClick={() => setSelectedTargets([])}>Clear</button>
            </div>

            {selectedTargets.length > 12 && (
              <div className="studioNotice">
                Large deep jobs run one isolation pass per target. For faster turnaround, select only
                the layers you actually need.
              </div>
            )}

            <div className="studioGroupGrid">
              {STEM_GROUPS.map((group) => (
                <div className="studioGroup" key={group}>
                  <h3>{group}</h3>
                  <div className="studioTargetGrid">
                    {STEM_TARGETS.filter((target) => target.group === group).map((target) => {
                      const checked = selectedTargets.includes(target.id);
                      return (
                        <label
                          key={target.id}
                          className={`studioTarget${checked ? " selected" : ""}`}
                        >
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

        {manifest?.organization && (
          <section className="studioPanel studioSection">
            <div className="studioSectionHeader">
              <div>
                <p className="studioSectionLabel">Export structure</p>
                <h2>Organized automatically</h2>
                <p>{manifest.organization.strategy}. The ZIP preserves every family folder and filename.</p>
              </div>
              {manifest.zipUrl && (
                <a
                  className="studioLink"
                  href={`${SEPARATOR_URL}${manifest.zipUrl}`}
                  download="Stem_Studio_Organized_Stems.zip"
                >
                  Download ZIP →
                </a>
              )}
            </div>
            <div className="studioChips">
              {manifest.organization.families.map((family) => (
                <span className="studioChip" key={family}>{family}</span>
              ))}
            </div>
          </section>
        )}

        <section className="studioResultsGrid">
          <section className="studioPanel studioSection">
            <div className="studioSectionHeader">
              <div>
                <p className="studioSectionLabel">Live mix</p>
                <h2>Core 6 mixer</h2>
                <p>Synchronized, non-overlapping stems designed to play together.</p>
              </div>
            </div>

            {player.stems.length === 0 ? (
              <div className="studioEmpty">Upload a track to load the synchronized mixer.</div>
            ) : (
              <>
                <div className="studioTransport">
                  <button className="studioMiniButton primary" onClick={player.play} disabled={player.isLoading}>▶ Play</button>
                  <button className="studioMiniButton" onClick={player.stop}>■ Stop</button>
                  <button className="studioMiniButton" onClick={player.karaoke}>Instrumental</button>
                  <button className="studioMiniButton" onClick={player.acapella}>Vocals only</button>
                  <button className="studioMiniButton" onClick={player.reset}>Reset</button>
                </div>

                <div className="studioMixerGrid">
                  {player.stems.map((ui) => {
                    const meta = stemMeta(ui.name);
                    return (
                      <div className="studioChannel" key={ui.name}>
                        <div className="studioChannelTop">
                          <div>
                            <h3>{meta?.label ?? ui.name}</h3>
                            <div className="studioChannelPath">
                              {meta?.family ?? "Core 6"}{meta?.file ? ` · ${meta.file}` : ""}
                            </div>
                          </div>
                          <span className="studioDb">{meta?.integratedDb ?? "—"} dB</span>
                        </div>
                        <div className="studioSoloMute">
                          <button
                            className={ui.solo ? "activeSolo" : ""}
                            aria-pressed={ui.solo}
                            onClick={() => player.setSolo(ui.name, !ui.solo)}
                          >
                            SOLO
                          </button>
                          <button
                            className={ui.muted ? "activeMute" : ""}
                            aria-pressed={ui.muted}
                            onClick={() => player.setMuted(ui.name, !ui.muted)}
                          >
                            MUTE
                          </button>
                        </div>
                        <input
                          className="studioRange"
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={ui.gain}
                          onChange={(event) => player.setGain(ui.name, Number(event.target.value))}
                          aria-label={`${meta?.label ?? ui.name} gain`}
                        />
                      </div>
                    );
                  })}
                </div>

                {coreDownloads.length > 0 && (
                  <div className="studioDeepList" style={{ marginTop: ".75rem" }}>
                    {coreDownloads.map((stem) => (
                      <div className="studioDownloadRow" key={stem.name}>
                        <div className="studioDeepStemHead">
                          <div>
                            <strong>{stem.label ?? stem.name}</strong>
                            <div className="studioChannelPath">{stem.family ?? "Mixdowns"} · {stem.file}</div>
                          </div>
                          <a
                            className="studioLink"
                            href={`${SEPARATOR_URL}${stem.url}`}
                            download={stem.downloadName ?? true}
                          >
                            WAV ↓
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="studioPanel studioSection">
            <div className="studioSectionHeader">
              <div>
                <p className="studioSectionLabel">Deep outputs</p>
                <h2>Isolated stems</h2>
                <p>Independent AI isolates grouped by vocal or instrument family.</p>
              </div>
              {manifest && <span className="studioCount">{deepOutputs.length}</span>}
            </div>

            {!manifest || deepOutputs.length === 0 ? (
              <div className="studioEmpty">
                {!manifest
                  ? "Run a Deep 60+ separation to populate isolated outputs."
                  : manifest.mode === "core"
                    ? "This was a Core 6 job. Switch to Deep 60+ for individual targets."
                    : "No deep outputs were produced. Check the engine status and job notes."}
              </div>
            ) : (
              <div className="studioDeepList">
                {STEM_GROUPS.map((group) => {
                  const stems = deepOutputs.filter((stem) => stem.group === group);
                  if (stems.length === 0) return null;
                  return (
                    <div className="studioDeepGroup" key={group}>
                      <h3 className="studioDeepGroupTitle">{group}</h3>
                      {stems.map((stem) => (
                        <div className="studioDeepStem" key={stem.name}>
                          <div className="studioDeepStemHead">
                            <div>
                              <strong>{stem.label ?? stem.name}</strong>
                              <div className="studioChannelPath">{stem.family ?? stem.group} · {stem.file}</div>
                              <div className="studioChannelPath">{stem.integratedDb} dB · {stem.engine}</div>
                            </div>
                            <a
                              className="studioLink"
                              href={`${SEPARATOR_URL}${stem.url}`}
                              download={stem.downloadName ?? true}
                            >
                              WAV ↓
                            </a>
                          </div>
                          <audio controls preload="none" src={`${SEPARATOR_URL}${stem.url}`} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        {manifest && (
          <section className="studioPanel studioSection">
            <div className="studioSectionHeader">
              <div>
                <p className="studioSectionLabel">Technical detail</p>
                <h2>Job manifest</h2>
              </div>
            </div>
            <div className="studioManifestGrid">
              <div className="studioManifestCard">
                <h3>Source</h3>
                <div>{manifest.source.filename}</div>
                <div>{manifest.durationSec}s · {manifest.sampleRate / 1000} kHz</div>
                <div>job {manifest.jobId}</div>
              </div>
              <div className="studioManifestCard">
                <h3>Engines</h3>
                <div>Core: {manifest.engines.core}</div>
                <div>Deep: {manifest.engines.deep}</div>
              </div>
              <div className="studioManifestCard">
                <h3>Alignment</h3>
                <div>Core reconstruction error</div>
                <div>{manifest.alignment.reconErrorDb} dB</div>
              </div>
            </div>

            {manifest.failedTargets.length > 0 && (
              <div className="studioNotice" style={{ marginTop: ".8rem", marginBottom: 0 }}>
                <strong>Failed deep targets:</strong>{" "}
                {manifest.failedTargets.map((failure) => `${failure.id}: ${failure.error}`).join(" · ")}
              </div>
            )}

            {manifest.warnings.length > 0 && (
              <div className="studioManifestCard" style={{ marginTop: ".8rem" }}>
                <h3>Notes</h3>
                <div>{manifest.warnings.join(" · ")}</div>
              </div>
            )}
          </section>
        )}

        <div style={{ marginTop: "1rem" }}>
          <ProducerDnaPanel trackName={manifest?.source.filename} />
        </div>
      </div>

      <div className="studioStatusBar" role="status" aria-live="polite">
        <span className={`studioStatusDot${busy || player.isLoading ? " busy" : ""}`} />
        <span>{busy || player.isLoading ? "Working · " : ""}{status}</span>
      </div>
    </main>
  );
}
