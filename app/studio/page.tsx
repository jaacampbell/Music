"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadActiveProjectId } from "@/lib/browser-project-storage";
import { StyleControl } from "./StyleControl";
import { StudioAssistant } from "./StudioAssistant";
import "./musicStudio.css";

type ToolPanel = "assistant" | "style" | "tools" | "status" | null;

type Readiness = {
  capabilities?: {
    controlPlaneReady?: boolean;
    controllerOnline?: boolean;
    computeReady?: boolean;
    permanentOutputs?: boolean;
  };
  nextAction?: string;
};

const quickTools = [
  { label: "Vocal", detail: "Record + mix", href: "/tm-vocal" },
  { label: "Stems", detail: "Stem Director", href: "/stem-agent" },
  { label: "MIDI", detail: "MIDI Shredder", href: "/midi-shredder" },
  { label: "Player", detail: "Review versions", href: "/player" },
  { label: "Songs", detail: "Project library", href: "/dashboard" }
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
    if (value.includes("song") || value.includes("arrange") || value.includes("project")) return withProject("/?workspace=1");
    if (value.includes("export") || value.includes("listen") || value.includes("player")) return "/player";
    return null;
  }, [command, projectId]);

  const runCommand = (): void => {
    if (commandHref) {
      window.location.href = commandHref;
      return;
    }
    setPanel("assistant");
    document.getElementById("tm-assistant")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="tmStudio">
      <header className="tmTopbar">
        <Link className="tmBrand" href="/studio" aria-label="TM Music Studio">
          <span className="tmBrandMark">TM</span>
          <span><strong>Music Studio</strong><small>Unified workspace</small></span>
        </Link>

        <div className="tmTransport" aria-label="Transport controls">
          <button type="button" aria-label="Rewind">↶</button>
          <button type="button" className="tmPlay" aria-label="Play">▶</button>
          <button type="button" aria-label="Record">●</button>
          <span className="tmTime">00:00.000</span>
          <span className="tmTempo">98 BPM</span>
          <button type="button" aria-label="Metronome">⌁</button>
          <button type="button" aria-label="Loop">↻</button>
        </div>

        <nav className="tmTopActions" aria-label="Studio navigation">
          <Link href={withProject("/dashboard")}>Projects</Link>
          <Link href="/guide">Help</Link>
          <Link href="/login">Account</Link>
        </nav>
      </header>

      <section className="tmCommandBar">
        <span>⌘</span>
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") runCommand(); }}
          placeholder="Do anything… “mix vocal”, “separate stems”, “open MIDI”, or ask TM"
          aria-label="Studio command"
        />
        <button type="button" onClick={runCommand}>{commandHref ? "Open" : "Ask TM"}</button>
      </section>

      <div className="tmShell">
        <aside className="tmRail" aria-label="Primary studio tools">
          <Link className="active" href={withProject("/?workspace=1")}><span>▤</span><small>Arrange</small></Link>
          <Link href={withProject("/tm-vocal")}><span>◉</span><small>Vocal</small></Link>
          <Link href={withProject("/stem-agent")}><span>≋</span><small>Stems</small></Link>
          <Link href={withProject("/midi-shredder")}><span>♬</span><small>MIDI</small></Link>
          <button type="button" className={panel === "style" ? "active" : ""} onClick={() => setPanel(panel === "style" ? null : "style")}><span>◫</span><small>Style</small></button>
          <button type="button" className={panel === "assistant" ? "active" : ""} onClick={() => setPanel(panel === "assistant" ? null : "assistant")}><span>✦</span><small>TM</small></button>
          <span className="tmRailSpacer" />
          <button type="button" className={panel === "tools" ? "active" : ""} onClick={() => setPanel(panel === "tools" ? null : "tools")}><span>＋</span><small>More</small></button>
          <button type="button" className={panel === "status" ? "active" : ""} onClick={() => setPanel(panel === "status" ? null : "status")}><span>●</span><small>Status</small></button>
        </aside>

        <section className="tmCanvas">
          <div className="tmProjectHeader">
            <div>
              <p>ACTIVE PROJECT</p>
              <h1>{projectId ? "Current song workspace" : "Start a new record"}</h1>
              <span>{projectId ? "Everything you open stays tied to this song." : "Create or choose a project once, then work from one place."}</span>
            </div>
            <div className="tmProjectActions">
              <Link href={withProject("/?workspace=1")}>{projectId ? "Open arrangement" : "Create song"}</Link>
              <Link href={withProject("/dashboard")}>Project library</Link>
            </div>
          </div>

          <div className="tmTimeline">
            <div className="tmTimelineTop">
              <strong>Arrangement</strong>
              <span>Idea → Record → Arrange → Edit → Mix → Master → Export</span>
            </div>
            <div className="tmRuler">
              {Array.from({ length: 9 }, (_, index) => <span key={index}>{index * 8 + 1}</span>)}
            </div>
            <div className="tmTracks">
              <article><div><strong>Lead Vocal</strong><small>Vocal chain</small></div><div className="tmClip vocal">Record / edit vocals</div></article>
              <article><div><strong>Beat</strong><small>Audio / stems</small></div><div className="tmClip beat">Drop audio or open Stem Director</div></article>
              <article><div><strong>Instrument</strong><small>MIDI</small></div><div className="tmClip midi">Create or edit MIDI</div></article>
              <article><div><strong>Reference</strong><small>Compare</small></div><div className="tmClip reference">Reference track</div></article>
            </div>
            <div className="tmCanvasActions">
              <Link href={withProject("/?workspace=1")}>Open full song editor</Link>
              <Link href={withProject("/tm-vocal")}>Record vocal</Link>
              <Link href={withProject("/stem-agent")}>Separate stems</Link>
              <Link href={withProject("/midi-shredder")}>Create MIDI</Link>
            </div>
          </div>

          <section className="tmQuickStrip" aria-label="Quick tools">
            {quickTools.map((tool) => (
              <Link key={tool.label} href={withProject(tool.href)}>
                <strong>{tool.label}</strong><span>{tool.detail}</span>
              </Link>
            ))}
          </section>
        </section>

        {panel && (
          <aside className="tmInspector" aria-label="Context panel">
            <div className="tmInspectorHead">
              <div><p>CONTEXT</p><strong>{panel === "assistant" ? "TM Assistant" : panel === "style" ? "Style Control" : panel === "status" ? "Production Status" : "More Tools"}</strong></div>
              <button type="button" onClick={() => setPanel(null)} aria-label="Close panel">×</button>
            </div>

            {panel === "assistant" && <StudioAssistant />}
            {panel === "style" && <StyleControl projectId={projectId} />}
            {panel === "tools" && (
              <div className="tmToolList">
                <Link href={withProject("/studio-brain")}><strong>Studio Brain</strong><span>Deep project development</span></Link>
                <Link href="/producer-dna"><strong>Producer DNA</strong><span>Your creative method and sound system</span></Link>
                <Link href={withProject("/stem-studio")}><strong>Deep Stem Studio</strong><span>Advanced isolation tools</span></Link>
                <Link href={withProject("/stem-lab")}><strong>Stem Lab</strong><span>Technical stem workflow</span></Link>
                <Link href="/tm-sessions"><strong>Session Desk</strong><span>Takes, chains and engineer notes</span></Link>
                <Link href="/player"><strong>Player</strong><span>Review saved versions</span></Link>
              </div>
            )}
            {panel === "status" && (
              <div className="tmStatusPanel" aria-live="polite">
                <div><span>Control plane</span><strong>{!readiness ? "Checking…" : readiness.capabilities?.controlPlaneReady ? "Ready" : "Needs attention"}</strong></div>
                <div><span>Controller</span><strong>{!readiness ? "Checking…" : readiness.capabilities?.controllerOnline ? "Online" : "Offline"}</strong></div>
                <div><span>Compute</span><strong>{!readiness ? "Checking…" : readiness.capabilities?.computeReady ? "Online" : "Standby"}</strong></div>
                <div><span>Saved outputs</span><strong>{!readiness ? "Checking…" : readiness.capabilities?.permanentOutputs ? "Ready" : "Needs attention"}</strong></div>
                {readiness?.nextAction && <p>{readiness.nextAction}</p>}
                <Link href="/stem-agent/status">Open technical status</Link>
              </div>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
