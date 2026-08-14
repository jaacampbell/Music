import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Start with the song idea",
    body: "Create a project and describe the sound in ordinary language. Include the mood, energy, tempo if you know it, instruments you hear, vocal style, and anything you do not want changed."
  },
  {
    number: "02",
    title: "Build the Sound Profile",
    body: "Sound Profile is the beginner-friendly name for Song DNA. It organizes BPM, key, mood, vocal space, structure, and the main sonic ingredients. If you do not know the technical details, the app can help analyze them."
  },
  {
    number: "03",
    title: "Review Production Directions",
    body: "Production Directions are the different approaches the system can take with your idea. In Studio mode this is called the Prompt Pack. Use these directions to explore without losing the original goal of the song."
  },
  {
    number: "04",
    title: "Compare Versions",
    body: "Versions lets you compare strengths and weaknesses instead of judging a track only by whether you like it. Look for atmosphere, drum bounce, bass movement, vocal space, transitions, and overall emotional fit."
  },
  {
    number: "05",
    title: "Separate Song Parts / Stems",
    body: "A stem is one isolated part of the track. Open Stem Studio when you need real audio separation. Use the simpler Core workflow for common parts or the deeper target library when you need a specific vocal, drum, instrument, or effect isolated."
  },
  {
    number: "06",
    title: "Review, mix, and revise",
    body: "Use Song Review and Mix Feedback to document what is working and what should change. Plain-language notes are encouraged. The Revision Loop converts those decisions into the next production direction."
  },
  {
    number: "07",
    title: "Prepare the DAW handoff",
    body: "When the production direction is ready, use the export area to plan the handoff. For real separated WAV downloads, use Stem Studio. Your DAW is the music software where you record, arrange, mix, and finish the song."
  }
];

const glossary = [
  ["BPM", "Beats per minute — how fast the song is."],
  ["Key", "The note and scale that act as the musical center of the song."],
  ["Stem", "One isolated song part, such as vocals, drums, bass, guitar, or piano."],
  ["Sound Profile / Song DNA", "A structured description of the song's tempo, key, mood, arrangement, vocal space, and sonic palette."],
  ["Producer DNA", "Research about broad production traits, scenes, techniques, and creative patterns. It should guide original work, not copy a recording."],
  ["Prompt Pack", "Advanced name for Production Directions: instructions describing different ways to build the sound."],
  ["Scorecard", "A structured review of areas such as emotion, originality, vocal space, low end, replay value, and readiness."],
  ["Revision Loop", "Review → decide what to change → create the next direction → review again."],
  ["LUFS", "A loudness measurement used mainly during mixing and mastering."],
  ["DAW", "Digital Audio Workstation. Examples include Logic Pro, Ableton Live, FL Studio, Pro Tools, Studio One, and REAPER."],
  ["Core stems", "A smaller synchronized set of major song parts intended for normal mixing workflows."],
  ["Deep targets", "More specific AI isolates such as ad-libs, background vocals, kick, snare, strings, ambience, or other named elements."]
] as const;

export default function GuidePage(): React.JSX.Element {
  return (
    <main className="musicOs">
      <header className="topbar">
        <div>
          <div className="brandRow"><span className="brandMark">M</span><strong>Music OS Guide</strong></div>
          <p className="brandSub">A plain-language walkthrough of the production system</p>
        </div>
        <div className="topActions"><Link className="topLink" href="/">← Back to Music OS</Link><Link className="topLink" href="/stem-studio">Stem Studio</Link></div>
      </header>

      <section className="welcomePanel" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <div className="eyebrow">Getting started</div>
          <h1>You do not need to speak “producer” to use Music OS.</h1>
          <p>Start with what you hear and what you want. Guided mode explains the workflow in regular language; Studio mode keeps the deeper production, agent, research, and technical controls available when you need them.</p>
        </div>
      </section>

      <section className="card" style={{ marginBottom: "1rem" }}>
        <div className="eyebrow">The simple workflow</div>
        <h2>Idea → Sound → Versions → Stems → Review → Mix → Export</h2>
        <p className="meta">You do not have to complete every feature every time. Music OS should always show you a recommended next step based on what your project already contains.</p>
      </section>

      <section className="stackList" style={{ marginBottom: "1rem" }}>
        {steps.map((step) => (
          <article className="card" key={step.number}>
            <div style={{ display: "flex", gap: ".85rem", alignItems: "flex-start" }}>
              <span className="tabNumber" style={{ width: 38, height: 38, flex: "0 0 auto" }}>{step.number}</span>
              <div><h2 style={{ marginTop: 0 }}>{step.title}</h2><p className="meta" style={{ fontSize: ".9rem", lineHeight: 1.65 }}>{step.body}</p></div>
            </div>
          </article>
        ))}
      </section>

      <section className="contentGrid" style={{ marginBottom: "1rem" }}>
        <article className="card">
          <div className="eyebrow">Guided mode</div>
          <h2>Use this when you want the app to lead.</h2>
          <ul className="plainList">
            <li>Plain-language labels</li>
            <li>Project progress</li>
            <li>Recommended next step</li>
            <li>Less technical information on screen</li>
            <li>Built-in glossary and explanations</li>
          </ul>
        </article>
        <article className="card">
          <div className="eyebrow">Studio mode</div>
          <h2>Use this when you want direct control.</h2>
          <ul className="plainList">
            <li>Agent commands</li>
            <li>Batch tasks</li>
            <li>Technical names alongside beginner labels</li>
            <li>Producer DNA research</li>
            <li>Advanced planning and telemetry details</li>
          </ul>
        </article>
      </section>

      <section className="card" style={{ marginBottom: "1rem" }}>
        <div className="eyebrow">Stem Studio</div>
        <h2>When should I use stem separation?</h2>
        <p className="meta" style={{ fontSize: ".9rem", lineHeight: 1.65 }}>Use Stem Studio when you have an actual audio file and want individual parts. A normal use case might be separating vocals from a beat, getting drums and bass on their own, or isolating a specific part for remixing, arranging, mixing, reference, or reconstruction work.</p>
        <div className="actionRow"><Link className="primaryButton linkButton" href="/stem-studio">Open Stem Studio →</Link></div>
      </section>

      <section className="card">
        <div className="eyebrow">Glossary</div>
        <h2>What everything means</h2>
        <div className="stackList">
          {glossary.map(([term, definition]) => (
            <div className="listCard" key={term}><strong>{term}</strong><p className="meta">{definition}</p></div>
          ))}
        </div>
      </section>
    </main>
  );
}
