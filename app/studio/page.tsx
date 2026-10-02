"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./musicStudio.css";
import { StyleControl } from "./StyleControl";
import { StudioAssistant } from "./StudioAssistant";

type Readiness = {
  status?: string;
  capabilities?: {
    controlPlaneReady?: boolean;
    controllerOnline?: boolean;
    controllerBootstrap?: boolean;
    computeReady?: boolean;
    deepReady?: boolean;
    permanentOutputs?: boolean;
    cloudRecovery?: boolean;
  };
  nextAction?: string;
};

const cards = [
  {
    eyebrow: "ASSIST",
    title: "TM Assistant",
    description: "Use the built-in project-aware development assistant for songwriting, production decisions, mix priorities, release prep, branding, publishing workflow, and next steps.",
    href: "#tm-assistant",
    badge: "AI + Project Context"
  },
  {
    eyebrow: "DNA",
    title: "Producer DNA",
    description: "Research production traits, rhythm, arrangement logic, technical decisions, scenes, and creative directions without copying another artist too closely.",
    href: "/producer-dna",
    badge: "Research System"
  },
  {
    eyebrow: "CREATE",
    title: "Start / Resume Song",
    description: "Open the song workspace for concept, Song DNA, arrangement, revisions, mix notes, and project history.",
    href: "/",
    badge: "Song Workspace"
  },
  {
    eyebrow: "STEMS",
    title: "Stem Director",
    description: "Use the production worker mesh for Core 6, Deep isolation, durable cloud staging, recovery, and permanent private outputs.",
    href: "/stem-agent",
    badge: "Production"
  },
  {
    eyebrow: "MIDI",
    title: "MIDI Shredder",
    description: "Turn isolated vocals, bass, keys, guitar, and melodies into playable MIDI for Ableton and other DAWs.",
    href: "/midi-shredder",
    badge: "Audio → MIDI"
  },
  {
    eyebrow: "VOCALS",
    title: "Vocal Isolation",
    description: "Open Stem Director and focus on lead vocals, backgrounds, doubles, ad-libs, and instrumental-ready separation.",
    href: "/stem-agent?strategy=vocal-suite",
    badge: "Fast path"
  },
  {
    eyebrow: "PROJECTS",
    title: "Song Dashboard",
    description: "Manage private projects, versions, files, timestamped notes, credits, ownership, release prep, and saved decisions.",
    href: "/dashboard",
    badge: "Persistent"
  },
  {
    eyebrow: "LISTEN",
    title: "Player",
    description: "Review private uploads and versions across devices without opening the full production workspace.",
    href: "/player",
    badge: "Cloud + local"
  },
  {
    eyebrow: "EXPORT",
    title: "DAW / Ableton Handoff",
    description: "Prepare organized WAV stems, production notes, and project handoff packages for Ableton, engineers, collaborators, or archive.",
    href: "/?mode=studio",
    badge: "WAV-ready"
  }
];

export default function MusicStudioHome(): React.JSX.Element {
  const [readiness, setReadiness] = useState<Readiness | null>(null);

  useEffect(() => {
    void fetch("/api/stem-agent/readiness", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<Readiness> : null)
      .then(setReadiness)
      .catch(() => setReadiness(null));
  }, []);

  const controlReady = readiness?.capabilities?.controlPlaneReady === true;
  const controllerOnline = readiness?.capabilities?.controllerOnline === true;
  const controllerBootstrap = readiness?.capabilities?.controllerBootstrap === true;
  const computeReady = readiness?.capabilities?.computeReady === true;

  return (
    <main className="musicStudioHome">
      <header className="musicStudioTopbar">
        <Link className="musicStudioBrand" href="/studio" aria-label="Music Studio home">
          <span className="musicStudioMark">M</span>
          <span><strong>JO₵YN Music Studio</strong><small>Hosted production workspace</small></span>
        </Link>
        <nav>
          <Link href="/">Song Workspace</Link>
          <Link href="#tm-assistant">TM Assistant</Link>
          <Link href="/producer-dna">Producer DNA</Link>
          <Link href="/dashboard">Projects</Link>
          <Link href="/stem-agent">Stems</Link>
          <Link href="/midi-shredder">MIDI</Link>
          <Link href="/player">Player</Link>
        </nav>
      </header>

      <section className="musicStudioHero">
        <div>
          <p className="musicStudioKicker">ONE STUDIO · ONE PROJECT GRAPH</p>
          <h1>Make the song. Separate it. Fix it. Finish it.</h1>
          <p className="musicStudioLead">
            The hosted studio is the main experience. Local tools are optional support utilities, not a requirement for normal production.
          </p>
          <div className="musicStudioHeroActions">
            <Link className="musicStudioPrimary" href="/">Open Song Workspace</Link>
            <Link className="musicStudioSecondary" href="/stem-agent">Separate Stems</Link>
          </div>
        </div>

        <aside className="musicStudioStatus">
          <p className="musicStudioStatusLabel">Production health</p>
          <div className="musicStudioStatusRow">
            <span>Control plane</span>
            <strong className={controlReady ? "good" : "warn"}>{readiness ? (controlReady ? "READY" : "CHECK") : "…"}</strong>
          </div>
          <div className="musicStudioStatusRow">
            <span>Controller</span>
            <strong className={controllerOnline ? (controllerBootstrap ? "standby" : "good") : "warn"}>
              {readiness ? (controllerOnline ? (controllerBootstrap ? "BOOTSTRAP" : "ONLINE") : "OFFLINE") : "…"}
            </strong>
          </div>
          <div className="musicStudioStatusRow">
            <span>Compute</span>
            <strong className={computeReady ? "good" : "standby"}>{readiness ? (computeReady ? "ONLINE" : "STANDBY") : "…"}</strong>
          </div>
          <div className="musicStudioStatusRow">
            <span>Durable outputs</span>
            <strong className={readiness?.capabilities?.permanentOutputs ? "good" : "warn"}>
              {readiness ? (readiness.capabilities?.permanentOutputs ? "ON" : "CHECK") : "…"}
            </strong>
          </div>
          {readiness?.nextAction && <p className="musicStudioNext">{readiness.nextAction}</p>}
        </aside>
      </section>

      <section className="musicStudioSection">
        <div className="musicStudioSectionHead">
          <div>
            <p className="musicStudioKicker">START HERE</p>
            <h2>What are you trying to do?</h2>
          </div>
          <span>Choose the job, not the technology.</span>
        </div>

        <div className="musicStudioGrid">
          {cards.map((card) => (
            <Link className="musicStudioCard" href={card.href} key={card.title}>
              <div className="musicStudioCardTop">
                <span>{card.eyebrow}</span>
                <small>{card.badge}</small>
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <strong className="musicStudioGo">Open →</strong>
            </Link>
          ))}
        </div>
      </section>

      <StudioAssistant />

      <StyleControl />

      <section className="musicStudioPipeline">
        <p className="musicStudioKicker">PRODUCTION FLOW</p>
        <div className="musicStudioFlow">
          {["Idea / Reference", "Song Project", "Audio Analysis", "Stem Director", "MIDI Shredder", "Revision + Mix", "DAW Export", "Release"].map((step, index) => (
            <div className="musicStudioFlowStep" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="musicStudioLegacy">
        <div>
          <p className="musicStudioKicker">LOCAL / LEGACY TOOLS</p>
          <h2>Available when you need them—not the default.</h2>
          <p>
            The older direct-worker Stem Studio remains available for local testing and diagnostics. Production separation should use Stem Director.
          </p>
        </div>
        <div className="musicStudioLegacyLinks">
          <Link href="/stem-studio">Direct Stem Studio</Link>
          <Link href="/stem-lab">Stem Lab</Link>
          <Link href="/stem-agent/status">Operations Status</Link>
          <Link href="/guide">Guide</Link>
        </div>
      </section>
    </main>
  );
}
