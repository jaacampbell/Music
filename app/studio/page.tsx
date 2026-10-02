"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadActiveProjectId } from "@/lib/browser-project-storage";
import { StyleControl } from "./StyleControl";
import { StudioAssistant } from "./StudioAssistant";
import "./musicStudio.css";

type ToolPanel = "assistant" | "style" | "library" | "status" | null;

type Readiness = {
  capabilities?: {
    controlPlaneReady?: boolean;
    controllerOnline?: boolean;
    computeReady?: boolean;
    permanentOutputs?: boolean;
  };
  nextAction?: string;
};

const toolLinks = [
  { label: "TM Vocal", detail: "Record, tune, clean, mix and finish vocals.", href: "/tm-vocal", icon: "◉" },
  { label: "Stem Director", detail: "Separate real stems and preserve project context.", href: "/stem-agent", icon: "≋" },
  { label: "MIDI Shredder", detail: "Turn audio into editable MIDI and musical ideas.", href: "/midi-shredder", icon: "♬" },
  { label: "Producer DNA", detail: "Use your taste, method and creative system.", href: "/producer-dna", icon: "DNA" },
  { label: "Studio Brain", detail: "Develop the song, strategy and next production move.", href: "/studio-brain", icon: "✦" },
  { label: "Session Desk", detail: "Review takes, chains and engineer notes.", href: "/tm-sessions", icon: "S" }
] as const;

const tracks = [
  { name: "Lead Vocal", meta: "Vocal · REC", type: "vocal", start: 4, width: 58, label: "Lead take · Verse / Hook" },
  { name: "Beat", meta: "Audio · Stereo", type: "beat", start: 0, width: 88, label: "Instrumental" },
  { name: "Drums", meta: "Stem · Group", type: "drums", start: 0, width: 88, label: "Drums" },
  { name: "Bass", meta: "Stem · Mono", type: "bass", start: 0, width: 88, label: "Bass" },
  { name: "MIDI Idea", meta: "Instrument", type: "midi", start: 23, width: 38, label: "Counter melody" },
  { name: "Reference", meta: "Reference · -6 dB", type: "reference", start: 2, width: 71, label: "Reference track" }
] as const;

export default function MusicStudioHome(): React.JSX.Element {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [panel, setPanel] = useState<ToolPanel>("assistant");
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [command, setCommand] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("projectId");
    setProjectId(requested && /^[0-9a-f-]{36}$/i.test(requested) ? requested : loadActiveProjectId());
  }, []);

  useEffect(() => {
    if (panel !== "status") return;
    void fetch("/api/stem-agent/readiness", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<Readiness> : null)
      .then(setReadiness)
      .catch(() => setReadiness(null));
  }, [panel]);

  const withProject = (path: string): string => {
    if (!projectId) return path;
    const [route, query] = path.split("?");
    return `${route}?${query ? `${query}&` : ""}projectId=${encodeURIComponent(projectId)}`;
  };

  const commandHref = useMemo(() => {
    const value = command.trim().toLowerCase();
    if (!value) return null;
    if (value.includes("vocal") || value.includes("record") || value.includes("mix")) return withProject("/tm-vocal");
    if (value.includes("stem") || value.includes("separate")) return withProject("/stem-agent");
    if (value.includes("midi") || value.includes("chord")) return withProject("/midi-shredder");
    if (value.includes("project") || value.includes("arrange") || value.includes("song")) return withProject("/?workspace=1");
    if (value.includes("listen") || value.includes("player") || value.includes("version")) return "/player";
    return null;
  }, [command, projectId]);

  const runCommand = (): void => {
    if (commandHref) {
      window.location.href = commandHref;
      return;
    }
    setPanel("assistant");
  };

  return (
    <main className="tmStudio tmStudioV2">
      <header className="tmTopbar">
        <Link className="tmBrand" href="/studio" aria-label="TM Music Studio">
          <span className="tmBrandMark">TM</span>
          <span><strong>Music Studio</strong><small>{projectId ? "Project connected" : "No project selected"}</small></span>
        </Link>

        <div className="tmTransport" aria-label="Transport controls">
          <button type="button" aria-label="Go to start">│◀</button>
          <button type="button" aria-label="Rewind">◀</button>
          <button type="button" className="tmPlay" aria-label="Play">▶</button>
          <button type="button" className="tmRecord" aria-label="Record">●</button>
          <span className="tmTime">01 · 01 · 000</span>
          <span className="tmTempo">98.0</span>
          <span className="tmMeter">4/4</span>
          <button type="button" aria-label="Metronome">⌁</button>
          <button type="button" aria-label="Loop">↻</button>
        </div>

        <nav className="tmTopActions" aria-label="Studio navigation">
          <Link href={withProject("/dashboard")}>Projects</Link>
          <Link href="/player">Listen</Link>
          <button type="button" className={panel === "status" ? "active" : ""} onClick={() => setPanel(panel === "status" ? null : "status")}>System</button>
        </nav>
      </header>

      <section className="tmCommandBar">
        <span className="tmCommandIcon">✦</span>
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") runCommand(); }}
          placeholder="Tell TM what you want to do…"
          aria-label="TM command"
        />
        <kbd>⌘ K</kbd>
        <button type="button" onClick={runCommand}>{commandHref ? "Open tool" : "Ask TM"}</button>
      </section>

      <div className="tmShell">
        <aside className="tmRail" aria-label="Primary studio tools">
          <div className="tmRailGroup">
            <Link className="active" href={withProject("/?workspace=1")} title="Arrangement"><span>▤</span><small>Arrange</small></Link>
            <Link href={withProject("/tm-vocal")} title="Vocal tools"><span>◉</span><small>Vocal</small></Link>
            <Link href={withProject("/stem-agent")} title="Stem Director"><span>≋</span><small>Stems</small></Link>
            <Link href={withProject("/midi-shredder")} title="MIDI Shredder"><span>♬</span><small>MIDI</small></Link>
          </div>
          <div className="tmRailGroup tmRailBottom">
            <button type="button" className={panel === "style" ? "active" : ""} onClick={() => setPanel(panel === "style" ? null : "style")}><span>◫</span><small>Style</small></button>
            <button type="button" className={panel === "library" ? "active" : ""} onClick={() => setPanel(panel === "library" ? null : "library")}><span>⌘</span><small>Tools</small></button>
            <button type="button" className={panel === "assistant" ? "active tmAiRail" : "tmAiRail"} onClick={() => setPanel(panel === "assistant" ? null : "assistant")}><span>✦</span><small>TM</small></button>
          </div>
        </aside>

        <section className="tmCanvas">
          <div className="tmProjectBar">
            <div className="tmProjectIdentity">
              <span className="tmProjectDot" />
              <div>
                <strong>{projectId ? "Current Song" : "Untitled Project"}</strong>
                <small>{projectId ? "Autosaved · connected across studio tools" : "Create a project to connect every tool"}</small>
              </div>
            </div>
            <div className="tmProjectMeta">
              <span><small>KEY</small><strong>F♯m</strong></span>
              <span><small>BPM</small><strong>98</strong></span>
              <span><small>MODE</small><strong>Studio</strong></span>
            </div>
            <div className="tmProjectMenu">
              <Link href={withProject("/dashboard")}>Library</Link>
              <Link className="tmProjectPrimary" href={withProject("/?workspace=1")}>{projectId ? "Open project" : "Create project"}</Link>
            </div>
          </div>

          <div className="tmWorkspace">
            <div className="tmTimelineHeader">
              <div className="tmTimelineTitle">
                <strong>Arrangement</strong>
                <small>Song view</small>
              </div>
              <div className="tmTimelineTools">
                <button type="button">Pointer</button>
                <button type="button">Split</button>
                <button type="button">Snap</button>
                <button type="button">Automation</button>
                <span />
                <button type="button">−</button>
                <button type="button">+</button>
              </div>
            </div>

            <div className="tmArrangement">
              <div className="tmTrackCorner">
                <button type="button">＋ Track</button>
              </div>
              <div className="tmRuler">
                {Array.from({ length: 13 }, (_, index) => <span key={index}>{index * 4 + 1}</span>)}
              </div>

              {tracks.map((track, index) => (
                <article className="tmTrackRow" key={track.name}>
                  <div className="tmTrackHead">
                    <span className={`tmTrackColor ${track.type}`} />
                    <div className="tmTrackText"><strong>{track.name}</strong><small>{track.meta}</small></div>
                    <div className="tmTrackButtons"><button type="button">M</button><button type="button">S</button>{index === 0 && <button type="button" className="armed">R</button>}</div>
                  </div>
                  <div className="tmLane">
                    <div className="tmBeatGrid" />
                    <Link
                      href={track.type === "vocal" ? withProject("/tm-vocal") : track.type === "midi" ? withProject("/midi-shredder") : track.type === "reference" ? "/player" : withProject("/stem-agent")}
                      className={`tmRegion ${track.type}`}
                      style={{ left: `${track.start}%`, width: `${track.width}%` }}
                    >
                      <span>{track.label}</span>
                      <i aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="tmBottomDock">
              <button type="button" onClick={() => setPanel("assistant")}><span>✦</span><strong>Ask TM</strong><small>Develop the record</small></button>
              <Link href={withProject("/tm-vocal")}><span>◉</span><strong>Record</strong><small>Vocal workspace</small></Link>
              <Link href={withProject("/stem-agent")}><span>≋</span><strong>Separate</strong><small>Stem Director</small></Link>
              <Link href={withProject("/midi-shredder")}><span>♬</span><strong>Create MIDI</strong><small>Audio → notes</small></Link>
              <button type="button" onClick={() => setPanel("style")}><span>◫</span><strong>Style</strong><small>Creative direction</small></button>
              <Link href="/player"><span>▶</span><strong>Review</strong><small>Versions + playback</small></Link>
            </div>
          </div>
        </section>

        {panel && (
          <aside className="tmInspector" aria-label="Context panel">
            <div className="tmInspectorHead">
              <div>
                <p>{panel === "assistant" ? "AI COPILOT" : panel === "style" ? "PROJECT DIRECTION" : panel === "status" ? "SYSTEM" : "TOOLS"}</p>
                <strong>{panel === "assistant" ? "TM Assistant" : panel === "style" ? "Style Control" : panel === "status" ? "Production Status" : "Studio Library"}</strong>
              </div>
              <button type="button" onClick={() => setPanel(null)} aria-label="Close panel">×</button>
            </div>

            {panel === "assistant" && <StudioAssistant />}
            {panel === "style" && <StyleControl projectId={projectId} />}

            {panel === "library" && (
              <div className="tmToolLibrary">
                <div className="tmToolSearch"><span>⌕</span><input placeholder="Search tools" /></div>
                <p className="tmToolSectionLabel">STUDIO TOOLS</p>
                <div className="tmToolCards">
                  {toolLinks.map((tool) => (
                    <Link key={tool.label} href={withProject(tool.href)}>
                      <span className="tmToolIcon">{tool.icon}</span>
                      <span><strong>{tool.label}</strong><small>{tool.detail}</small></span>
                      <b>→</b>
                    </Link>
                  ))}
                </div>
                <p className="tmToolSectionLabel">ADVANCED</p>
                <div className="tmToolCompact">
                  <Link href={withProject("/stem-studio")}>Deep Stem Studio <span>→</span></Link>
                  <Link href={withProject("/stem-lab")}>Stem Lab <span>→</span></Link>
                  <Link href="/guide">Guide <span>→</span></Link>
                </div>
              </div>
            )}

            {panel === "status" && (
              <div className="tmStatusPanel" aria-live="polite">
                <div><span>Control plane</span><strong>{!readiness ? "Checking…" : readiness.capabilities?.controlPlaneReady ? "Ready" : "Needs attention"}</strong></div>
                <div><span>Controller</span><strong>{!readiness ? "Checking…" : readiness.capabilities?.controllerOnline ? "Online" : "Offline"}</strong></div>
                <div><span>Compute</span><strong>{!readiness ? "Checking…" : readiness.capabilities?.computeReady ? "Online" : "Standby"}</strong></div>
                <div><span>Saved outputs</span><strong>{!readiness ? "Checking…" : readiness.capabilities?.permanentOutputs ? "Ready" : "Needs attention"}</strong></div>
                {readiness?.nextAction && <p>{readiness.nextAction}</p>}
                <Link href="/stem-agent/status">Open technical status →</Link>
              </div>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
