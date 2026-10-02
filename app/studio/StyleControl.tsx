"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeAudioFile } from "@/lib/browser-audio-analysis";
import {
  DEFAULT_STYLE_CONTROL,
  clearStyleReferenceFile,
  loadStyleControl,
  saveStyleControl,
  saveStyleReferenceFile,
  type StyleControlState,
  type UnexpectedStyleCategory
} from "@/lib/style-control";

const textures = ["dry", "warm", "dark", "airy", "gritty", "analog", "glossy", "distorted", "wide", "intimate", "lo-fi", "hi-fi"];
const genres = ["Afro-club rap", "hard reggaetón", "trap", "R&B", "house", "dancehall", "Afrobeats", "jersey club", "pop rap", "alternative R&B", "cinematic hip-hop", "electronic"];
const unexpectedLabels: Record<UnexpectedStyleCategory, string> = {
  rhythm: "Rhythm",
  instrumentation: "Instrumentation",
  harmony: "Harmony",
  production: "Production",
  vocalTreatment: "Vocal treatment"
};

function TagEditor({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = (): void => {
    const next = draft.split(",").map((value) => value.trim()).filter(Boolean);
    if (!next.length) return;
    onChange(Array.from(new Set([...values, ...next])).slice(0, 24));
    setDraft("");
  };
  return <div className="styleField"><label>{label}</label><div className="styleTagInput"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} /><button type="button" onClick={add}>Add</button></div><div className="styleTags">{values.map((value) => <button type="button" key={value} onClick={() => onChange(values.filter((item) => item !== value))}>{value}<span>×</span></button>)}</div></div>;
}

function Slider({ label, value, onChange, hint }: { label: string; value: number; onChange: (value: number) => void; hint: string }) {
  return <label className="styleSlider"><div><strong>{label}</strong><span>{value}%</span></div><input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))}/><small>{hint}</small></label>;
}

export function StyleControl({ projectId: linkedProjectId }: { projectId?: string | null } = {}): React.JSX.Element {
  const [value, setValue] = useState<StyleControlState>(DEFAULT_STYLE_CONTROL);
  const [status, setStatus] = useState("Controls are saved in this browser and travel with Stem Director jobs.");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const locationProjectId = useMemo(() => typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("projectId"), []);
  const projectId = linkedProjectId ?? locationProjectId;

  useEffect(() => setValue(loadStyleControl()), []);

  const update = (patch: Partial<StyleControlState>): void => setValue((current) => ({ ...current, ...patch }));

  const persist = (): void => {
    const saved = saveStyleControl(value);
    setValue(saved);
    setStatus("Style Control saved. New Stem Director and refinement jobs will use this configuration.");
  };

  const toggleListValue = (key: "soundTextures" | "genreArchetypes", item: string): void => {
    const current = value[key];
    update({ [key]: current.includes(item) ? current.filter((value) => value !== item) : [...current, item] } as Pick<StyleControlState, typeof key>);
  };

  const handleReference = async (file: File): Promise<void> => {
    setStatus(`Analyzing ${file.name}…`);
    try {
      const analysis = await analyzeAudioFile(file);
      await saveStyleReferenceFile(file);
      update({ referenceAudio: { name: file.name, size: file.size, type: file.type || "audio/*", lastModified: file.lastModified, weight: value.referenceAudio?.weight ?? 65, role: value.referenceAudio?.role ?? "overall", analysis } });
      setStatus(`Reference loaded · ${analysis.bpm ?? "?"} BPM · ${analysis.key ?? "key unavailable"}.`);
    } catch {
      await saveStyleReferenceFile(file);
      update({ referenceAudio: { name: file.name, size: file.size, type: file.type || "audio/*", lastModified: file.lastModified, weight: value.referenceAudio?.weight ?? 65, role: value.referenceAudio?.role ?? "overall" } });
      setStatus("Reference saved. Browser analysis was unavailable, but the file remains attached locally.");
    }
  };

  const clearReference = async (): Promise<void> => {
    await clearStyleReferenceFile();
    update({ referenceAudio: null });
    setStatus("Reference audio cleared.");
  };

  const stemHref = projectId ? `/stem-agent?projectId=${encodeURIComponent(projectId)}` : "/stem-agent";

  return <section className="styleControl">
    <div className="styleControlHead"><div><p className="musicStudioKicker">AI STYLE CONTROL</p><h2>Direct the sound before the model makes decisions.</h2><p>Granular inclusion, exclusion, influence, controlled randomness, reference anchoring, and unexpected-style injection.</p></div><div className="styleControlHeadActions"><button className="musicStudioSecondary" type="button" onClick={() => { setValue(DEFAULT_STYLE_CONTROL); setStatus("Defaults restored. Save to apply."); }}>Reset</button><button className="musicStudioPrimary" type="button" onClick={persist}>Save controls</button></div></div>

    <div className="styleControlGrid">
      <div className="stylePanel stylePanelWide">
        <div className="stylePanelTitle"><span>01</span><div><h3>Style tags</h3><p>Tell the planner what belongs—and what absolutely does not.</p></div></div>
        <div className="styleTwoCol"><TagEditor label="Include styles" values={value.includeTags} onChange={(includeTags) => update({ includeTags })} placeholder="dark bass, dry dembow, clipped brass…"/><TagEditor label="Exclude styles" values={value.excludeTags} onChange={(excludeTags) => update({ excludeTags })} placeholder="pop chorus, cartoon horns…"/></div>
      </div>

      <div className="stylePanel">
        <div className="stylePanelTitle"><span>02</span><div><h3>Influence</h3><p>Control how strongly the configuration steers output.</p></div></div>
        <Slider label="Vocal influence" value={value.vocalInfluence} onChange={(vocalInfluence) => update({ vocalInfluence })} hint="How much vocal identity and treatment should guide decisions."/>
        <Slider label="Style influence" value={value.styleInfluence} onChange={(styleInfluence) => update({ styleInfluence })} hint="Strength of tags, genre archetypes, textures, and weighting."/>
        <Slider label="Weirdness" value={value.weirdness} onChange={(weirdness) => update({ weirdness })} hint="Higher values invite less-obvious choices and combinations."/>
      </div>

      <div className="stylePanel">
        <div className="stylePanelTitle"><span>03</span><div><h3>Variation engine</h3><p>Choose how repeatable or exploratory each iteration should be.</p></div></div>
        <Slider label="Variety" value={value.variety} onChange={(variety) => update({ variety })} hint="Distance between candidate creative directions."/>
        <Slider label="Randomization" value={value.randomization} onChange={(randomization) => update({ randomization })} hint="Entropy applied to otherwise valid stylistic decisions."/>
        <label className="styleSelect">Seed behavior<select value={value.seedMode} onChange={(event) => update({ seedMode: event.target.value as StyleControlState["seedMode"] })}><option value="guided">Guided</option><option value="locked">Locked / repeatable</option><option value="fresh">Fresh every run</option></select></label>
        {value.seedMode === "locked" && <label className="styleSelect">Seed<input type="number" value={value.seed ?? 1} onChange={(event) => update({ seed: Number(event.target.value) || 1 })}/></label>}
      </div>

      <div className="stylePanel stylePanelWide">
        <div className="stylePanelTitle"><span>04</span><div><h3>Unexpected style injection</h3><p>Five controlled lanes for intentional surprise without losing the core direction.</p></div></div>
        <div className="unexpectedGrid">{(Object.keys(unexpectedLabels) as UnexpectedStyleCategory[]).map((key) => {
          const item = value.unexpected[key];
          return <div className={`unexpectedCard ${item.enabled ? "active" : ""}`} key={key}><label className="unexpectedToggle"><input type="checkbox" checked={item.enabled} onChange={(event) => update({ unexpected: { ...value.unexpected, [key]: { ...item, enabled: event.target.checked } } })}/><strong>{unexpectedLabels[key]}</strong></label><input value={item.value} disabled={!item.enabled} onChange={(event) => update({ unexpected: { ...value.unexpected, [key]: { ...item, value: event.target.value } } })} placeholder="e.g. broken-beat pocket"/><div className="unexpectedIntensity"><span>Intensity</span><strong>{item.intensity}%</strong></div><input type="range" min="0" max="100" value={item.intensity} disabled={!item.enabled} onChange={(event) => update({ unexpected: { ...value.unexpected, [key]: { ...item, intensity: Number(event.target.value) } } })}/></div>;
        })}</div>
      </div>

      <div className="stylePanel stylePanelWide">
        <div className="stylePanelTitle"><span>05</span><div><h3>Reference audio</h3><p>Anchor decisions to a real audio reference and measured browser analysis.</p></div></div>
        <div className="referenceDrop" onClick={() => fileRef.current?.click()}><input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.m4a,.flac,.aiff" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleReference(file); }}/><div><strong>{value.referenceAudio?.name ?? "Drop or choose reference audio"}</strong><span>{value.referenceAudio?.analysis ? `${value.referenceAudio.analysis.bpm ?? "?"} BPM · ${value.referenceAudio.analysis.key ?? "Key unavailable"} · ${Math.round(value.referenceAudio.analysis.durationSec)}s` : "WAV, MP3, M4A, FLAC or AIFF"}</span></div><button type="button">Choose file</button></div>
        {value.referenceAudio && <div className="referenceControls"><label className="styleSelect">Reference role<select value={value.referenceAudio.role} onChange={(event) => update({ referenceAudio: { ...value.referenceAudio!, role: event.target.value as NonNullable<StyleControlState["referenceAudio"]>["role"] } })}><option value="overall">Overall style</option><option value="style">Style only</option><option value="vocal">Vocal character</option><option value="production">Production / mix</option><option value="rhythm">Rhythm / groove</option></select></label><Slider label="Reference weight" value={value.referenceAudio.weight} onChange={(weight) => update({ referenceAudio: { ...value.referenceAudio!, weight } })} hint="How much the reference should influence planning."/><button type="button" className="styleDanger" onClick={() => void clearReference()}>Remove reference</button></div>}
      </div>

      <div className="stylePanel">
        <div className="stylePanelTitle"><span>06</span><div><h3>Vocal metadata</h3><p>Guide voice-aware planning without forcing a single treatment.</p></div></div>
        <label className="styleSelect">Vocal gender<select value={value.vocalGender} onChange={(event) => update({ vocalGender: event.target.value as StyleControlState["vocalGender"] })}><option value="unspecified">Unspecified</option><option value="male">Male</option><option value="female">Female</option><option value="androgynous">Androgynous</option><option value="mixed">Mixed ensemble</option></select></label>
        <div className="styleChoiceCloud">{textures.map((item) => <button type="button" className={value.soundTextures.includes(item) ? "active" : ""} key={item} onClick={() => toggleListValue("soundTextures", item)}>{item}</button>)}</div>
      </div>

      <div className="stylePanel">
        <div className="stylePanelTitle"><span>07</span><div><h3>Genre archetypes</h3><p>Stack broad archetypes without flattening them into one label.</p></div></div>
        <div className="styleChoiceCloud">{genres.map((item) => <button type="button" className={value.genreArchetypes.includes(item) ? "active" : ""} key={item} onClick={() => toggleListValue("genreArchetypes", item)}>{item}</button>)}</div>
      </div>

      <div className="stylePanel stylePanelWide">
        <div className="stylePanelTitle"><span>08</span><div><h3>Weighted style blend</h3><p>Assign percentage influence to named creative lanes.</p></div></div>
        <div className="weightRows">{value.styleWeights.map((item, index) => <div className="weightRow" key={index}><input value={item.label} onChange={(event) => update({ styleWeights: value.styleWeights.map((row, rowIndex) => rowIndex === index ? { ...row, label: event.target.value } : row) })}/><input type="range" min="0" max="100" value={item.weight} onChange={(event) => update({ styleWeights: value.styleWeights.map((row, rowIndex) => rowIndex === index ? { ...row, weight: Number(event.target.value) } : row) })}/><strong>{item.weight}%</strong><button type="button" onClick={() => update({ styleWeights: value.styleWeights.filter((_, rowIndex) => rowIndex !== index) })}>×</button></div>)}</div>
        <button type="button" className="styleAddWeight" onClick={() => update({ styleWeights: [...value.styleWeights, { label: "New influence", weight: 20 }].slice(0, 8) })}>+ Add style weight</button>
      </div>
    </div>

    <div className="styleControlFooter"><p>{status}</p><div><button className="musicStudioSecondary" type="button" onClick={persist}>Save configuration</button><Link className="musicStudioPrimary" href={stemHref} onClick={persist}>Apply in Stem Director →</Link></div></div>
  </section>;
}
