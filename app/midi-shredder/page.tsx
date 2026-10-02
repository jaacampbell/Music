"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NoteEventTime } from "@spotify/basic-pitch";

import { getProjectAudio, loadStoredProjects } from "@/lib/browser-project-storage";
import {
  getCurrentUser,
  isCloudConfigured,
  supabaseRest,
  uploadPrivateFile
} from "@/lib/persistence/supabase-rest";
import type { CloudUser, MusicAssetRow } from "@/lib/persistence/types";
import "./midiShredder.css";

type DetailMode = "clean" | "balanced" | "detailed";
type PreviewSound = "keys" | "synth" | "bass";

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
  const names = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export default function MidiShredderPage(): React.JSX.Element {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const previewContext = useRef<AudioContext | null>(null);
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
      void getCurrentUser().then(setCloudUser).catch(() => setCloudUser(null));
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
  const downloadName = `${filenameBase(file?.name ?? "tm-midi")}-${detail}.mid`;

  const selectFile = (next: File | null): void => {
    if (!next) return;
    if (!next.type.startsWith("audio/") && !/\.(wav|mp3|m4a|aac|flac|ogg|aif|aiff)$/i.test(next.name)) {
      setStatus("Choose an audio file such as WAV, MP3, M4A, FLAC, OGG, AIF, or AIFF.");
      return;
    }
    setFile(next);
    setNotes([]);
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

  const previewMidi = async (): Promise<void> => {
    if (!notes.length) return;
    await stopPreview();
    const context = new AudioContext();
    previewContext.current = context;
    setPreviewing(true);
    const start = context.currentTime + 0.08;
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
        <div className="midiPrivacy"><strong>Runs on this device</strong><span>Your audio stays in the browser during transcription.</span></div>
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
            <label><span>Project tempo</span><div><input type="number" min="40" max="240" value={bpm} onChange={(event) => setBpm(Math.max(40, Math.min(240, Number(event.target.value) || 120)))} /><small>BPM</small></div></label>
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

      {notes.length > 0 && midiBlob && (
        <section className="midiResults">
          <div className="midiResultsHead">
            <div><p className="midiKicker">MIDI READY</p><h2>{notes.length.toLocaleString()} editable notes</h2></div>
            <div className="midiStats"><span><strong>{duration.toFixed(1)}s</strong> length</span><span><strong>{noteName(pitchRange.min)}–{noteName(pitchRange.max)}</strong> range</span><span><strong>{bpm}</strong> BPM</span></div>
          </div>

          <div className="pianoRoll" aria-label="Detected MIDI notes piano roll">
            <div className="pianoRollGrid" />
            {notes.slice(0, 800).map((note, index) => {
              const range = Math.max(1, pitchRange.max - pitchRange.min + 1);
              return <i key={`${note.startTimeSeconds}-${note.pitchMidi}-${index}`} title={`${noteName(note.pitchMidi)} · ${note.startTimeSeconds.toFixed(2)}s`} style={{ left: `${(note.startTimeSeconds / Math.max(duration, 1)) * 100}%`, width: `${Math.max(0.18, (note.durationSeconds / Math.max(duration, 1)) * 100)}%`, bottom: `${((note.pitchMidi - pitchRange.min) / range) * 92 + 3}%`, opacity: Math.max(0.35, Math.min(1, note.amplitude)) }} />;
            })}
          </div>

          <div className="midiResultActions">
            <label><span>Preview sound</span><select value={previewSound} onChange={(event) => setPreviewSound(event.target.value as PreviewSound)}><option value="keys">Clean Keys</option><option value="synth">Bright Synth</option><option value="bass">Bass</option></select></label>
            <button type="button" onClick={() => previewing ? void stopPreview() : void previewMidi()}>{previewing ? "Stop Preview" : "Preview MIDI"}</button>
            <button className="primary" type="button" onClick={downloadMidi}>Download .MID</button>
            {projectId && cloudUser && <button type="button" disabled={saved} onClick={() => void saveToProject()}>{saved ? "Saved to Project" : "Save to Project"}</button>}
          </div>
          <p className="midiTruth">Audio-to-MIDI is an estimate. Complex full mixes can create extra or missed notes; isolated stems produce the most editable results.</p>
        </section>
      )}
    </main>
  );
}
