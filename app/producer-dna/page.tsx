"use client";

import Link from "next/link";
import { ProducerDnaPanel } from "@/app/components/ProducerDnaPanel";
import "@/app/studio/musicStudio.css";

export default function ProducerDnaPage(): React.JSX.Element {
  return (
    <main className="musicStudioHome">
      <header className="musicStudioTopbar">
        <Link className="musicStudioBrand" href="/studio">
          <span className="musicStudioMark">M</span>
          <span><strong>TM Music Studio</strong><small>Producer DNA</small></span>
        </Link>
        <nav>
          <Link href="/studio">Studio</Link>
          <Link href="/">Song Workspace</Link>
          <Link href="/stem-agent">Stem Director</Link>
          <Link href="/dashboard">Projects</Link>
        </nav>
      </header>

      <section className="tmModuleHero">
        <p className="musicStudioKicker">PRODUCER DNA</p>
        <h1>Study the decisions behind the sound.</h1>
        <p>Research production traits, scenes, arrangement logic, rhythmic language, technical choices, and creative directions—then translate the insight into original TM Music Studio decisions.</p>
      </section>

      <section className="tmProducerDnaWrap">
        <ProducerDnaPanel />
      </section>
    </main>
  );
}
