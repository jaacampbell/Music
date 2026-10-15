import Link from "next/link";
import "./tour.css";

const modules = [
  { id: "start", number: "01", eyebrow: "First session", title: "Sign in and create a song", href: "/dashboard", link: "Open Song Dashboard", steps: [
    "Open Music OS and choose Login. Sign into the account that owns your private song library.",
    "Open Dashboard and create a song project. Give the project a recognizable name; the same project ID travels between tools.",
    "Add your original audio when available. Use an actual WAV, MP3 or supported audio file rather than a text description for audio processing.",
    "Save your project and return to Dashboard to track source audio, versions, notes, and progress."
  ], tip: "For one recording, keep everything inside the same project. When a tool supports it, open the tool from your song so its projectId stays attached." },
  { id: "studio", number: "02", eyebrow: "Creative direction", title: "Use Guided Mode or Studio Mode", href: "/", link: "Open Music OS", steps: [
    "Describe what you want the song to sound like: energy, instruments, tempo, mood, vocal delivery and what must remain unchanged.",
    "Use Guided Mode for ordinary-language next steps and the Sound Profile (Song DNA).",
    "Switch to advanced Studio Mode when you want production directions, scorecards, technical settings and deeper planning.",
    "Treat suggestions and planning scores as guidance, not proof that audio was measured or produced."
  ], tip: "Example brief: 'Preserve the drums and groove. Clean up the low mids, keep the lead vocal warm and make room for the bass without changing the arrangement.'" },
  { id: "player", number: "03", eyebrow: "Library and references", title: "Listen, organize and compare versions", href: "/player", link: "Open Music Player", steps: [
    "Open the player to listen to your uploaded recordings. Some items can be stored privately in the cloud, while device-only items remain local.",
    "Add meaningful names to versions so you can tell rough mix, vocal edit, cleaned stems and final master apart.",
    "Use the Dashboard's version history, A/B playback and timestamped mix comments to note what improves or worsens.",
    "Keep the original source audio. Never overwrite your only copy with a cleaned or mastered file."
  ], tip: "Compare at similar perceived loudness. Louder almost always sounds more impressive, even if the processing is worse." },
  { id: "stems", number: "04", eyebrow: "Production separation", title: "Separate your stems", href: "/stem-agent", link: "Open Stem Director", steps: [
    "Open Stem Director for hosted jobs. Stem Studio is the direct-worker diagnostic workstation and may be unsuitable on the hosted app.",
    "Choose the Core 6 extraction when you need vocals, drums, bass, guitar, piano and other as aligned, mixable stems.",
    "Use Deep isolation only if you need more specific elements such as ad-libs, snares, strings or ambience, and the deep model is available.",
    "Start processing and wait for the worker to finish. Review job status rather than interpreting a progress bar as finished output.",
    "Preview your stems. Deep isolates may overlap each other—never sum all deep targets and expect the original song back."
  ], tip: "Core 6 stems are AI estimates, not the original studio multitrack session. Separation artifacts can remain." },
  { id: "cleanup", number: "05", eyebrow: "Feature in development", title: "Clean stems and match a reference", href: "/instrument-cleanup", link: "Open Instrument Cleanup", steps: [
    "When this feature is deployed, open Instrument Cleanup and select your original song or mix.",
    "Optionally add a reference song for conservative tonal-EQ guidance. Use a reference with a similar genre and arrangement.",
    "Optionally attach a MIDI file you already own. The cleanup workflow currently passes supplied MIDI through; it does not extract new MIDI from a stereo song or automatically tune every instrument.",
    "Click Clean & Match. The workflow requests an authenticated worker, separates Core 6 stems, applies conservative cleanup and a shared reference EQ curve, then runs integrity checks.",
    "Compare the original with the processed master. Inspect drums for softened transients, vocals for metallic noise reduction, and stereo imaging for unexpected changes.",
    "Download the synchronized 24-bit WAV stems, processed master and Ableton ZIP if integrity checks pass."
  ], tip: "Reference matching is not exact copying. Dynamics, arrangement, instrumentation and mastering decisions still require your ears. The feature is not on the production site until merged and deployed." },
  { id: "midi", number: "06", eyebrow: "Musical notes", title: "Use MIDI Shredder", href: "/midi-shredder", link: "Open MIDI Shredder", steps: [
    "Open MIDI Shredder and supply the audio or stem you want to analyze.",
    "For clearer melodic transcription, use a clean single-instrument stem when possible.",
    "Try the simple transcription workflow first. Use Pro Edit to inspect notes, timing, loop regions and estimated tempo/key/chords.",
    "Review note mistakes before exporting a MIDI file. Transcription is an estimate, especially for dense chords and percussion.",
    "Import the resulting .mid into Ableton as a separate MIDI track and assign your own compatible instrument."
  ], tip: "A MIDI note pattern does not contain the actual instrument's timbre. Audio-to-MIDI is not equivalent to preserving the original sound." },
  { id: "ableton", number: "07", eyebrow: "Ableton Live 11 Standard", title: "Import your cleaned stems", href: "/stem-agent", link: "Back to Stem Director", steps: [
    "Download the Ableton ZIP and extract it to a named folder on your Mac.",
    "Open Ableton Live 11 Standard, create a new Live Set, and switch to Arrangement View with Tab.",
    "Drag the six WAV stems into separate Audio tracks. Line up the beginning of every file at 1.1.1 (bar 1, beat 1).",
    "For printed stems that must remain precisely synchronized, turn Warp off unless you intentionally need tempo changes.",
    "Do not add the delivered full master to the playing stem sum; it duplicates the whole song. Use it as a muted A/B reference.",
    "If you supplied or exported MIDI, drag the .mid file to a MIDI track, select an Ableton Standard-compatible instrument, and verify pitch and rhythm by ear.",
    "Save the Live Set into the same project folder. Preserve the original ZIP as your source archive."
  ], tip: "The ZIP is a handoff of aligned media, not an .als Live Set. The app does not automatically install Ableton devices or create an Ableton project file." },
  { id: "review", number: "08", eyebrow: "Release-quality finishing", title: "Review, revise and deliver", href: "/dashboard", link: "Open Dashboard", steps: [
    "Listen on your main studio monitors/headphones, a phone speaker, and at least one second playback system.",
    "Check intros, fades, kick/bass balance, cymbal transients, sibilance, noise, panning and the reference A/B at comparable listening levels.",
    "If the cleaned version sounds thinner or grainier than the source, reduce processing and run again rather than forcing a technically passing result.",
    "Document the preferred version in Dashboard. Track producer and songwriter credits, splits, artwork and release metadata before distribution.",
    "Export the final deliverable that your distributor, mixer or collaborator specifically requests."
  ], tip: "Passing an automated signal-integrity check is not a certification that a track is perfectly mixed or mastered." },
];

const glossary = [
  ["Stem", "A separated audio component, for example drums, bass or vocals."],
  ["Core 6", "The six principal estimated Demucs sources: vocals, drums, bass, guitar, piano and other."],
  ["Deep isolation", "Optional narrower AI separation; individual isolates can overlap."],
  ["MIDI", "Note, timing and performance instructions—not an audio recording."],
  ["BPM", "Beats per minute, the song's tempo."],
  ["Warp", "Ableton's time-stretching feature. Disable for unchanged, synchronized printed stems."],
  ["Reference EQ", "Limited tonal-curve adjustments guided by another recording; not exact sound cloning."],
  ["dBTP", "Estimated decibels relative to true peak, including intersample peaks."],
  ["DAW", "Digital audio workstation, such as Ableton Live 11 Standard."],
];

export default function FullTourPage(): React.JSX.Element {
  return <main className="tour">
    <nav className="tourNav"><Link href="/guide">← Quick Guide</Link><Link href="/studio">Music Studio</Link><Link href="/dashboard">Dashboard</Link></nav>
    <header className="tourHero"><p className="tourEyebrow">MUSIC OS / COMPLETE WORKFLOW</p><h1>From song idea to <em>finished session.</em></h1><p>A complete walkthrough of the music workspace, including audio separation, Cleanup, MIDI and Ableton Live 11 Standard. Follow the steps in order or jump to the part you need.</p><div className="tourHeroActions"><Link href="/dashboard">Start a song →</Link><Link href="#cleanup">Jump to cleanup ↓</Link></div></header>
    <nav className="tourJump" aria-label="Tutorial chapters">{modules.map(item=><a key={item.id} href={`#${item.id}`}>{item.number} {item.title}</a>)}</nav>
    <div className="tourNotice"><strong>Availability note.</strong> The main Music OS modules are part of the existing app. Instrument Cleanup is being developed on a separate GitHub branch; its buttons will only work after the processing worker, frontend and hosting updates have been deployed together. Some production features require sign-in or an active worker.</div>
    {modules.map(item=><section className="tourChapter" id={item.id} key={item.id}><div className="tourChapterHead"><div><span className="tourEyebrow">{item.eyebrow}</span><h2><span>{item.number}</span> {item.title}</h2></div><Link href={item.href}>{item.link} ↗</Link></div><ol>{item.steps.map((step,index)=><li key={index}>{step}</li>)}</ol><p className="tourTip"><strong>Production tip:</strong> {item.tip}</p></section>)}
    <section className="tourChapter" id="issues"><div className="tourChapterHead"><div><span className="tourEyebrow">Troubleshooting</span><h2>Common questions</h2></div></div>
      <details><summary>Nothing happens when I upload a song</summary><p>Confirm you are signed in, your internet connection is active, the file decodes, and the worker is available. Large files take longer; hosted compute may need to start first. Return to Stem Director to review a submitted job.</p></details>
      <details><summary>One stem sounds metallic, watery or incomplete</summary><p>This is a possible source-separation or noise-reduction artifact. Compare with the original source and reduce the amount of cleaning. Do not assume the stem is an exact original recording.</p></details>
      <details><summary>The reference does not sound identical</summary><p>The cleanup system matches a limited tonal shape, not a producer's arrangement, instruments, processing chain, or mastered dynamics. Match perceived volume manually during listening comparisons.</p></details>
      <details><summary>The tracks drift or do not line up in Ableton</summary><p>Start every WAV file at the exact same Arrangement position and disable Warp for printed stems. Confirm all files share the sample rate and were taken from the same export package.</p></details>
      <details><summary>Why is there no new MIDI file?</summary><p>Instrument Cleanup only includes supplied MIDI files. Use MIDI Shredder for estimated audio-to-MIDI transcription and review the notes manually.</p></details>
      <details><summary>Why do I get a quality-check error?</summary><p>The worker may reject outputs with invalid sample alignment, unexpectedly large level changes, problematic stereo shifts or unsafe peaks. Retain the original; retry with gentler processing instead of bypassing quality control.</p></details>
    </section>
    <section className="tourChapter" id="glossary"><div className="tourChapterHead"><div><span className="tourEyebrow">Quick definitions</span><h2>Studio glossary</h2></div></div><div className="tourGlossary">{glossary.map(([term,definition])=><div key={term}><strong>{term}</strong><p>{definition}</p></div>)}</div></section>
    <footer className="tourFooter"><strong>Keep your original masters and multitracks.</strong><p>The tool is built to accelerate production, not replace critical listening, licensing decisions or artistic judgment.</p><Link href="/studio">Return to Music Studio →</Link></footer>
  </main>;
}