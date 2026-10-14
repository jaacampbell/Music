"use client";
import { useState } from "react";
import Link from "next/link";

const separator = process.env.NEXT_PUBLIC_SEPARATOR_URL ?? "http://localhost:8000";
const cleaner = process.env.NEXT_PUBLIC_CLEANUP_URL ?? "http://localhost:8001";

type Result = { jobId: string; stems: { name: string; url: string }[]; masterUrl: string; zipUrl: string; midiExtracted: boolean; pitchCorrected: boolean };

export default function InstrumentCleanup() {
  const [source, setSource] = useState<File | null>(null);
  const [reference, setReference] = useState<File | null>(null);
  const [status, setStatus] = useState("Ready to process");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  async function process() {
    if (!source || busy) return;
    setBusy(true); setResult(null);
    try {
      setStatus("Separating six synchronized stems…");
      const form = new FormData(); form.append("file", source); form.append("mode", "core");
      const separation = await fetch(`${separator}/separate`, { method: "POST", body: form });
      if (!separation.ok) throw new Error(await separation.text());
      const manifest = await separation.json() as { jobId: string };
      setStatus("Cleaning stems and matching tonal reference…");
      const options = new FormData();
      if (reference) options.append("reference", reference);
      options.append("denoise", "0.3"); options.append("match", reference ? "0.3" : "0");
      const response = await fetch(`${cleaner}/cleanup/jobs/${manifest.jobId}`, { method: "POST", body: options });
      if (!response.ok) throw new Error(await response.text());
      setResult(await response.json() as Result);
      setStatus("Complete — download Ableton-ready files");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Processing failed");
    } finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 780, margin: "auto", padding: "3rem 1.25rem", color: "#f3f3f5" }}>
    <Link href="/stem-studio">← Stem Studio</Link>
    <p style={{ color: "#a78bfa", marginTop: 32 }}>MUSIC OS · AUDIO RESTORATION</p>
    <h1 style={{ fontSize: "2.5rem", fontWeight: 750 }}>Instrument Cleanup</h1>
    <p>Separate, restore, and reference-match your track while keeping the arrangement intact.</p>
    <div style={{ display: "grid", gap: 18, marginTop: 28 }}>
      <label>Original song (required)<input style={{ display: "block", marginTop: 8 }} type="file" accept="audio/*,.wav,.mp3,.flac" onChange={e => setSource(e.target.files?.[0] ?? null)} /></label>
      <label>Reference track (optional)<input style={{ display: "block", marginTop: 8 }} type="file" accept="audio/*,.wav,.mp3,.flac" onChange={e => setReference(e.target.files?.[0] ?? null)} /></label>
      <div style={{ padding: 16, border: "1px solid #555", borderRadius: 12 }}>✓ Separate Core 6 stems<br/>✓ Conservative cleanup<br/>✓ Reference EQ matching when provided<br/>✓ Aligned 24-bit WAV export</div>
      <button disabled={!source || busy} onClick={process} style={{ background: "#8b5cf6", color: "white", padding: 16, borderRadius: 12, opacity: !source || busy ? .5 : 1 }}>{busy ? "Processing…" : "Clean & Match"}</button>
      <p role="status" aria-live="polite">{status}</p>
      {result && <section><h2>Completed files</h2>{result.stems.map(s => <p key={s.name}><a href={cleaner+s.url} download>{s.name} — WAV ↓</a></p>)}<p><a href={cleaner+result.masterUrl} download>Master WAV ↓</a></p><p><a href={cleaner+result.zipUrl} download>Ableton stems + master ZIP ↓</a></p><small>Audio-to-MIDI and pitch correction are not active in this version.</small></section>}
    </div>
  </main>;
}
