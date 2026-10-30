"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DEFAULT_CHAIN } from "@/lib/tm-vocal/chain";
import { measure, type Measurement } from "@/lib/tm-vocal/audio";
import {
  classifySunoStem,
  learnSunoDna,
  type LearnedSunoDna,
  type SunoStemRole,
  type SunoTransferAsset,
} from "@/lib/tm-vocal/suno-transfer";
import "./sunoTransfer.css";

type LoadedAsset = SunoTransferAsset & { file: File };

const roleLabel: Record<SunoStemRole, string> = {
  reference_mix: "Reference Mix",
  processed_lead: "Processed Lead",
  raw_lead: "Raw Lead",
  backing_vocals: "Backing Vocals",
  drums: "Drums",
  bass: "Bass",
  music: "Music",
  fx: "FX",
  instrumental: "Instrumental",
  unknown: "Unassigned",
};

async function decode(file: File): Promise<Measurement> {
  const ctx = new AudioContext();
  try {
    const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
    return await measure(buffer);
  } finally {
    await ctx.close();
  }
}

export default function SunoTransferPage(): React.JSX.Element {
  const [assets, setAssets] = useState<LoadedAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Drop in the WAVs exported from Suno Studio. TM will sort the session automatically.");
  const [learned, setLearned] = useState<LearnedSunoDna | null>(null);

  const raw = assets.find((a) => a.role === "raw_lead");
  const processed = assets.find((a) => a.role === "processed_lead");
  const referenceMix = assets.find((a) => a.role === "reference_mix");
  const ready = Boolean(raw && processed);

  const grouped = useMemo(() => {
    const roles = Object.keys(roleLabel) as SunoStemRole[];
    return roles.map((role) => ({ role, items: assets.filter((a) => a.role === role) })).filter((g) => g.items.length);
  }, [assets]);

  async function ingest(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("audio/") || /\.(wav|mp3|m4a|flac|aiff?)$/i.test(f.name));
    if (!list.length) return;
    setBusy(true);
    setNotice(`Analyzing ${list.length} audio files…`);
    try {
      const next: LoadedAsset[] = [];
      for (const file of list.slice(0, 30)) {
        const measurement = await decode(file);
        const guess = classifySunoStem(file.name);
        next.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          role: guess.role,
          confidence: guess.confidence,
          measurement,
        });
      }
      setAssets(next);
      setLearned(null);
      setNotice("Session imported. Confirm the raw and Suno-processed JO₵YN vocal assignments, then learn the DNA.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not decode one of the audio files.");
    } finally {
      setBusy(false);
    }
  }

  function setRole(id: string, role: SunoStemRole) {
    setAssets((current) => current.map((a) => a.id === id ? { ...a, role, confidence: 1 } : a));
    setLearned(null);
  }

  function learn() {
    const r = assets.find((a) => a.role === "raw_lead");
    const p = assets.find((a) => a.role === "processed_lead");
    if (!r || !p) return;
    const result = learnSunoDna({ raw: r, processed: p, referenceMix: assets.find((a) => a.role === "reference_mix"), assets, baseChain: DEFAULT_CHAIN });
    localStorage.setItem("tm:suno-dna:latest", JSON.stringify(result));
    setLearned(result);
    setNotice("JO₵YN Suno DNA learned and saved on this device. TM Vocal will load it as a starting profile.");
  }

  return (
    <main className="st">
      <header className="stTop">
        <Link href="/studio">TM MUSIC STUDIO</Link>
        <nav><Link href="/tm-vocal">TM Vocal</Link><Link href="/stem-agent">Stem Director</Link></nav>
      </header>

      <section className="stHero">
        <p className="stKicker">SUNO TRANSFER · LEARN FROM THE MIX</p>
        <h1>Suno can teach TM<br/><em>your finished sound.</em></h1>
        <p>Import the time-aligned multitracks or a short 30–60 second test. TM compares your dry performance to the Suno-processed version and converts the difference into reusable JO₵YN production DNA.</p>
      </section>

      <div className="stNotice">{notice}</div>

      <section className="stImport">
        <label>
          <span>01 / IMPORT SUNO EXPORTS</span>
          <strong>{assets.length ? `${assets.length} audio files loaded` : "Choose all exported WAVs at once"}</strong>
          <small>Recommended: raw JO₵YN lead, Suno-processed JO₵YN lead, full rough mix, instrumental, backing vocals, drums, bass, music and FX.</small>
          <input type="file" accept="audio/*,.wav,.mp3,.m4a,.flac,.aif,.aiff" multiple disabled={busy} onChange={(e) => e.target.files && void ingest(e.target.files)} />
        </label>
      </section>

      {assets.length > 0 && (
        <section className="stGrid">
          <div className="stPanel">
            <div className="stHead"><div><p className="stKicker">AUTO-MAPPED SESSION</p><h2>Confirm the stems.</h2></div><span>{assets.length} FILES</span></div>
            <div className="stAssetList">
              {assets.map((asset) => (
                <article key={asset.id}>
                  <div><strong>{asset.name}</strong><small>{asset.measurement.duration.toFixed(1)}s · {asset.measurement.peakDb.toFixed(1)} dBFS peak · {(asset.confidence * 100).toFixed(0)}% filename confidence</small></div>
                  <select value={asset.role} onChange={(e) => setRole(asset.id, e.target.value as SunoStemRole)}>
                    {(Object.keys(roleLabel) as SunoStemRole[]).map((role) => <option value={role} key={role}>{roleLabel[role]}</option>)}
                  </select>
                </article>
              ))}
            </div>
          </div>

          <aside className="stPanel stLearn">
            <p className="stKicker">02 / JO₵YN SUNO DNA</p>
            <h2>Learn the before → after.</h2>
            <div className="stRequirement"><span>{raw ? "✓" : "○"}</span><div><strong>Raw JO₵YN vocal</strong><small>{raw?.name ?? "Assign one file as Raw Lead"}</small></div></div>
            <div className="stRequirement"><span>{processed ? "✓" : "○"}</span><div><strong>Suno-processed JO₵YN vocal</strong><small>{processed?.name ?? "Assign one file as Processed Lead"}</small></div></div>
            <div className="stRequirement"><span>{referenceMix ? "✓" : "○"}</span><div><strong>Full Suno rough mix</strong><small>{referenceMix?.name ?? "Optional but strongly recommended"}</small></div></div>
            <button className="stPrimary" disabled={!ready || busy} onClick={learn}>LEARN FROM SUNO MIX</button>

            {learned && (
              <div className="stDna">
                <span>PROFILE</span><strong>{learned.name}</strong>
                <span>CONFIDENCE</span><strong>{Math.round(learned.confidence * 100)}%</strong>
                <span>TONAL MOVE</span><strong>{learned.chain.warmth?.toFixed(1)} body · {learned.chain.presence?.toFixed(1)} presence · {learned.chain.air?.toFixed(1)} air</strong>
                <span>PROCESSING</span><strong>{learned.studioGrade.serialCompression}% serial comp · {learned.studioGrade.fxDuck}% FX duck</strong>
              </div>
            )}

            {learned && <Link className="stPrimary stLink" href="/tm-vocal?sunoTransfer=1">Open TM Vocal with this DNA →</Link>}
          </aside>
        </section>
      )}

      {grouped.length > 0 && (
        <section className="stPanel">
          <p className="stKicker">SESSION MAP</p>
          <div className="stMap">
            {grouped.map((g) => <div key={g.role}><span>{roleLabel[g.role]}</span><strong>{g.items.length}</strong></div>)}
          </div>
        </section>
      )}

      <section className="stFlow">
        <div><span>01</span><strong>Suno creates the sonic world</strong><small>Generate, separate, process or arrange there only when it adds value.</small></div>
        <div><span>02</span><strong>TM learns your treatment</strong><small>Raw JO₵YN → Suno-processed JO₵YN becomes the personal training target.</small></div>
        <div><span>03</span><strong>TM becomes the finishing room</strong><small>Reference DNA → Vocal Fusion → Reference Master without needing Suno every time.</small></div>
      </section>
    </main>
  );
}
