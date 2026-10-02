"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadActiveProjectId } from "@/lib/browser-project-storage";
import { StyleControl } from "./StyleControl";
import { StudioAssistant } from "./StudioAssistant";
import "./musicStudio.css";

type Area = "song" | "vocal" | "production" | "assistant";
type Readiness = {
  capabilities?: {
    controlPlaneReady?: boolean;
    controllerOnline?: boolean;
    computeReady?: boolean;
    permanentOutputs?: boolean;
  };
  nextAction?: string;
};

const areas: { id: Area; label: string; detail: string }[] = [
  { id: "song", label: "Make a Song", detail: "Write, arrange and manage your project" },
  { id: "vocal", label: "Mix Vocals", detail: "Record, reference and finish a take" },
  { id: "production", label: "Stems & MIDI", detail: "Separate audio and build sounds" },
  { id: "assistant", label: "Assistant", detail: "Get advice and document your method" }
];

function readArea(): Area {
  const value = new URLSearchParams(window.location.search).get("area");
  return areas.some((item) => item.id === value) ? value as Area : "song";
}

function WorkspaceCard({ eyebrow, title, description, href, primary = false }: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  primary?: boolean;
}) {
  return <Link className={`musicStudioCard ${primary ? "musicStudioCardFeatured" : ""}`} href={href}>
    <span className="musicStudioKicker">{eyebrow}</span>
    <h3>{title}</h3>
    <p>{description}</p>
    <strong className="musicStudioGo">Open workspace →</strong>
  </Link>;
}

export default function MusicStudioHome(): React.JSX.Element {
  const [area, setArea] = useState<Area>("song");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [readiness, setReadiness] = useState<Readiness | null>(null);

  useEffect(() => {
    setArea(readArea());
    const requested = new URLSearchParams(window.location.search).get("projectId");
    setProjectId(requested && /^[0-9a-f-]{36}$/i.test(requested) ? requested : loadActiveProjectId());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!showStatus) return;
    void fetch("/api/stem-agent/readiness", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<Readiness> : null)
      .then(setReadiness)
      .catch(() => setReadiness(null));
  }, [showStatus]);

  function selectArea(next: Area): void {
    setArea(next);
    setShowStyle(false);
    const url = new URL(window.location.href);
    url.searchParams.set("area", next);
    window.history.replaceState(null, "", url.pathname + url.search);
  }

  const withProject = (path: string): string => {
    if (!projectId) return path;
    const [route, query] = path.split("?");
    return `${route}?${query ? `${query}&` : ""}projectId=${encodeURIComponent(projectId)}`;
  };

  return <main className="musicStudioHome">
    <header className="musicStudioTopbar">
      <Link className="musicStudioBrand" href="/studio" aria-label="TM Music Studio home">
        <span className="musicStudioMark">M</span>
        <span><strong>TM Music Studio</strong><small>One place to start your next move</small></span>
      </Link>
      <nav aria-label="Studio shortcuts">
        <Link href={withProject("/dashboard")}>My Songs</Link>
        <Link href="/guide">Help</Link>
        <Link href="/login">Account</Link>
      </nav>
    </header>

    <section className="musicStudioCompactHero">
      <p className="musicStudioKicker">TM MUSIC STUDIO</p>
      <h1>What are you making today?</h1>
      <p>Choose a work area. Your song, vocal tools, production tools and assistant stay connected through the same project.</p>
    </section>

    <section className="musicStudioWorkspace" aria-label="Studio work areas">
      <div className="musicStudioAreaTabs" role="tablist" aria-label="Choose a work area">
        {areas.map((item) => <button
          key={item.id}
          id={`studio-tab-${item.id}`}
          type="button"
          role="tab"
          aria-selected={area === item.id}
          aria-controls={`studio-panel-${item.id}`}
          className={area === item.id ? "active" : ""}
          onClick={() => selectArea(item.id)}
        ><strong>{item.label}</strong><small>{item.detail}</small></button>)}
      </div>

      <div role="tabpanel" id={`studio-panel-${area}`} aria-labelledby={`studio-tab-${area}`} className="musicStudioAreaContent">
        {area === "song" && <>
          <div className="musicStudioAreaIntro"><p className="musicStudioKicker">SONG WORKSPACE</p><h2>Pick up the record where you left off.</h2><p>Build the idea, shape the arrangement, and keep the versions together.</p></div>
          <div className="musicStudioFocusGrid">
            <WorkspaceCard primary eyebrow="CREATE" title="Start or resume a song" description="Work on the concept, structure, revisions and mix plan." href={withProject("/?workspace=1")} />
            <WorkspaceCard eyebrow="LIBRARY" title="My song projects" description="Find your files, versions, credits and saved decisions." href={withProject("/dashboard")} />
            <WorkspaceCard eyebrow="LISTEN" title="Review in the player" description="Listen to your music and compare saved versions." href="/player" />
          </div>
        </>}
        {area === "vocal" && <>
          <div className="musicStudioAreaIntro"><p className="musicStudioKicker">VOCAL WORKSPACE</p><h2>Get the vocal sitting right.</h2><p>Process your take, compare your own reference and hand off the exact settings.</p></div>
          <div className="musicStudioFocusGrid">
            <WorkspaceCard primary eyebrow="MIX" title="TM Vocal" description="Use the vocal chain, reference match, beat pocket, presets and WAV export." href={withProject("/tm-vocal")} />
            <WorkspaceCard eyebrow="SESSIONS" title="Session Desk" description="Review saved takes, chain settings and timestamped notes." href="/tm-sessions" />
            <WorkspaceCard eyebrow="ISOLATE" title="Pull out a vocal" description="Separate a lead, background or instrumental in Stem Director." href={withProject("/stem-agent?strategy=vocal-suite")} />
          </div>
        </>}
        {area === "production" && <>
          <div className="musicStudioAreaIntro"><p className="musicStudioKicker">PRODUCTION WORKSPACE</p><h2>Make room for the idea.</h2><p>Separate a recording, turn it into MIDI, or set the creative direction for the next pass.</p></div>
          <div className="musicStudioFocusGrid">
            <WorkspaceCard primary eyebrow="STEMS" title="Stem Director" description="Separate and save real stems for the song." href={withProject("/stem-agent")} />
            <WorkspaceCard eyebrow="MIDI" title="MIDI Shredder" description="Turn audio parts into playable MIDI and edit the notes." href={withProject("/midi-shredder")} />
            <div className="musicStudioCard musicStudioInlineCard"><span className="musicStudioKicker">DIRECTION</span><h3>Style Control</h3><p>Set textures, influences and reference weight right here.</p><button type="button" onClick={() => setShowStyle((value) => !value)} aria-expanded={showStyle} aria-controls="studio-style-control">{showStyle ? "Close controls ↑" : "Open controls ↓"}</button></div>
          </div>
          {showStyle && <div id="studio-style-control"><StyleControl projectId={projectId} /></div>}
        </>}
        {area === "assistant" && <>
          <div className="musicStudioAreaIntro"><p className="musicStudioKicker">DEVELOPMENT WORKSPACE</p><h2>Talk through the next move.</h2><p>Ask about the current record, then develop your Producer DNA when you need a deeper pass.</p></div>
          <div className="musicStudioAssistantLinks"><Link href={withProject("/studio-brain")}>Open full Studio Brain →</Link><Link href="/producer-dna">Explore Producer DNA →</Link></div>
          <StudioAssistant />
        </>}
      </div>
    </section>

    <div className="musicStudioUtilities">
      <details>
        <summary>More tools and help</summary>
        <div className="musicStudioUtilityLinks">
          <Link href="/guide">Guide</Link>
          <Link href="/stem-studio">Direct Stem Studio</Link>
          <Link href="/stem-lab">Stem Lab</Link>
          <Link href="/stem-agent/status">Operations status</Link>
          <Link href="/login">Sign in</Link>
        </div>
      </details>
      <details onToggle={(event) => setShowStatus(event.currentTarget.open)}>
        <summary>Production status</summary>
        <div className="musicStudioStatusGrid" aria-live="polite">
          <span>Control plane <strong>{!readiness ? "Checking…" : readiness.capabilities?.controlPlaneReady ? "Ready" : "Check"}</strong></span>
          <span>Controller <strong>{!readiness ? "Checking…" : readiness.capabilities?.controllerOnline ? "Online" : "Offline"}</strong></span>
          <span>Compute <strong>{!readiness ? "Checking…" : readiness.capabilities?.computeReady ? "Online" : "Standby"}</strong></span>
          <span>Saved outputs <strong>{!readiness ? "Checking…" : readiness.capabilities?.permanentOutputs ? "Ready" : "Check"}</strong></span>
        </div>
        {readiness?.nextAction && <p>{readiness.nextAction}</p>}
      </details>
    </div>
    {ready && <p className="musicStudioPageNote">Bookmark this studio page. The detailed tools remain available when you open a work area.</p>}
  </main>;
}
