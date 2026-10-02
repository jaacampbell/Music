"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NoteEventTime } from "@spotify/basic-pitch";

import { getProjectAudio, loadStoredProjects } from "@/lib/browser-project-storage";
import {
  getCurrentUser,
  isCloudConfigured,
  downloadPrivateFile,
  supabaseRest,
  uploadPrivateFile
} from "@/lib/persistence/supabase-rest";
import type { CloudUser, MusicAssetRow } from "@/lib/persistence/types";
import "./midiShredder.css";

type DetailMode = "clean" | "balanced" | "detailed";
type PreviewSound = "keys" | "synth" | "bass";
type QuantizeGrid = "off" | "1/8" | "1/16" | "1/32";
type ScaleMode = "chromatic" | "major" | "minor";
type MidiTrackResult = { id: string; label: string; notes: NoteEventTime[] };
type KeyEstimate = { label: string; root: number; mode: "major" | "minor"; confidence: number };
type ChordEstimate = { time: number; label: string };

const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const SCALE_INTERVALS: Record<Exclude<ScaleMode, "chromatic">, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10]
};

const DETAIL_SETTINGS: Record<DetailMode, {
  label: string;
  description: string;
  onset: number;
  frame: number;
  minimumLength: number;
}> = {
  clean: {
    label: "Clean",
    description: "Fewer, stronger notes. Best for vocals and lead melodies.",
    onset: 0.5,
    frame: 0.35,
    minimumLength: 7
  },
  balanced: {
    label: "Balanced",
    description: "A practical starting point for most isolated stems.",
    onset: 0.35,
    frame: 0.28,
    minimumLength: 5
  },
  detailed: {
    label: "Detailed",
    description: "Captures more short notes and chord detail; may need cleanup.",
    onset: 0.22,
    frame: 0.2,
    minimumLength: 3
  }
};

const MODEL_URL = "/models/basic-pitch/model.json";
const AUDIO_SAMPLE_RATE = 22050;
const MAX_PREVIEW_SECONDS = 20;

function filenameBase(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "tm-midi";
}

async function decodeAndResample(file: File): Promise<AudioBuffer> {
  const AudioContextClass = window.AudioContext;
  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const frameCount = Math.max(1, Math.ceil(decoded.duration * AUDIO_SAMPLE_RATE));
    const offline = new OfflineAudioContext(1, frameCount, AUDIO_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    return await offline.startRendering();
  } finally {
    await context.close().catch(() => undefined);
  }
}

function noteName(midi: number): string {
  const normalized = Math.max(0, Math.min(127, Math.round(midi)));
  return `${NOTE_NAMES[normalized % 12]}${Math.floor(normalized / 12) - 1}`;
}

function waveformPeaks(audio: AudioBuffer, bins = 160): number[] {
  const samples = audio.getChannelData(0);
  const bucketSize = Math.max(1, Math.floor(samples.length / bins));
  return Array.from({ length: bins }, (_, index) => {
    const start = index * bucketSize;
    const end = Math.min(samples.length, start + bucketSize);
    let peak = 0;
    for (let cursor = start; cursor < end; cursor += 1) peak = Math.max(peak, Math.abs(samples[cursor]));
    return peak;
  });
}

function snapPitchToScale(pitch: number, root: number, scale: ScaleMode): number {
  if (scale === "chromatic") return pitch;
  const allowed = SCALE_INTERVALS[scale];
  let best = pitch;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let candidate = Math.max(0, pitch - 6); candidate <= Math.min(127, pitch + 6); candidate += 1) {
    if (!allowed.includes((candidate - root + 120) % 12)) continue;
    const distance = Math.abs(candidate - pitch);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

function estimateKey(notes: NoteEventTime[]): KeyEstimate | null {
  if (!notes.length) return null;
  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  const pitchClasses = Array.from({ length: 12 }, () => 0);
  notes.forEach((note) => {
    pitchClasses[Math.round(note.pitchMidi) % 12] += Math.max(0.03, note.durationSeconds) * Math.max(0.05, note.amplitude);
  });
  const candidates: Array<KeyEstimate & { score: number }> = [];
  for (let root = 0; root < 12; root += 1) {
    for (const mode of ["major", "minor"] as const) {
      const profile = mode === "major" ? majorProfile : minorProfile;
      const score = pitchClasses.reduce((total, value, pitchClass) => total + value * profile[(pitchClass - root + 12) % 12], 0);
      candidates.push({ label: `${NOTE_NAMES[root]} ${mode}`, root, mode, score, confidence: 0 });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const runnerUp = candidates[1];
  const confidence = best.score > 0 ? Math.max(0, Math.min(1, (best.score - runnerUp.score) / best.score * 4)) : 0;
  return { label: best.label, root: best.root, mode: best.mode, confidence };
}

function estimateChords(notes: NoteEventTime[], bpm: number): ChordEstimate[] {
  if (!notes.length) return [];
  const windowSeconds = (60 / bpm) * 2;
  const end = notes.reduce((max, note) => Math.max(max, note.startTimeSeconds + note.durationSeconds), 0);
  const chords: ChordEstimate[] = [];
  for (let time = 0; time < end; time += windowSeconds) {
    const active = new Set(notes.filter((note) => note.startTimeSeconds < time + windowSeconds && note.startTimeSeconds + note.durationSeconds > time).map((note) => Math.round(note.pitchMidi) % 12));
    let bestLabel = "—";
    let bestScore = 0;
    for (let root = 0; root < 12; root += 1) {
      for (const [mode, intervals] of [["", [0, 4, 7]], ["m", [0, 3, 7]]] as const) {
        const score = intervals.reduce<number>((total, interval) => total + (active.has((root + interval) % 12) ? 1 : 0), 0);
        if (score > bestScore) {
          bestScore = score;
          bestLabel = score >= 2 ? `${NOTE_NAMES[root]}${mode}` : "—";
        }
      }
    }
    if (!chords.length || chords.at(-1)?.label !== bestLabel) chords.push({ time, label: bestLabel });
  }
  return chords.filter((chord) => chord.label !== "—").slice(0, 24);
}

export default function MidiShredderPage(): React.JSX.Element {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const previewContext = useRef<AudioContext | null>(null);
  const sourceAudio = useRef<AudioBuffer | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [detail, setDetail] = useState<DetailMode>("balanced");
  const [previewSound, setPreviewSound] = useState<PreviewSound>("keys");
  const [bpm, setBpm] = useState(120);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Drop in one vocal, melody, bass, keys, guitar, or other isolated stem.");
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [notes, setNotes] = useState<NoteEventTime[]>([]);
  const [detectedNotes, setDetectedNotes] = useState<NoteEventTime[]>([]);
  const [history, setHistory] = useState<NoteEventTime[][]>([]);
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [quantizeGrid, setQuantizeGrid] = useState<QuantizeGrid>("1/16");
  const [keyRoot, setKeyRoot] = useState(0);
  const [scaleMode, setScaleMode] = useState<ScaleMode>("chromatic");
  const [proMode, setProMode] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [projectStems, setProjectStems] = useState<MusicAssetRow[]>([]);
  const [selectedStemIds, setSelectedStemIds] = useState<string[]>([]);
  const [batchTracks, setBatchTracks] = useState<MidiTrackResult[]>([]);
  const [batchMidiBlob, setBatchMidiBlob] = useState<Blob | null>(null);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchSaved, setBatchSaved] = useState(false);
  const [midiBlob, setMidiBlob] = useState<Blob | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedProjectId = params.get("projectId");
    setProjectId(linkedProjectId);
    if (linkedProjectId) {
      const project = loadStoredProjects().find((item) => item.id === linkedProjectId);
      setProjectTitle(project?.title ?? "Linked song project");
      void getProjectAudio(linkedProjectId).then((projectFile) => {
        if (projectFile) {
          setFile(projectFile);
          setStatus(`Loaded ${projectFile.name} from the linked song project.`);
        }
      });
    }
    if (isCloudConfigured()) {
      void getCurrentUser().then(async (user) => {
        setCloudUser(user);
        if (!user || !linkedProjectId) return;
        const stems = await supabaseRest<MusicAssetRow[]>("music_assets", { query: `select=*&project_id=eq.${linkedProjectId}&kind=eq.stem&order=created_at.desc` });
        setProjectStems(stems.filter((asset) => asset.mime_type?.startsWith("audio/") || /\.(wav|mp3|m4a|aac|flac|ogg|aif|aiff)$/i.test(asset.original_name)));
      }).catch(() => setCloudUser(null));
    }
    return () => {
      void previewContext.current?.close().catch(() => undefined);
    };
  }, []);

  const duration = useMemo(
    () => notes.reduce((max, note) => Math.max(max, note.startTimeSeconds + note.durationSeconds), 0),
    [notes]
  );
  const pitchRange = useMemo(() => {
    if (!notes.length) return { min: 36, max: 84 };
    return {
      min: Math.min(...notes.map((note) => note.pitchMidi)),
      max: Math.max(...notes.map((note) => note.pitchMidi))
    };
  }, [notes]);
  const keyEstimate = useMemo(() => estimateKey(notes), [notes]);
  const chordMap = useMemo(() => estimateChords(notes, bpm), [notes, bpm]);
  const downloadName = `${filenameBase(file?.name ?? "tm-midi")}-${detail}.mid`;

  const selectFile = (next: File | null): void => {
    if (!next) return;
    if (!next.type.startsWith("audio/") && !/\.(wav|mp3|m4a|aac|flac|ogg|aif|aiff)$/i.test(next.name)) {
      setStatus("Choose an audio file such as WAV, MP3, M4A, FLAC, OGG, AIF, or AIFF.");
      return;
    }
    setFile(next);
    setNotes([]);
    setDetectedNotes([]);
    setHistory([]);
    setSelectedNote(null);
    setWaveform([]);
    sourceAudio.current = null;
    setLoopStart(0);
    setLoopEnd(0);
    setMidiBlob(null);
    setSaved(false);
    setProgress(0);
    setStatus(`${next.name} is ready. For the cleanest MIDI, use one isolated instrument or vocal stem.`);
  };

  const stopPreview = async (): Promise<void> => {
    const active = previewContext.current;
    previewContext.current = null;
    setPreviewing(false);
    if (active) await active.close().catch(() => undefined);
  };

  const transcribe = async (): Promise<void> => {
    if (!file || busy) return;
    await stopPreview();
    setBusy(true);
    setSaved(false);
    setNotes([]);
    setMidiBlob(null);
    setProgress(0.02);
    setStatus("Decoding and preparing the audio…");
    try {
      const audio = await decodeAndResample(file);
      sourceAudio.current = audio;
      setWaveform(waveformPeaks(audio));
      setProgress(0.08);
      setStatus("Loading the note-detection model…");
      const [pitchModule, midiModule] = await Promise.all([
        import("@spotify/basic-pitch"),
        import("@tonejs/midi")
      ]);
      const pitch = new pitchModule.BasicPitch(MODEL_URL);
      const frames: number[][] = [];
      const onsets: number[][] = [];
      const contours: number[][] = [];
      setStatus("Listening for notes, timing, velocity, and pitch movement…");
      await pitch.evaluateModel(
        audio,
        (nextFrames, nextOnsets, nextContours) => {
          frames.push(...nextFrames);
          onsets.push(...nextOnsets);
          contours.push(...nextContours);
        },
        (amount) => setProgress(0.08 + amount * 0.78)
      );

      const settings = DETAIL_SETTINGS[detail];
      const detected = pitchModule.noteFramesToTime(
        pitchModule.addPitchBendsToNoteEvents(
          contours,
          pitchModule.outputToNotesPoly(
            frames,
            onsets,
            settings.onset,
            settings.frame,
            settings.minimumLength
          )
        )
      ).filter((note) => note.durationSeconds >= 0.03);

      if (!detected.length) {
        throw new Error("No confident notes were detected. Try Balanced or Detailed mode, or use a cleaner isolated stem.");
      }

      setProgress(0.9);
      setStatus("Building the playable MIDI file…");
      const midi = new midiModule.Midi();
      midi.header.name = `TM MIDI · ${filenameBase(file.name)}`;
      midi.header.setTempo(bpm);
      const track = midi.addTrack();
      track.name = `${filenameBase(file.name)} · ${DETAIL_SETTINGS[detail].label}`;
      for (const note of detected) {
        track.addNote({
          midi: Math.max(0, Math.min(127, Math.round(note.pitchMidi))),
          time: Math.max(0, note.startTimeSeconds),
          duration: Math.max(0.03, note.durationSeconds),
          velocity: Math.max(0.05, Math.min(1, note.amplitude))
        });
      }
      const bytes = new Uint8Array(midi.toArray());
      const output = new Blob([bytes], { type: "audio/midi" });
      const detectedDuration = detected.reduce(
        (max, note) => Math.max(max, note.startTimeSeconds + note.durationSeconds),
        0
      );
      setNotes(detected);
      setDetectedNotes(detected);
      setHistory([]);
      setSelectedNote(null);
      setLoopStart(0);
      setLoopEnd(Number(detectedDuration.toFixed(2)));
      setMidiBlob(output);
      setProgress(1);
      setStatus(`MIDI ready: ${detected.length.toLocaleString()} notes across ${detectedDuration.toFixed(1)} seconds. Preview it, then download or save it to the song project.`);
    } catch (error) {
      setProgress(0);
      setStatus(error instanceof Error ? error.message : "MIDI conversion failed. Try a shorter, cleaner isolated stem.");
    } finally {
      setBusy(false);
    }
  };

  const rebuildMidi = async (nextNotes: NoteEventTime[], tempo = bpm): Promise<void> => {
    if (!file) return;
    const { Midi } = await import("@tonejs/midi");
    const midi = new Midi();
    midi.header.name = `TM MIDI · ${filenameBase(file.name)}`;
    midi.header.setTempo(tempo);
    const track = midi.addTrack();
    track.name = `${filenameBase(file.name)} · edited in TM MIDI Shredder`;
    nextNotes.forEach((note) => track.addNote({
      midi: Math.max(0, Math.min(127, Math.round(note.pitchMidi))),
      time: Math.max(0, note.startTimeSeconds),
      duration: Math.max(0.03, note.durationSeconds),
      velocity: Math.max(0.05, Math.min(1, note.amplitude))
    }));
    setMidiBlob(new Blob([new Uint8Array(midi.toArray())], { type: "audio/midi" }));
    setSaved(false);
  };

  const commitEdit = (nextNotes: NoteEventTime[], message: string): void => {
    if (!nextNotes.length) {
      setStatus("That edit would remove every note. Keep at least one note or start again with Detailed mode.");
      return;
    }
    setHistory((current) => [...current.slice(-19), notes]);
    setNotes(nextNotes);
    setSelectedNote(null);
    setStatus(message);
    void rebuildMidi(nextNotes);
  };

  const updateTempo = (nextTempo: number): void => {
    setBpm(nextTempo);
    if (notes.length) {
      setStatus(`Project tempo updated to ${nextTempo} BPM.`);
      void rebuildMidi(notes, nextTempo);
    }
  };

  const undoEdit = (): void => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((current) => current.slice(0, -1));
    setNotes(previous);
    setSelectedNote(null);
    setStatus("Last MIDI edit undone.");
    void rebuildMidi(previous);
  };

  const resetEdits = (): void => {
    if (!detectedNotes.length) return;
    setHistory((current) => [...current.slice(-19), notes]);
    setNotes(detectedNotes);
    setSelectedNote(null);
    setStatus("Restored the original detected notes.");
    void rebuildMidi(detectedNotes);
  };

  const transpose = (semitones: number): void => {
    const next = notes.map((note) => ({ ...note, pitchMidi: Math.max(0, Math.min(127, note.pitchMidi + semitones)) }));
    commitEdit(next, `Transposed ${semitones > 0 ? "+" : ""}${semitones} semitones.`);
  };

  const quantize = (): void => {
    if (quantizeGrid === "off") {
      setStatus("Choose a timing grid before applying quantize.");
      return;
    }
    const denominator = Number(quantizeGrid.split("/")[1]);
    const gridSeconds = (60 / bpm) * (4 / denominator);
    const next = notes.map((note) => ({
      ...note,
      startTimeSeconds: Math.max(0, Math.round(note.startTimeSeconds / gridSeconds) * gridSeconds),
      durationSeconds: Math.max(gridSeconds / 4, Math.round(note.durationSeconds / gridSeconds) * gridSeconds)
    }));
    commitEdit(next, `Quantized note starts and lengths to ${quantizeGrid} at ${bpm} BPM.`);
  };

  const snapToKey = (): void => {
    if (scaleMode === "chromatic") {
      setStatus("Choose Major or Minor before snapping notes to a key.");
      return;
    }
    const next = notes.map((note) => ({ ...note, pitchMidi: snapPitchToScale(note.pitchMidi, keyRoot, scaleMode) }));
    commitEdit(next, `Snapped pitches to ${NOTE_NAMES[keyRoot]} ${scaleMode}.`);
  };

  const removeWeakNotes = (): void => {
    const next = notes.filter((note) => note.amplitude >= 0.18 && note.durationSeconds >= 0.06);
    commitEdit(next, `Removed ${notes.length - next.length} weak or tiny notes.`);
  };

  const updateSelectedPitch = (semitones: number): void => {
    if (selectedNote === null || !notes[selectedNote]) return;
    const next = notes.map((note, index) => index === selectedNote
      ? { ...note, pitchMidi: Math.max(0, Math.min(127, note.pitchMidi + semitones)) }
      : note);
    commitEdit(next, `Moved the selected note ${semitones > 0 ? "up" : "down"} one semitone.`);
  };

  const deleteSelected = (): void => {
    if (selectedNote === null || !notes[selectedNote]) return;
    const removed = notes[selectedNote];
    commitEdit(notes.filter((_, index) => index !== selectedNote), `Deleted ${noteName(removed.pitchMidi)} at ${removed.startTimeSeconds.toFixed(2)}s.`);
  };

  const extractLoop = (): void => {
    const start = Math.max(0, Math.min(loopStart, duration));
    const end = Math.max(start + 0.1, Math.min(loopEnd || duration, duration));
    const next = notes
      .filter((note) => note.startTimeSeconds < end && note.startTimeSeconds + note.durationSeconds > start)
      .map((note) => ({
        ...note,
        startTimeSeconds: Math.max(0, note.startTimeSeconds - start),
        durationSeconds: Math.max(0.03, Math.min(note.startTimeSeconds + note.durationSeconds, end) - Math.max(note.startTimeSeconds, start))
      }));
    commitEdit(next, `Created a ${Math.max(0, end - start).toFixed(1)} second MIDI loop from ${start.toFixed(1)}s–${end.toFixed(1)}s.`);
  };

  const useProjectStem = async (asset: MusicAssetRow): Promise<void> => {
    setStatus(`Loading ${asset.label} from the private project library…`);
    try {
      const blob = await downloadPrivateFile(asset.storage_path);
      const nextFile = new File([blob], asset.original_name || `${filenameBase(asset.label)}.wav`, { type: asset.mime_type || blob.type || "audio/wav", lastModified: Date.now() });
      selectFile(nextFile);
      setStatus(`${asset.label} is ready to shred.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The project stem could not be loaded.");
    }
  };

  const toggleStemSelection = (assetId: string): void => {
    setSelectedStemIds((current) => current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId]);
    setBatchMidiBlob(null);
    setBatchTracks([]);
    setBatchSaved(false);
  };

  const convertStemPack = async (): Promise<void> => {
    const selected = projectStems.filter((asset) => selectedStemIds.includes(asset.id));
    if (!selected.length || batchBusy) return;
    setBatchBusy(true);
    setBatchProgress(0);
    setBatchTracks([]);
    setBatchMidiBlob(null);
    setBatchSaved(false);
    setStatus(`Building an Ableton-ready MIDI pack from ${selected.length} project stems…`);
    try {
      const [pitchModule, midiModule] = await Promise.all([import("@spotify/basic-pitch"), import("@tonejs/midi")]);
      const pitch = new pitchModule.BasicPitch(MODEL_URL);
      const midi = new midiModule.Midi();
      midi.header.name = `TM MIDI Pack · ${projectTitle ?? "Song Project"}`;
      midi.header.setTempo(bpm);
      const results: MidiTrackResult[] = [];
      for (let index = 0; index < selected.length; index += 1) {
        const asset = selected[index];
        setStatus(`Transcribing ${asset.label} · track ${index + 1} of ${selected.length}…`);
        if (/\b(drums?|kick|snare|hi-?hat|percussion|cymbal)\b/i.test(`${asset.label} ${asset.original_name}`)) {
          setBatchProgress((index + 1) / selected.length);
          continue;
        }
        const blob = await downloadPrivateFile(asset.storage_path);
        const assetFile = new File([blob], asset.original_name, { type: asset.mime_type || blob.type || "audio/wav" });
        const audio = await decodeAndResample(assetFile);
        const frames: number[][] = [];
        const onsets: number[][] = [];
        const contours: number[][] = [];
        await pitch.evaluateModel(audio, (nextFrames, nextOnsets, nextContours) => {
          frames.push(...nextFrames);
          onsets.push(...nextOnsets);
          contours.push(...nextContours);
        }, (amount) => setBatchProgress((index + amount) / selected.length));
        const settings = DETAIL_SETTINGS[detail];
        const detected = pitchModule.noteFramesToTime(pitchModule.addPitchBendsToNoteEvents(contours, pitchModule.outputToNotesPoly(frames, onsets, settings.onset, settings.frame, settings.minimumLength))).filter((note) => note.durationSeconds >= 0.03);
        if (!detected.length) continue;
        const track = midi.addTrack();
        track.name = asset.label.slice(0, 80);
        detected.forEach((note) => track.addNote({ midi: Math.max(0, Math.min(127, Math.round(note.pitchMidi))), time: Math.max(0, note.startTimeSeconds), duration: Math.max(0.03, note.durationSeconds), velocity: Math.max(0.05, Math.min(1, note.amplitude)) }));
        results.push({ id: asset.id, label: asset.label, notes: detected });
      }
      if (!results.length) throw new Error("No confident melodic notes were found in the selected stems. Drum-only and effects stems need a dedicated drum model.");
      const output = new Blob([new Uint8Array(midi.toArray())], { type: "audio/midi" });
      setBatchTracks(results);
      setBatchMidiBlob(output);
      setBatchProgress(1);
      setStatus(`MIDI pack ready · ${results.length} named tracks · ${results.reduce((total, track) => total + track.notes.length, 0).toLocaleString()} notes.`);
    } catch (error) {
      setBatchProgress(0);
      setStatus(error instanceof Error ? error.message : "The project stem pack could not be converted.");
    } finally {
      setBatchBusy(false);
    }
  };

  const previewMidi = async (includeSource = false): Promise<void> => {
    if (!notes.length) return;
    await stopPreview();
    const context = new AudioContext();
    previewContext.current = context;
    setPreviewing(true);
    const start = context.currentTime + 0.08;
    if (includeSource && sourceAudio.current) {
      const source = context.createBufferSource();
      const sourceGain = context.createGain();
      source.buffer = sourceAudio.current;
      sourceGain.gain.value = 0.65;
      source.connect(sourceGain).connect(context.destination);
      source.start(start);
    }
    const transpose = previewSound === "bass" ? -12 : 0;
    const waveform: OscillatorType = previewSound === "synth" ? "sawtooth" : previewSound === "bass" ? "triangle" : "sine";
    const previewNotes = notes
      .filter((note) => note.startTimeSeconds < MAX_PREVIEW_SECONDS)
      .slice(0, 500);

    for (const note of previewNotes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const midi = Math.max(12, Math.min(108, note.pitchMidi + transpose));
      const noteStart = start + note.startTimeSeconds;
      const noteEnd = noteStart + Math.min(note.durationSeconds, 2.5);
      oscillator.type = waveform;
      oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.01, Math.min(0.12, note.amplitude * 0.08)), noteStart + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, Math.max(noteStart + 0.04, noteEnd));
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd + 0.03);
    }
    window.setTimeout(() => { void stopPreview(); }, (Math.min(MAX_PREVIEW_SECONDS, duration) + 0.3) * 1000);
  };

  const downloadMidi = (): void => {
    if (!midiBlob) return;
    const url = URL.createObjectURL(midiBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadBatchMidi = (): void => {
    if (!batchMidiBlob) return;
    const url = URL.createObjectURL(batchMidiBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filenameBase(projectTitle ?? "tm-song")}-ableton-midi-pack.mid`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const saveBatchToProject = async (): Promise<void> => {
    if (!batchMidiBlob || !projectId || !cloudUser) return;
    setStatus("Saving the multi-track MIDI pack to this song’s private library…");
    try {
      const name = `${filenameBase(projectTitle ?? "tm-song")}-ableton-midi-pack.mid`;
      const output = new File([batchMidiBlob], name, { type: "audio/midi", lastModified: Date.now() });
      const storagePath = await uploadPrivateFile(projectId, output, "midi-packs");
      await supabaseRest<MusicAssetRow[]>("music_assets", { method: "POST", body: { project_id: projectId, user_id: cloudUser.id, kind: "other", label: `Ableton MIDI Pack · ${batchTracks.length} tracks`, storage_path: storagePath, original_name: output.name, mime_type: "audio/midi", byte_size: output.size, duration_sec: Math.max(0, ...batchTracks.flatMap((track) => track.notes.map((note) => note.startTimeSeconds + note.durationSeconds))) } });
      setBatchSaved(true);
      setStatus("Multi-track MIDI pack saved to the linked song project.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The MIDI pack could not be saved.");
    }
  };

  const saveToProject = async (): Promise<void> => {
    if (!midiBlob || !projectId || !cloudUser) return;
    setStatus("Saving the MIDI file to this song’s private project library…");
    try {
      const output = new File([midiBlob], downloadName, { type: "audio/midi", lastModified: Date.now() });
      const storagePath = await uploadPrivateFile(projectId, output, "midi");
      await supabaseRest<MusicAssetRow[]>("music_assets", {
        method: "POST",
        body: {
          project_id: projectId,
          user_id: cloudUser.id,
          kind: "other",
          label: `MIDI · ${filenameBase(file?.name ?? "audio")} · ${DETAIL_SETTINGS[detail].label}`,
          storage_path: storagePath,
          original_name: output.name,
          mime_type: "audio/midi",
          byte_size: output.size,
          duration_sec: duration
        }
      });
      setSaved(true);
      setStatus("Saved to the linked song’s private project library.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The MIDI file could not be saved to the project.");
    }
  };

  return (
    <main className="midiShredder">
      <header className="midiTopbar">
        <Link className="midiBrand" href="/studio"><span>M</span><strong>TM Music Studio</strong></Link>
        <nav><Link href="/studio">Studio</Link><Link href="/stem-agent">Stem Director</Link><Link href="/dashboard">Projects</Link></nav>
      </header>

      <section className="midiHero">
        <div>
          <p className="midiKicker">AUDIO → PLAYABLE MIDI</p>
          <h1>MIDI Shredder</h1>
          <p>Turn a vocal or instrument recording into editable MIDI you can drag into Ableton, change to any sound, rearrange, and build from.</p>
        </div>
        <div className="midiPrivacy"><strong>Runs on this device</strong><span>Your audio stays in the browser during transcription.</span><button className={proMode ? "midiProToggle active" : "midiProToggle"} type="button" onClick={() => setProMode((current) => !current)}><span>{proMode ? "Pro Edit On" : "Open Pro Edit"}</span><i aria-hidden="true" /></button></div>
      </section>

      {projectId && <div className="midiProjectBar"><span>LINKED SONG</span><strong>{projectTitle ?? projectId}</strong><Link href={`/dashboard?projectId=${projectId}`}>Open project</Link></div>}

      <section className="midiWorkspace">
        <div className="midiMainPanel">
          <button
            className={`midiDrop ${file ? "hasFile" : ""}`}
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0] ?? null); }}
          >
            <input ref={fileInput} type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg,.aif,.aiff" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
            <span className="midiDropIcon">↯</span>
            <strong>{file ? file.name : "Drop audio here"}</strong>
            <small>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · Tap to replace` : "WAV gives the cleanest result · MP3, M4A, FLAC and more also work"}</small>
          </button>

          {proMode && projectId && (
            <section className="midiStemPack">
              <div className="midiStemPackHead"><div><p className="midiKicker">PROJECT STEMS → MULTI-TRACK MIDI</p><h2>Build the Ableton pack.</h2></div><span>{selectedStemIds.length} selected</span></div>
              {projectStems.length ? <><div className="midiStemList">{projectStems.map((asset) => <article className={selectedStemIds.includes(asset.id) ? "selected" : ""} key={asset.id}><button className="midiStemCheck" type="button" onClick={() => toggleStemSelection(asset.id)} aria-label={`${selectedStemIds.includes(asset.id) ? "Remove" : "Add"} ${asset.label}`}><span>{selectedStemIds.includes(asset.id) ? "✓" : "+"}</span><strong>{asset.label}</strong><small>{asset.original_name}</small></button><button className="midiStemUse" type="button" onClick={() => void useProjectStem(asset)}>Use one</button></article>)}</div><div className="midiPackAction"><div><span style={{ width: `${Math.round(batchProgress * 100)}%` }} /></div><button type="button" disabled={!selectedStemIds.length || batchBusy} onClick={() => void convertStemPack()}>{batchBusy ? "Building MIDI Pack…" : `Convert ${selectedStemIds.length || "Selected"} Stems`}</button></div></> : <div className="midiNoStems"><p>No private project stems are available yet.</p><Link href={`/stem-agent?projectId=${projectId}`}>Create stems in Stem Director →</Link></div>}
              <p className="midiTruth">Melodic and vocal stems use polyphonic pitch detection. Drum-only stems are skipped rather than mislabeled as pitched MIDI.</p>
            </section>
          )}

          <div className="midiSteps">
            <div className="midiStepHead"><span>01</span><div><strong>Choose how much detail</strong><small>Balanced is the best place to start.</small></div></div>
            <div className="midiModeGrid">
              {(Object.entries(DETAIL_SETTINGS) as [DetailMode, typeof DETAIL_SETTINGS[DetailMode]][]).map(([key, option]) => (
                <button className={detail === key ? "active" : ""} type="button" key={key} onClick={() => setDetail(key)}>
                  <strong>{option.label}</strong><span>{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="midiSettingsRow">
            <label><span>Project tempo</span><div><input type="number" min="40" max="240" value={bpm} onChange={(event) => updateTempo(Math.max(40, Math.min(240, Number(event.target.value) || 120)))} /><small>BPM</small></div></label>
            <button className="midiConvert" type="button" disabled={!file || busy} onClick={() => void transcribe()}>{busy ? "Listening…" : "Shred to MIDI"}</button>
          </div>

          <div className="midiProgress" aria-live="polite">
            <div><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <p>{status}</p>
          </div>
        </div>

        <aside className="midiGuideCard">
          <p className="midiKicker">CLEANEST RESULTS</p>
          <h2>Give it one part at a time.</h2>
          <ol><li>Separate the full song in Stem Director.</li><li>Download a vocal, bass, keys, guitar, or other solo stem.</li><li>Drop that stem here and convert it.</li><li>Drag the downloaded MIDI into Ableton.</li></ol>
          <Link href={projectId ? `/stem-agent?projectId=${projectId}` : "/stem-agent"}>Open Stem Director →</Link>
        </aside>
      </section>

      {batchTracks.length > 0 && batchMidiBlob && (
        <section className="midiResults midiBatchResults">
          <div className="midiResultsHead"><div><p className="midiKicker">ABLETON MIDI PACK READY</p><h2>{batchTracks.length} named tracks</h2></div><div className="midiStats"><span><strong>{batchTracks.reduce((total, track) => total + track.notes.length, 0).toLocaleString()}</strong> notes</span><span><strong>{bpm}</strong> BPM</span><span><strong>.MID</strong> multi-track</span></div></div>
          <div className="midiTrackGrid">{batchTracks.map((track, index) => <article key={track.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{track.label}</strong><small>{track.notes.length.toLocaleString()} detected notes · {noteName(Math.min(...track.notes.map((note) => note.pitchMidi)))}–{noteName(Math.max(...track.notes.map((note) => note.pitchMidi)))}</small></div></article>)}</div>
          <div className="midiResultActions"><button className="primary" type="button" onClick={downloadBatchMidi}>Download Ableton MIDI Pack</button>{projectId && cloudUser && <button type="button" disabled={batchSaved} onClick={() => void saveBatchToProject()}>{batchSaved ? "Saved to Project" : "Save Pack to Project"}</button>}</div>
          <p className="midiTruth">Import the `.mid` into Ableton Live to create separate named MIDI tracks. Assign your instruments after import; Ableton remains the audio authority.</p>
        </section>
      )}

      {notes.length > 0 && midiBlob && (
        <section className="midiResults">
          <div className="midiResultsHead">
            <div><p className="midiKicker">MIDI READY</p><h2>{notes.length.toLocaleString()} editable notes</h2></div>
            <div className="midiStats"><span><strong>{duration.toFixed(1)}s</strong> length</span><span><strong>{noteName(pitchRange.min)}–{noteName(pitchRange.max)}</strong> range</span><span><strong>{bpm}</strong> BPM</span></div>
          </div>

          <div className="pianoRoll" aria-label="Detected MIDI notes piano roll">
            <div className="pianoRollGrid" />
            <div className="midiWaveform" aria-hidden="true">{waveform.map((peak, index) => <span key={index} style={{ height: `${Math.max(2, peak * 78)}%` }} />)}</div>
            {notes.slice(0, 800).map((note, index) => {
              const range = Math.max(1, pitchRange.max - pitchRange.min + 1);
              return <button className={`pianoNote ${selectedNote === index ? "selected" : ""}`} type="button" key={`${note.startTimeSeconds}-${note.pitchMidi}-${index}`} aria-label={`Select ${noteName(note.pitchMidi)} at ${note.startTimeSeconds.toFixed(2)} seconds`} title={`${noteName(note.pitchMidi)} · ${note.startTimeSeconds.toFixed(2)}s`} onClick={() => setSelectedNote(index)} style={{ left: `${(note.startTimeSeconds / Math.max(duration, 1)) * 100}%`, width: `${Math.max(0.18, (note.durationSeconds / Math.max(duration, 1)) * 100)}%`, bottom: `${((note.pitchMidi - pitchRange.min) / range) * 92 + 3}%`, opacity: Math.max(0.4, Math.min(1, note.amplitude)) }} />;
            })}
          </div>

          {proMode && <><div className="midiProAnalysis"><article><span>Estimated key</span><strong>{keyEstimate?.label ?? "—"}</strong><small>{keyEstimate ? `${Math.round(keyEstimate.confidence * 100)}% separation from next match` : "Run transcription first"}</small>{keyEstimate && <button type="button" onClick={() => { setKeyRoot(keyEstimate.root); setScaleMode(keyEstimate.mode); }}>Use for Snap</button>}</article><article className="midiChordMap"><span>Chord map · 2-beat windows</span><div>{chordMap.length ? chordMap.map((chord) => <b key={`${chord.time}-${chord.label}`}>{chord.label}<small>{chord.time.toFixed(1)}s</small></b>) : <small>No stable triads detected.</small>}</div></article></div>

          <div className="midiEditDesk">
            <div className="midiEditHead"><div><p className="midiKicker">CLEANUP DESK</p><h3>Shape the performance before export.</h3></div><div className="midiHistory"><button type="button" disabled={!history.length} onClick={undoEdit}>Undo</button><button type="button" onClick={resetEdits}>Reset</button></div></div>
            <div className="midiEditGrid">
              <section><strong>Timing</strong><label><span>Grid</span><select value={quantizeGrid} onChange={(event) => setQuantizeGrid(event.target.value as QuantizeGrid)}><option value="off">Off</option><option value="1/8">1/8</option><option value="1/16">1/16</option><option value="1/32">1/32</option></select></label><button type="button" onClick={quantize}>Apply Quantize</button></section>
              <section><strong>Key + scale</strong><div className="midiInlineFields"><label><span>Key</span><select value={keyRoot} onChange={(event) => setKeyRoot(Number(event.target.value))}>{NOTE_NAMES.map((name, index) => <option value={index} key={name}>{name}</option>)}</select></label><label><span>Scale</span><select value={scaleMode} onChange={(event) => setScaleMode(event.target.value as ScaleMode)}><option value="chromatic">Chromatic</option><option value="major">Major</option><option value="minor">Minor</option></select></label></div><button type="button" onClick={snapToKey}>Snap to Key</button></section>
              <section><strong>Pitch + cleanup</strong><div className="midiButtonRow"><button type="button" onClick={() => transpose(-12)}>− Octave</button><button type="button" onClick={() => transpose(12)}>+ Octave</button></div><button type="button" onClick={removeWeakNotes}>Remove Weak Notes</button></section>
              <section className={selectedNote === null ? "midiSelected isEmpty" : "midiSelected"}><strong>Selected note</strong>{selectedNote === null || !notes[selectedNote] ? <p>Tap a green note above to edit it.</p> : <><p><b>{noteName(notes[selectedNote].pitchMidi)}</b> · {notes[selectedNote].startTimeSeconds.toFixed(2)}s</p><div className="midiButtonRow"><button type="button" onClick={() => updateSelectedPitch(-1)}>− Semitone</button><button type="button" onClick={() => updateSelectedPitch(1)}>+ Semitone</button></div><button className="danger" type="button" onClick={deleteSelected}>Delete Note</button></>}</section>
              <section><strong>Loop range</strong><div className="midiInlineFields"><label><span>Start</span><input type="number" min="0" max={duration} step="0.1" value={loopStart} onChange={(event) => setLoopStart(Number(event.target.value) || 0)} /></label><label><span>End</span><input type="number" min="0.1" max={duration} step="0.1" value={loopEnd} onChange={(event) => setLoopEnd(Number(event.target.value) || duration)} /></label></div><button type="button" onClick={extractLoop}>Create Loop MIDI</button></section>
            </div>
          </div></>}

          <div className="midiResultActions">
            <label><span>Preview sound</span><select value={previewSound} onChange={(event) => setPreviewSound(event.target.value as PreviewSound)}><option value="keys">Clean Keys</option><option value="synth">Bright Synth</option><option value="bass">Bass</option></select></label>
            <button type="button" onClick={() => previewing ? void stopPreview() : void previewMidi()}>{previewing ? "Stop Preview" : "Preview MIDI"}</button>
            {proMode && sourceAudio.current && !previewing && <button type="button" onClick={() => void previewMidi(true)}>Compare With Source</button>}
            <button className="primary" type="button" onClick={downloadMidi}>Download .MID</button>
            {projectId && cloudUser && <button type="button" disabled={saved} onClick={() => void saveToProject()}>{saved ? "Saved to Project" : "Save to Project"}</button>}
          </div>
          <p className="midiTruth">Audio-to-MIDI is an estimate. Complex full mixes can create extra or missed notes; isolated stems produce the most editable results.</p>
        </section>
      )}
    </main>
  );
}
