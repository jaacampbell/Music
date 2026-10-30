import Link from "next/link";

export default function InstrumentCleanupPage(): React.JSX.Element {
  return <main style={{ maxWidth: 760, margin: "3rem auto", padding: "1.5rem", color: "#e9e6f2" }}>
    <p style={{ color: "#b9a0ff", letterSpacing: ".12em" }}>MUSIC OS · INSTRUMENT CLEANUP</p>
    <h1 style={{ fontSize: "2.5rem", margin: ".7rem 0" }}>Clean &amp; Match</h1>
    <p>Professional cleanup now runs inside Stem Director, after you separate the Core 6 stems.
      The same authenticated worker cleans and reference-matches your track, then exports a
      synchronized 24-bit Ableton ZIP and processed master.</p>
    <p>Open Stem Director, finish Core 6 separation, and look for the <strong>Clean &amp; Match</strong> section.
      The button becomes available when the updated worker image reports Cleanup support.</p>
    <p style={{ marginTop: 24 }}><Link style={{ color: "#d3baff", fontWeight: 700 }} href="/stem-agent">Open Stem Director →</Link></p>
    <p style={{ opacity: .72, marginTop: 24, fontSize: 13 }}>References guide tonal EQ only. Deep isolates can overlap.
      Automatic audio-to-MIDI and pitch correction are not included in this module.</p>
  </main>;
}
