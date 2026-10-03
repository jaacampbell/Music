"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  loadActiveProjectId,
  loadStoredProjects,
  getProjectAudio,
} from "@/lib/browser-project-storage";
import { analyzeAudioFile } from "@/lib/browser-audio-analysis";
import {
  DEFAULT_CHAIN,
  MODULES,
  PARAMETERS,
  PRESETS,
  commandChain,
  presetChain,
  sanitizeChain,
  type Chain,
  type Module,
  type Parameter,
} from "@/lib/tm-vocal/chain";
import {
  buildGraph,
  connectBeat,
  encodeWav,
  measure,
  renderWet,
  renderMix,
  type Measurement,
} from "@/lib/tm-vocal/audio";
import { saveHandoff } from "@/lib/tm-vocal/handoff";
import { buildReferenceMatch, type ReferenceMatchResult } from "@/lib/tm-vocal/reference-match";
import { DEFAULT_STUDIO_GRADE, renderStudioVocal, renderStudioMix, renderReferenceMaster, type StudioGradeSettings } from "@/lib/tm-vocal/studio-grade";
import { correctVocalOnWorker, type WorkerCorrectionMeta } from "@/lib/tm-vocal/worker-correction";
import { VocalAssistant } from "./VocalAssistant";
import {
  getCurrentUser,
  supabaseRest,
  downloadPrivateFile,
} from "@/lib/persistence/supabase-rest";
import type { MusicAssetRow, MusicProjectRow } from "@/lib/persistence/types";
import "./vocal.css";
type Loaded = { file: File; buffer: AudioBuffer; measured: Measurement };
type Snapshot = { name: string; chain: Chain };
const LABELS: Record<Parameter, string> = {
  input: "Input gain (dB)",
  output: "Output gain (dB)",
  highpass: "Low cut (Hz)",
  warmth: "Body · 220 Hz (dB)",
  presence: "Presence · 3 kHz (dB)",
  air: "Air · 9 kHz (dB)",
  threshold: "Compression threshold (dB)",
  ratio: "Compression ratio",
  drive: "Saturation (%)",
  space: "Reverb blend (%)",
  echo: "Delay blend (%)",
  delayTime: "Delay time (ms)",
  width: "Double blend (%)",
};
const GROUPS: Record<Module, Parameter[]> = {
  eq: ["highpass", "warmth", "presence", "air"],
  compression: ["threshold", "ratio"],
  saturation: ["drive"],
  reverb: ["space"],
  delay: ["echo", "delayTime"],
  double: ["width"],
  limiter: [],
};
const WHY: Record<Module, string> = {
  eq: "Low cut removes sub-bass. Body preserves baritone weight; presence supports diction; air controls brightness.",
  compression:
    "Reduces level differences using the chosen threshold and ratio. Compare the result at similar loudness.",
  saturation:
    "Adds harmonic density using a soft waveshaper with 2× oversampling. Reduce drive if consonants become gritty.",
  reverb:
    "Blends a short stereo room with the dry vocal. More ambience can push the voice backward.",
  delay:
    "Adds timed echoes with restrained feedback. Match the time to the song rather than assuming a preset fits.",
  double:
    "Blends short left/right delayed copies. This is a widening effect, not a newly performed double or harmony.",
  limiter:
    "A fast high-ratio compressor helps contain peaks. Check the rendered peak before exporting; it is not a true-peak ceiling.",
};
function download(name: string, data: Blob) {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Wave({ values }: { values: number[] }) {
  return (
    <svg
      viewBox="0 0 600 100"
      role="img"
      aria-label="Waveform measured from decoded vocal"
    >
      {values.map((v, i) => (
        <rect
          key={i}
          x={i * 5}
          y={50 - v * 45}
          width="3"
          height={Math.max(1, v * 90)}
          rx="1"
        />
      ))}
    </svg>
  );
}
export default function VocalWorkspace() {
  const [chain, setChain] = useState<Chain>(DEFAULT_CHAIN),
    [undo, setUndo] = useState<Snapshot[]>([]),
    [redo, setRedo] = useState<Snapshot[]>([]);
  const [vocal, setVocal] = useState<Loaded | null>(null),
    [reference, setReference] = useState<Loaded | null>(null),
    [beat, setBeat] = useState<Loaded | null>(null);
  const [projectId, setProjectId] = useState(""),
    [projectName, setProjectName] = useState("Device session"),
    [cloudAssets, setCloudAssets] = useState<MusicAssetRow[]>([]),
    [cloudAssetId, setCloudAssetId] = useState(""),
    [hydrated, setHydrated] = useState(false);
  const [advanced, setAdvanced] = useState(false),
    [busy, setBusy] = useState(false),
    [playing, setPlaying] = useState(false),
    [bypass, setBypass] = useState(false);
  const [preset, setPreset] = useState("Baritone Forward"),
    [role, setRole] = useState("Lead"),
    [notice, setNotice] = useState(
      "Load a dry vocal to start. Audio processing stays on this device.",
    );
  const [command, setCommand] = useState(""),
    [notes, setNotes] = useState(""),
    [saved, setSaved] = useState<Snapshot[]>([]),
    [saveName, setSaveName] = useState("My signature chain");
  const [dna, setDna] = useState(""),
    [beatLevel, setBeatLevel] = useState(-9),
    [keyLabel, setKeyLabel] = useState(""),
    [pocket, setPocket] = useState(0),
    [duck, setDuck] = useState(0),
    [outputCheck, setOutputCheck] = useState<Measurement | null>(null),
    [referenceAmount, setReferenceAmount] = useState(78),
    [polish, setPolish] = useState(72),
    [glue, setGlue] = useState(68),
    [spaceMatch, setSpaceMatch] = useState(62),
    [matchResult, setMatchResult] = useState<ReferenceMatchResult | null>(null),
    [studioGrade, setStudioGrade] = useState<StudioGradeSettings>(DEFAULT_STUDIO_GRADE),
    [studioStage, setStudioStage] = useState("Ready for studio-grade render."),
    [rawBeforeCorrection, setRawBeforeCorrection] = useState<Loaded | null>(null),
    [correctionMeta, setCorrectionMeta] = useState<WorkerCorrectionMeta | null>(null);
  const player = useRef<{
    context: AudioContext;
    sources: AudioBufferSourceNode[];
  } | null>(null);
  const stop = () => {
    player.current?.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* Already ended. */
      }
    });
    void player.current?.context.close();
    player.current = null;
    setPlaying(false);
  };
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "projectId",
    );
    const id =
      requested && /^[0-9a-f-]{36}$/i.test(requested)
        ? requested
        : (loadActiveProjectId() ?? "");
    const project = loadStoredProjects().find((p) => p.id === id);
    setProjectId(id);
    setProjectName(project?.title ?? (id ? "Linked song" : "Device session"));
    try {
      const raw = JSON.parse(
        localStorage.getItem("tm-vocal:v1:" + (id || "device")) ?? "null",
      );
      if (raw) {
        setChain(sanitizeChain(raw.chain));
        setNotes(typeof raw.notes === "string" ? raw.notes : "");
        if (typeof raw.beatLevel === "number")
          setBeatLevel(Math.max(-30, Math.min(0, raw.beatLevel)));
        if (typeof raw.pocket === "number")
          setPocket(Math.max(0, Math.min(6, raw.pocket)));
        if (typeof raw.duck === "number")
          setDuck(Math.max(0, Math.min(9, raw.duck)));
        setDna(typeof raw.dna === "string" ? raw.dna : "");
        if (typeof raw.referenceAmount === "number") setReferenceAmount(Math.max(0, Math.min(100, raw.referenceAmount)));
        if (typeof raw.polish === "number") setPolish(Math.max(0, Math.min(100, raw.polish)));
        if (typeof raw.glue === "number") setGlue(Math.max(0, Math.min(100, raw.glue)));
        if (typeof raw.spaceMatch === "number") setSpaceMatch(Math.max(0, Math.min(100, raw.spaceMatch)));
        if (raw.studioGrade && typeof raw.studioGrade === "object") setStudioGrade({ ...DEFAULT_STUDIO_GRADE, ...raw.studioGrade });
        const learnedRaw = localStorage.getItem("tm:suno-dna:latest");
        if (learnedRaw) {
          try {
            const learned = JSON.parse(learnedRaw);
            if (learned?.chain) setChain(sanitizeChain({ ...raw.chain, ...learned.chain }));
            if (learned?.studioGrade) setStudioGrade({ ...DEFAULT_STUDIO_GRADE, ...learned.studioGrade });
            if (!raw.dna && typeof learned?.dnaSummary === "string") setDna(learned.dnaSummary);
            if (typeof learned?.referenceAmount === "number") setReferenceAmount(learned.referenceAmount);
            if (typeof learned?.polish === "number") setPolish(learned.polish);
            if (typeof learned?.glue === "number") setGlue(learned.glue);
            if (typeof learned?.space === "number") setSpaceMatch(learned.space);
          } catch {
            /* Ignore malformed learned profiles. */
          }
        }
        setSaved(
          Array.isArray(raw.saved)
            ? raw.saved
                .slice(0, 20)
                .filter((s: Snapshot) => typeof s.name === "string")
                .map((s: Snapshot) => ({
                  name: s.name,
                  chain: sanitizeChain(s.chain),
                }))
            : [],
        );
      }
    } catch {
      /* Start clean if saved values are malformed. */
    }
    setHydrated(true);
    return () => {
      player.current?.sources.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* Ended. */
        }
      });
      void player.current?.context.close();
    };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        "tm-vocal:v1:" + (projectId || "device"),
        JSON.stringify({ chain, notes, dna, saved, beatLevel, pocket, duck, referenceAmount, polish, glue, spaceMatch, studioGrade }),
      );
    } catch {
      setNotice(
        "Device saving failed. Export the session to keep your settings.",
      );
    }
  }, [chain, notes, dna, saved, beatLevel, pocket, duck, referenceAmount, polish, glue, spaceMatch, studioGrade, projectId, hydrated]);
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void getCurrentUser()
      .then(async (user) => {
        if (!user) return;
        const [projects, assets] = await Promise.all([
          supabaseRest<MusicProjectRow[]>("music_projects", {
            query: `select=id,title&user_id=eq.${user.id}&id=eq.${projectId}&limit=1`,
          }),
          supabaseRest<MusicAssetRow[]>("music_assets", {
            query: `select=*&user_id=eq.${user.id}&project_id=eq.${projectId}&order=created_at.desc&limit=200`,
          }),
        ]);
        if (cancelled) return;
        if (projects[0]) setProjectName(projects[0].title);
        setCloudAssets(
          assets.filter(
            (a) =>
              a.mime_type?.startsWith("audio/") ||
              /\.(wav|mp3|m4a|flac|aiff?)$/i.test(a.original_name),
          ),
        );
      })
      .catch(() => {
        /* Device-only processing remains available. */
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);
  async function loadCloud(target: "vocal" | "reference" | "beat") {
    const asset = cloudAssets.find((a) => a.id === cloudAssetId);
    if (!asset) return;
    setBusy(true);
    try {
      const blob = await downloadPrivateFile(asset.storage_path);
      await load(
        new File([blob], asset.original_name, {
          type: asset.mime_type ?? "audio/wav",
        }),
        target,
      );
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Could not load this private audio.",
      );
    } finally {
      setBusy(false);
    }
  }
  function commit(next: Chain, name: string) {
    stop();
    setUndo((v) => [...v.slice(-29), { name, chain }]);
    setRedo([]);
    setChain(sanitizeChain(next));
    setOutputCheck(null);
  }
  async function load(
    file: File | undefined,
    target: "vocal" | "reference" | "beat",
  ) {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setNotice("Use an audio file smaller than 100 MB.");
      return;
    }
    stop();
    setBusy(true);
    setNotice("Decoding and measuring " + file.name + "…");
    const ctx = new AudioContext();
    try {
      const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
      if (buffer.duration > 600)
        throw new Error("Use a take or reference excerpt up to 10 minutes.");
      const measured = await measure(buffer);
      const value = { file, buffer, measured };
      if (target === "vocal") {
        setVocal(value);
        setRawBeforeCorrection(null);
        setCorrectionMeta(null);
        setOutputCheck(null);
      } else if (target === "reference") setReference(value);
      else setBeat(value);
      setNotice(
        measured.silent
          ? "This audio is silent. Choose an audible take."
          : "Loaded " +
              file.name +
              ". Measurements describe this file; spectral findings are audition suggestions.",
      );
    } catch (e) {
      setNotice(
        e instanceof Error
          ? e.message
          : "Could not decode this audio. Try WAV or MP3.",
      );
    } finally {
      await ctx.close();
      setBusy(false);
    }
  }
  async function runWorkerCorrection() {
    if (!vocal) return;
    stop();
    setBusy(true);
    setStudioStage("Analyzing key/BPM and acquiring the vocal-correction worker…");
    try {
      const analysisSource = beat?.file ?? reference?.file ?? vocal.file;
      const analysis = await analyzeAudioFile(analysisSource);
      const result = await correctVocalOnWorker({
        vocal: vocal.file,
        reference: reference?.file ?? null,
        projectId: projectId || null,
        key: analysis.key,
        bpm: analysis.bpm,
        pitchAmount: studioGrade.pitchCorrection,
        timingTightness: studioGrade.timingTightness,
        onStatus: (message) => setStudioStage(message),
      });
      const ctx = new AudioContext();
      try {
        const buffer = await ctx.decodeAudioData(await result.file.arrayBuffer());
        const measured = await measure(buffer);
        if (!rawBeforeCorrection) setRawBeforeCorrection(vocal);
        setVocal({ file: result.file, buffer, measured });
        setCorrectionMeta(result.meta);
        setKeyLabel(
          analysis.key
            ? `${analysis.key}${analysis.bpm ? ` · ${analysis.bpm} BPM` : ""}`
            : analysis.bpm
              ? `${analysis.bpm} BPM`
              : "Worker correction used chromatic pitch targets",
        );
        const pitchSegments = Number(result.meta?.pitch?.appliedSegments ?? 0);
        const movedPhrases = Number(result.meta?.timing?.movedPhrases ?? 0);
        setNotice(
          `Worker correction complete: ${pitchSegments} pitch regions corrected and ${movedPhrases} phrase onsets aligned. The corrected stem now feeds Reference Match Pro before dynamics, FX and mastering.`,
        );
      } finally {
        await ctx.close();
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Worker vocal correction failed.");
    } finally {
      setStudioStage("Ready for studio-grade render.");
      setBusy(false);
    }
  }

  async function saveSessionCloud() {
    if (!vocal || !projectId) return;
    stop();
    setBusy(true);
    setNotice("Rendering and saving the private session…");
    try {
      const wet = await renderStudioVocal(vocal.buffer, chain, studioGrade);
      const check = await measure(wet);
      setOutputCheck(check);
      if (check.peakDb > -0.1)
        throw new Error(
          "Reduce output gain before saving: the processed WAV would clip.",
        );
      await saveHandoff(
        projectId,
        [
          {
            file: new File([encodeWav(vocal.buffer)], "tm-vocal-dry.wav", {
              type: "audio/wav",
            }),
            kind: "stem",
            label: "TM Vocal dry take",
          },
          {
            file: new File([encodeWav(wet)], "tm-vocal-wet.wav", {
              type: "audio/wav",
            }),
            kind: "mix",
            label: "TM Vocal processed take",
          },
          ...(beat
            ? [
                {
                  file: beat.file,
                  kind: "stem" as const,
                  label: "TM Vocal instrumental",
                },
              ]
            : []),
        ],
        {
          schema: "tm-vocal-session/v2",
          chain,
          notes,
          producerDna: dna,
          beatMix: { levelDb: beatLevel, pocketCutDb: pocket, duckDb: duck },
          referenceDna: matchResult ? { referenceAmount, polish, glue, space: spaceMatch, ...matchResult } : null,
          studioGrade,
          vocalCorrection: correctionMeta,
          source: { name: vocal.file.name, measurements: vocal.measured },
          reference: reference?.file.name ?? null,
          renderedMeasurements: check,
        },
      );
      setNotice(
        "Dry/wet audio and exact settings saved to this song’s private library. Open TM Session Desk to review. No engineer has been notified.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Session saving failed.");
    } finally {
      setBusy(false);
    }
  }
  async function play() {
    if (!vocal) return;
    if (playing) {
      stop();
      return;
    }
    setBusy(true);
    try {
      const ctx = new AudioContext();
      await ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = vocal.buffer;
      const sources = [src];
      player.current = { context: ctx, sources };
      if (bypass) src.connect(ctx.destination);
      else buildGraph(ctx, src, chain, ctx.destination);
      if (beat) {
        const b = ctx.createBufferSource();
        b.buffer = beat.buffer;
        connectBeat(
          ctx,
          b,
          vocal.buffer,
          beatLevel,
          pocket,
          duck,
          ctx.currentTime,
        );
        sources.push(b);
      }
      src.onended = () => {
        if (player.current?.context === ctx) {
          sources.slice(1).forEach((s) => {
            try {
              s.stop();
            } catch {
              /* Ended. */
            }
          });
          void ctx.close();
          player.current = null;
          setPlaying(false);
        }
      };
      sources.forEach((s) => s.start(ctx.currentTime));
      setPlaying(true);
      setNotice(
        bypass
          ? "Auditioning the dry take."
          : "Auditioning the current chain. Stop playback to edit.",
      );
    } catch (e) {
      stop();
      setNotice(e instanceof Error ? e.message : "Playback unavailable.");
    } finally {
      setBusy(false);
    }
  }
  function analyze() {
    if (!vocal) return;
    const m = vocal.measured;
    const findings = [];
    if (m.silent) findings.push("Silent file: no useful signal to process.");
    if (m.clippedSamples)
      findings.push(
        `${m.clippedSamples} near-full-scale samples: inspect the original take for overload. Lowering gain cannot undo clipping.`,
      );
    if (m.peakDb > -3)
      findings.push(
        "Limited input headroom: lower input gain before processing.",
      );
    if (m.bands[0] - m.bands[1] > 9)
      findings.push(
        "Strong low-mid energy: audition a small body reduction while preserving baritone weight.",
      );
    if (m.bands[2] - m.bands[1] > -3)
      findings.push(
        "Elevated high-frequency energy: inspect breaths and S sounds; a dedicated de-esser is not active.",
      );
    if (!findings.length)
      findings.push(
        "No level flags found. Audition tone and dynamics against the beat; this is not a mix-quality score.",
      );
    setNotice(findings.join(" "));
  }
  function match() {
    if (!vocal || !reference) return;
    if (vocal.measured.silent || reference.measured.silent) {
      setNotice("Reference matching requires audible source and reference files.");
      return;
    }
    const result = buildReferenceMatch({
      vocal: vocal.measured,
      reference: reference.measured,
      beat: beat?.measured ?? null,
      current: chain,
      referenceAmount,
      polish,
      glue,
      space: spaceMatch,
    });
    commit(result.chain, "Before Reference DNA match");
    setPocket(result.pocketDb);
    setDuck(result.duckDb);
    setBeatLevel(result.beatLevelDb);
    setMatchResult(result);
    setDna((value) => value.trim() ? value : result.dnaSummary);
    setNotice(
      "Reference DNA applied: tonal balance, density, ambience estimate, beat pocket and output target were translated to this vocal. It is intentionally bounded to preserve your voice."
    );
  }
  async function exportAudio(wet: boolean) {
    if (!vocal) return;
    stop();
    setBusy(true);
    try {
      const buffer = wet ? await renderStudioVocal(vocal.buffer, chain, studioGrade) : vocal.buffer;
      const check = await measure(buffer);
      setOutputCheck(check);
      if (wet && check.peakDb > -0.1) {
        setNotice(
          `Rendered peak ${check.peakDb.toFixed(1)} dBFS: reduce output before exporting to avoid PCM clipping.`,
        );
        return;
      }
      download(
        (wet ? "tm-vocal-wet" : "tm-vocal-dry") + ".wav",
        new Blob([encodeWav(buffer)], { type: "audio/wav" }),
      );
      setNotice(
        `${wet ? "Processed" : "Dry"} WAV exported. Peak ${check.peakDb.toFixed(1)} dBFS. RMS ${check.rmsDb.toFixed(1)} dBFS; this is not LUFS.`,
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }
  async function exportFullMix() {
    if (!vocal || !beat) return;
    stop();
    setBusy(true);
    try {
      setStudioStage("Rendering adaptive de-ess → multiband dynamics → serial compression → phrase-aware FX…");
      const mix = await renderStudioMix(vocal.buffer, beat.buffer, chain, studioGrade, beatLevel, pocket, duck);
      setStudioStage("Applying reference master…");
      const mastered = reference ? await renderReferenceMaster(mix, reference.measured, studioGrade) : mix;
      const check = await measure(mastered);
      setOutputCheck(check);
      if (check.peakDb > -0.1)
        throw new Error(
          "Combined mix is too hot. Lower vocal output or beat audition level before exporting.",
        );
      download(
        "tm-vocal-beat-mix.wav",
        new Blob([encodeWav(mastered)], { type: "audio/wav" }),
      );
      setNotice(
        "Studio-grade mix exported with adaptive de-essing, multiband dynamics, serial compression, phrase-aware ambience, vocal pocketing, and reference mastering.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Mix export failed.");
    } finally {
      setStudioStage("Ready for studio-grade render.");
      setBusy(false);
    }
  }
  function exportSession() {
    download(
      "tm-vocal-session.json",
      new Blob(
        [
          JSON.stringify(
            {
              schema: "tm-vocal-session/v2",
              projectId: projectId || null,
              projectName,
              chain,
              producerDna: dna,
              notes,
              beatMix: {
                levelDb: beatLevel,
                pocketCutDb: pocket,
                duckDb: duck,
              },
              referenceDna: matchResult ? { referenceAmount, polish, glue, space: spaceMatch, ...matchResult } : null,
              studioGrade,
              vocalCorrection: correctionMeta,
              source: vocal
                ? { name: vocal.file.name, measurements: vocal.measured }
                : null,
              reference: reference?.file.name ?? null,
              beat: beat?.file.name ?? null,
              render: {
                engine: "TM Vocal Web Audio v1",
                format: "16-bit PCM WAV",
                tailSeconds: 3,
              },
              createdAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    setNotice(
      "Session handoff exported. Include dry/wet WAV files with these settings. Nothing has been uploaded or sent to an engineer.",
    );
  }
  function move(module: Module, delta: number) {
    const order = [...chain.order],
      i = order.indexOf(module),
      j = i + delta;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    commit({ ...chain, order }, "Before rack reorder");
  }
  const locked = busy || playing;
  return (
    <main className="tv">
      <header className="tv-top">
        <Link href="/studio">TM MUSIC STUDIO</Link>
        <nav>
          <Link href="/studio-brain">Studio Brain</Link>
          <Link href="/producer-dna">Producer DNA</Link>
          <Link
            href={
              "/stem-agent" +
              (projectId
                ? "?projectId=" + projectId + "&strategy=vocal-suite"
                : "?strategy=vocal-suite")
            }
          >
            Isolate vocals
          </Link>
        </nav>
      </header>
      <section className="tv-hero">
        <div>
          <p className="tv-kicker">PERSONAL VOCAL WORKSPACE · WEB AUDIO</p>
          <h1>
            Your voice.
            <br />
            <em>Your decisions.</em>
          </h1>
          <p>
            Shape the take, bring a reference, audition against the beat, and
            keep every setting for your next session.
          </p>
        </div>
        <aside>
          <span>ACTIVE SONG</span>
          <h3>{projectName}</h3>
          <p>
            Settings are saved on this device
            {projectId ? " under this song’s existing ID" : ""}. Audio is kept
            in memory until you leave.
          </p>
          <Link href={projectId ? "/?projectId=" + projectId : "/"}>
            Open song workspace →
          </Link>
        </aside>
      </section>
      <div className="tv-notice" role="status">
        {notice}
      </div>
      <section className="tv-files">
        {(["vocal", "reference", "beat"] as const).map((target) => {
          const data =
            target === "vocal"
              ? vocal
              : target === "reference"
                ? reference
                : beat;
          return (
            <label className="tv-upload" key={target}>
              <span>
                {target === "vocal"
                  ? "01 / DRY VOCAL"
                  : target === "reference"
                    ? "02 / REFERENCE VOCAL"
                    : "03 / INSTRUMENTAL"}
              </span>
              <strong>{data?.file.name ?? "Choose audio"}</strong>
              <small>
                {data
                  ? `${data.measured.duration.toFixed(1)}s · ${data.measured.peakDb.toFixed(1)} dBFS peak`
                  : "WAV, MP3, or a browser-supported audio file"}
              </small>
              <input
                type="file"
                accept="audio/*"
                disabled={locked}
                onChange={(e) => void load(e.target.files?.[0], target)}
              />
            </label>
          );
        })}
      </section>
      {cloudAssets.length > 0 && (
        <section className="tv-panel">
          <p className="tv-kicker">PRIVATE SONG AUDIO / STEMS</p>
          <label>
            Choose a saved take, isolated vocal, reference or instrumental
            <select
              value={cloudAssetId}
              disabled={locked}
              onChange={(e) => setCloudAssetId(e.target.value)}
            >
              <option value="">Choose an audio asset…</option>
              {cloudAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} · {a.original_name}
                </option>
              ))}
            </select>
          </label>
          <div className="tv-controls">
            {(["vocal", "reference", "beat"] as const).map((target) => (
              <button
                key={target}
                disabled={locked || !cloudAssetId}
                onClick={() => void loadCloud(target)}
              >
                Load as {target}
              </button>
            ))}
          </div>
        </section>
      )}
      {projectId && (
        <button
          disabled={locked}
          onClick={async () => {
            try {
              const file = await getProjectAudio(projectId);
              if (file) await load(file, "vocal");
              else
                setNotice(
                  "No source audio stored on this device for this song. Choose a dry vocal above.",
                );
            } catch {
              setNotice(
                "Could not load the stored song audio. Choose a dry vocal above.",
              );
            }
          }}
        >
          Load song audio from this device
        </button>
      )}
      <section className="tv-console">
        <div className="tv-player">
          {vocal ? (
            <Wave values={vocal.measured.wave} />
          ) : (
            <div className="tv-empty">
              Load a take to see its measured waveform.
            </div>
          )}
          <div className="tv-controls">
            <button
              className="tv-primary"
              disabled={!vocal || busy}
              onClick={() => void play()}
            >
              {playing ? "Stop" : "Play"}
            </button>
            <button
              aria-pressed={bypass}
              disabled={locked}
              onClick={() => setBypass(!bypass)}
            >
              {bypass ? "Dry bypass" : "Processed chain"}
            </button>
            <button disabled={!vocal || locked} onClick={analyze}>
              Analyze
            </button>
            <button
              disabled={!vocal || locked || vocal.measured.silent}
              onClick={() => {
                if (!vocal) return;
                commit(
                  { ...chain, input: -9 - vocal.measured.peakDb },
                  "Before gain staging",
                );
                setNotice(
                  "Input gain targets −9 dBFS peak headroom, within gain limits. It does not repair overloaded audio.",
                );
              }}
            >
              Gain stage
            </button>
          </div>
          {vocal && (
            <p className="tv-small">
              Peak {vocal.measured.peakDb.toFixed(1)} dBFS · RMS{" "}
              {vocal.measured.rmsDb.toFixed(1)} dBFS · {vocal.buffer.sampleRate}{" "}
              Hz · {vocal.buffer.numberOfChannels} channel(s)
            </p>
          )}
          {beat && (
            <label>
              Beat audition level · {beatLevel} dB
              <input
                type="range"
                min="-30"
                max="0"
                value={beatLevel}
                disabled={locked}
                onChange={(e) => setBeatLevel(+e.target.value)}
              />
            </label>
          )}
        </div>
        <aside className="tv-panel">
          <p className="tv-kicker">ONE-CLICK STARTING CHAIN</p>
          <label>
            Direction
            <select
              value={preset}
              disabled={locked}
              onChange={(e) => setPreset(e.target.value)}
            >
              {Object.keys(PRESETS).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Vocal role
            <select
              value={role}
              disabled={locked}
              onChange={(e) => setRole(e.target.value)}
            >
              {["Lead", "Adlib", "Double", "Harmony"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <button
            className="tv-primary"
            disabled={locked}
            onClick={() => {
              commit(presetChain(preset, role), "Before " + preset);
              setNotice(
                `${preset} / ${role} applied. Role presets shape existing audio; they do not generate harmonies or correct pitch.`,
              );
            }}
          >
            Apply chain
          </button>
          <button disabled={locked} onClick={() => setAdvanced(!advanced)}>
            {advanced ? "Switch to Simple mode" : "Switch to Advanced mode"}
          </button>
        </aside>
      </section>
      <section className="tv-grid">
        <div className="tv-panel">
          <div className="tv-heading">
            <div>
              <p className="tv-kicker">MODULAR RACK</p>
              <h2>
                {advanced ? "Shape each stage." : "Tone. Density. Space."}
              </h2>
            </div>
            <div>
              <button
                disabled={locked || !undo.length}
                onClick={() => {
                  const s = undo[undo.length - 1];
                  stop();
                  setRedo((v) => [...v, { name: "Redo", chain }]);
                  setChain(s.chain);
                  setUndo((v) => v.slice(0, -1));
                  setOutputCheck(null);
                  setNotice(s.name);
                }}
              >
                Undo
              </button>
              <button
                disabled={locked || !redo.length}
                onClick={() => {
                  const s = redo[redo.length - 1];
                  setUndo((v) => [...v, { name: "Before redo", chain }]);
                  setChain(s.chain);
                  setRedo((v) => v.slice(0, -1));
                  setOutputCheck(null);
                }}
              >
                Redo
              </button>
            </div>
          </div>
          {!advanced ? (
            <div className="tv-knobs">
              {(
                [
                  "warmth",
                  "presence",
                  "air",
                  "drive",
                  "space",
                  "echo",
                ] as Parameter[]
              ).map((key) => (
                <label key={key}>
                  {LABELS[key]}
                  <b>{chain[key].toFixed(1)}</b>
                  <input
                    type="range"
                    min={PARAMETERS[key][0]}
                    max={PARAMETERS[key][1]}
                    step="0.5"
                    value={chain[key]}
                    disabled={locked}
                    onChange={(e) =>
                      commit(
                        { ...chain, [key]: +e.target.value },
                        "Before " + LABELS[key],
                      )
                    }
                  />
                </label>
              ))}
            </div>
          ) : (
            <>
              <div className="tv-knobs">
                {(["input", "output"] as Parameter[]).map((key) => (
                  <label key={key}>
                    {LABELS[key]}
                    <b>{chain[key]}</b>
                    <input
                      type="range"
                      min={PARAMETERS[key][0]}
                      max={PARAMETERS[key][1]}
                      step="0.5"
                      value={chain[key]}
                      disabled={locked}
                      onChange={(e) =>
                        commit(
                          { ...chain, [key]: +e.target.value },
                          "Before " + key,
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              {chain.order.map((module, i) => (
                <article className="tv-module" key={module}>
                  <div className="tv-heading">
                    <h3>
                      {String(i + 1).padStart(2, "0")} / {module}
                    </h3>
                    <div>
                      <button
                        aria-label={"Move " + module + " earlier"}
                        disabled={locked || i === 0}
                        onClick={() => move(module, -1)}
                      >
                        ↑
                      </button>
                      <button
                        aria-label={"Move " + module + " later"}
                        disabled={locked || i === chain.order.length - 1}
                        onClick={() => move(module, 1)}
                      >
                        ↓
                      </button>
                      <button
                        disabled={locked}
                        onClick={() =>
                          commit(
                            {
                              ...chain,
                              order: chain.order.filter((m) => m !== module),
                            },
                            "Before removing " + module,
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="tv-knobs">
                    {GROUPS[module].map((key) => (
                      <label key={key}>
                        {LABELS[key]}
                        <b>{chain[key].toFixed(1)}</b>
                        <input
                          type="range"
                          min={PARAMETERS[key][0]}
                          max={PARAMETERS[key][1]}
                          step={
                            key === "highpass" || key === "delayTime" ? 1 : 0.5
                          }
                          value={chain[key]}
                          disabled={locked}
                          onChange={(e) =>
                            commit(
                              { ...chain, [key]: +e.target.value },
                              "Before " + LABELS[key],
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <details>
                    <summary>Why this stage?</summary>
                    <p>{WHY[module]}</p>
                  </details>
                </article>
              ))}
              <div className="tv-controls">
                {MODULES.filter((m) => !chain.order.includes(m)).map((m) => (
                  <button
                    key={m}
                    disabled={locked}
                    onClick={() =>
                      commit(
                        { ...chain, order: [...chain.order, m] },
                        "Before adding " + m,
                      )
                    }
                  >
                    + {m}
                  </button>
                ))}
              </div>
            </>
          )}
          <form
            className="tv-command"
            onSubmit={(e) => {
              e.preventDefault();
              const result = commandChain(chain, command);
              if (result.changed)
                commit(result.chain, "Before “" + command + "”");
              setNotice(result.explanation);
            }}
          >
            <label>
              Type-to-mix
              <input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Darker, more space, less harsh"
                disabled={locked}
              />
            </label>
            <button disabled={locked || !command.trim()}>
              Apply direction
            </button>
            <small>
              Local phrase mapping. Changes are bounded and reversible;
              section-specific automation is planned.
            </small>
          </form>
        </div>
        <aside className="tv-side">
          <section className="tv-panel tv-reference">
            <p className="tv-kicker">REFERENCE DNA · SUNO → JO₵YN</p>
            <h2>Match the world, keep your voice.</h2>
            <p>
              TM translates the reference's relative tone, density and perceived
              space into a bounded chain for your vocal, then makes room in the
              instrumental so the performance feels integrated instead of pasted on.
            </p>
            <div className="tv-matchMeter">
              <label>
                Reference Match <b>{referenceAmount}%</b>
                <input type="range" min="0" max="100" value={referenceAmount} disabled={locked}
                  onChange={(e) => setReferenceAmount(+e.target.value)} />
              </label>
              <label>
                Polish <b>{polish}%</b>
                <input type="range" min="0" max="100" value={polish} disabled={locked}
                  onChange={(e) => setPolish(+e.target.value)} />
              </label>
              <label>
                Glue <b>{glue}%</b>
                <input type="range" min="0" max="100" value={glue} disabled={locked}
                  onChange={(e) => setGlue(+e.target.value)} />
              </label>
              <label>
                Space <b>{spaceMatch}%</b>
                <input type="range" min="0" max="100" value={spaceMatch} disabled={locked}
                  onChange={(e) => setSpaceMatch(+e.target.value)} />
              </label>
            </div>
            <button className="tv-primary tv-matchButton" disabled={!vocal || !reference || locked} onClick={match}>
              MATCH REFERENCE
            </button>
            {matchResult && (
              <div className="tv-matchResult">
                <span>VOICE DNA</span><strong>{matchResult.voiceProfile}</strong>
                <span>FUSION</span><strong>{matchResult.fusionLabel}</strong>
                <span>MASTER TARGET</span><strong>{matchResult.masterLabel}</strong>
              </div>
            )}
            <Link
              href={
                "/stem-agent" +
                (projectId
                  ? "?projectId=" + projectId + "&strategy=vocal-suite"
                  : "?strategy=vocal-suite")
              }
            >
              Isolate a full-song reference first →
            </Link>
            <small>
              Best results come from an isolated reference vocal plus the matching instrumental.
              TM estimates ambience from measurable characteristics; it does not claim to reconstruct
              hidden Suno processing exactly.
            </small>
          </section>
          <section className="tv-panel">
            <p className="tv-kicker">BEAT CONTEXT</p>
            <h2>Make room for the voice.</h2>
            <button
              disabled={!beat || locked}
              onClick={async () => {
                if (!beat) return;
                setBusy(true);
                try {
                  const result = await analyzeAudioFile(beat.file);
                  setKeyLabel(
                    result.key
                      ? `${result.key} · ${(result.keyConfidence * 100).toFixed(0)}% confidence`
                      : "No reliable key estimate",
                  );
                  setNotice(
                    "Beat key is an estimate. Confirm by ear; pitch correction is not active.",
                  );
                } catch {
                  setNotice("Could not estimate the beat key.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Estimate beat key
            </button>
            {keyLabel && <p>{keyLabel}</p>}
            <button
              disabled={!beat || !vocal || locked}
              onClick={() => {
                if (!beat || !vocal) return;
                if (beat.measured.silent || vocal.measured.silent) {
                  setNotice("Load audible vocal and beat files first.");
                  return;
                }
                setBeatLevel(
                  Math.max(
                    -30,
                    Math.min(
                      0,
                      vocal.measured.rmsDb +
                        chain.input +
                        chain.output -
                        beat.measured.rmsDb -
                        4,
                    ),
                  ),
                );
                setNotice(
                  "Set a starting beat level 4 dB below the vocal’s dry RMS plus input/output gain. Effects can change perceived balance. Audition and refine.",
                );
              }}
            >
              Suggest audition balance
            </button>
            <button
              disabled={!beat || !vocal || locked}
              onClick={() => {
                if (!vocal || !beat) return;
                setPocket(
                  beat.measured.bands[1] + beatLevel >
                    vocal.measured.bands[1] + chain.input + chain.output - 6
                    ? 3
                    : 1,
                );
                setDuck(3);
                setNotice(
                  "Enabled a conservative 3 kHz instrumental cut and 3 dB envelope-driven ducking. This processes the loaded instrumental only; audition against the lead.",
                );
              }}
            >
              Suggest vocal pocket
            </button>
            {beat && (
              <>
                <label>
                  Instrumental pocket cut · {pocket} dB
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="0.5"
                    value={pocket}
                    disabled={locked}
                    onChange={(e) => setPocket(+e.target.value)}
                  />
                </label>
                <label>
                  Vocal-driven ducking · {duck} dB
                  <input
                    type="range"
                    min="0"
                    max="9"
                    step="0.5"
                    value={duck}
                    disabled={locked}
                    onChange={(e) => setDuck(+e.target.value)}
                  />
                </label>
                <small>
                  Preview ducking follows the dry vocal envelope; exported mix
                  ducking follows the rendered vocal. Lower values preserve beat
                  impact.
                </small>
              </>
            )}
          </section>
          <section className="tv-panel">
            <p className="tv-kicker">PRODUCER DNA</p>
            <textarea
              rows={4}
              value={dna}
              onChange={(e) => setDna(e.target.value)}
              placeholder="Your chain philosophy and approved course decisions…"
            />
            <Link
              href={
                "/studio-brain" + (projectId ? "?projectId=" + projectId : "")
              }
            >
              Develop this method with Studio Brain →
            </Link>
            <small>
              Saved as session intent. DNA does not silently alter your audio.
            </small>
          </section>
        </aside>
      </section>
      <section className="tv-panel tv-studioGrade">
        <div className="tv-heading">
          <div>
            <p className="tv-kicker">STUDIO-GRADE ENGINE · OFFLINE HQ</p>
            <h2>Reference Match Pro.</h2>
          </div>
          <span className="tv-engineBadge">HQ WAV</span>
        </div>
        <p>
          Final renders now use a heavier chain than live preview: adaptive de-essing,
          three-band dynamics, two-stage compression, phrase-aware reverb/delay ducking,
          vocal-pocket integration, and a reference-aware master.
        </p>
        <div className="tv-proGrid">
          <label>Pitch correction <b>{studioGrade.pitchCorrection}%</b>
            <input type="range" min="0" max="100" value={studioGrade.pitchCorrection} disabled={locked}
              onChange={(e) => setStudioGrade({ ...studioGrade, pitchCorrection: +e.target.value })} />
          </label>
          <label>Timing tightness <b>{studioGrade.timingTightness}%</b>
            <input type="range" min="0" max="100" value={studioGrade.timingTightness} disabled={locked}
              onChange={(e) => setStudioGrade({ ...studioGrade, timingTightness: +e.target.value })} />
          </label>
          <label>Adaptive de-ess <b>{studioGrade.deEss}%</b>
            <input type="range" min="0" max="100" value={studioGrade.deEss} disabled={locked}
              onChange={(e) => setStudioGrade({ ...studioGrade, deEss: +e.target.value })} />
          </label>
          <label>Multiband control <b>{studioGrade.multiband}%</b>
            <input type="range" min="0" max="100" value={studioGrade.multiband} disabled={locked}
              onChange={(e) => setStudioGrade({ ...studioGrade, multiband: +e.target.value })} />
          </label>
          <label>Serial compression <b>{studioGrade.serialCompression}%</b>
            <input type="range" min="0" max="100" value={studioGrade.serialCompression} disabled={locked}
              onChange={(e) => setStudioGrade({ ...studioGrade, serialCompression: +e.target.value })} />
          </label>
          <label>FX phrase duck <b>{studioGrade.fxDuck}%</b>
            <input type="range" min="0" max="100" value={studioGrade.fxDuck} disabled={locked}
              onChange={(e) => setStudioGrade({ ...studioGrade, fxDuck: +e.target.value })} />
          </label>
          <label>Master glue <b>{studioGrade.masterGlue}%</b>
            <input type="range" min="0" max="100" value={studioGrade.masterGlue} disabled={locked}
              onChange={(e) => setStudioGrade({ ...studioGrade, masterGlue: +e.target.value })} />
          </label>
          <label>Reference master <b>{studioGrade.masterMatch}%</b>
            <input type="range" min="0" max="100" value={studioGrade.masterMatch} disabled={locked}
              onChange={(e) => setStudioGrade({ ...studioGrade, masterMatch: +e.target.value })} />
          </label>
        </div>
        <div className="tv-workerCorrection">
          <button className="tv-primary" disabled={!vocal || locked || (studioGrade.pitchCorrection <= 0 && studioGrade.timingTightness <= 0)}
            onClick={() => void runWorkerCorrection()}>
            CORRECT PITCH + TIMING ON WORKER
          </button>
          {rawBeforeCorrection && (
            <button disabled={locked} onClick={() => {
              setVocal(rawBeforeCorrection);
              setRawBeforeCorrection(null);
              setCorrectionMeta(null);
              setNotice("Restored the raw vocal. Worker correction is no longer feeding the mix chain.");
            }}>Restore raw vocal</button>
          )}
          <small>
            Runs before the mix chain. Pitch is corrected in bounded note regions with formant preservation; timing moves phrase onsets only, never the whole vocal speed.
          </small>
          {correctionMeta && <strong className="tv-correctionReady">CORRECTION READY · {String(correctionMeta.engine ?? "TM Worker")}</strong>}
        </div>
        <div className="tv-treatmentRow">
          <div><span>PITCH</span><strong>Worker note-region correction</strong><small>Key-aware correction preserves formants and vocal movement instead of shifting the whole take.</small></div>
          <div><span>TIMING</span><strong>Phrase-onset alignment</strong><small>Uses the reference vocal when available; otherwise phrases tighten toward the detected beat grid within bounded timing moves.</small></div>
          <div><span>MASTER</span><strong>Reference-aware full mix</strong><small>Final WAV targets the reference's density and level within bounded headroom.</small></div>
        </div>
        <p className="tv-small">{studioStage}</p>
      </section>

      <section className="tv-grid">
        <div className="tv-panel">
          <p className="tv-kicker">SIGNATURE LIBRARY</p>
          <h2>Keep the decisions that work.</h2>
          <div className="tv-controls">
            <input
              aria-label="Signature chain name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              maxLength={80}
            />
            <button
              disabled={!saveName.trim() || locked}
              onClick={() => {
                setSaved((v) =>
                  [
                    { name: saveName.trim(), chain },
                    ...v.filter((s) => s.name !== saveName.trim()),
                  ].slice(0, 20),
                );
                setNotice("Signature chain saved on this device.");
              }}
            >
              Save signature
            </button>
          </div>
          {saved.map((s, i) => (
            <div className="tv-saved" key={s.name}>
              <button
                disabled={locked}
                onClick={() => commit(s.chain, "Before loading " + s.name)}
              >
                {s.name} →
              </button>
              <button
                disabled={locked}
                onClick={() => setSaved((v) => v.filter((_, j) => i !== j))}
              >
                Delete
              </button>
            </div>
          ))}
          <details>
            <summary>Undo history · {undo.length}</summary>
            {undo.map((s, i) => (
              <p key={i}>{s.name}</p>
            ))}
          </details>
        </div>
        <div className="tv-panel">
          <p className="tv-kicker">SEND TO TM / SESSION HANDOFF</p>
          <h2>Every stem. Every setting.</h2>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Engineer notes — e.g., 0:42 soften the S, 1:10 add a hook throw…"
          />
          <div className="tv-controls">
            <button
              disabled={!vocal || locked}
              onClick={() => void exportAudio(false)}
            >
              Export dry WAV
            </button>
            <button
              disabled={!vocal || locked}
              onClick={() => void exportAudio(true)}
            >
              Export processed WAV
            </button>
            <button
              disabled={!vocal || !beat || locked}
              onClick={() => void exportFullMix()}
            >
              Export vocal + beat mix
            </button>
            <button disabled={locked} onClick={exportSession}>
              Export session settings
            </button>
            <button
              disabled={!vocal || !projectId || locked}
              onClick={() => void saveSessionCloud()}
            >
              Save to TM session library
            </button>
          </div>
          <Link href="/tm-sessions">Open TM Session Desk →</Link>
          <p>
            Download the WAVs and session settings together for your engineer.
            You can also save the audio and settings to your private song
            library. Engineer access across accounts is not configured.
          </p>
          {outputCheck && (
            <p>
              Rendered peak: {outputCheck.peakDb.toFixed(1)} dBFS · RMS:{" "}
              {outputCheck.rmsDb.toFixed(1)} dBFS
            </p>
          )}
        </div>
      </section>
      <VocalAssistant
        projectId={projectId}
        chain={chain}
        measurement={vocal?.measured ?? null}
        dna={dna}
      />
      <div style={{ height: 24 }} />
      <details className="tv-panel tv-roadmap">
        <summary>Processing status and next capabilities</summary>
        <p>
          Available: browser vocal chain, editable module order, Simple/Advanced
          modes, local phrase commands, measured waveform/peak/RMS, Reference DNA
          matching with bounded tone/density/space translation, beat audition, instrumental pocket EQ,
          vocal-envelope ducking, estimated key, short-delay widening, device
          presets, undo, dry/wet WAV and settings exports.
        </p>
        <p>
          Active: authenticated worker pitch correction with formant-preserving note-region shifts, phrase-onset timing alignment, adaptive de-essing, multiband dynamics, serial compression, phrase-aware ambience ducking, reference-aware full-mix mastering and stem-aware vocal pocketing. Planned next: AI noise removal/de-reverb, formants, harmony generation, comping, LUFS/true-peak and mono checks.
        </p>
      </details>
      <footer className="tv-footer">
        TM VOCAL · YOUR PERSONAL PRODUCTION TOOL{" "}
        <Link href="/studio">Back to the studio →</Link>
      </footer>
    </main>
  );
}