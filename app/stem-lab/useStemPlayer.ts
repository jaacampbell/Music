import { useCallback, useEffect, useRef, useState } from "react";

import { STEM_NAMES, type StemName } from "@/lib/stem-extraction/types";

export interface StemUiState {
  muted: boolean;
  solo: boolean;
  gain: number;
}

export interface StemPlayer {
  isPlaying: boolean;
  stems: Record<StemName, StemUiState>;
  toggle: () => void;
  setMuted: (name: StemName, muted: boolean) => void;
  setSolo: (name: StemName, solo: boolean) => void;
  setGain: (name: StemName, gain: number) => void;
  karaoke: () => void;
  acapella: () => void;
  resetMix: () => void;
}

interface StemNodes {
  gain: GainNode;
  env: GainNode;
  osc?: OscillatorNode;
  pad?: OscillatorNode[];
}

interface AudioGraph {
  master: GainNode;
  stems: Record<StemName, StemNodes>;
  noise: AudioBuffer;
}

const SECONDS_PER_16TH = 60 / 100 / 4; // 100 BPM
// Pentatonic-ish A-minor content; `null` = rest.
const VOCAL_SEQ: (number | null)[] = [
  440, null, 523.25, null, 587.33, null, 659.25, null,
  587.33, null, 523.25, null, 440, null, null, null
];
const BASS_SEQ: (number | null)[] = [
  55, null, null, null, 65.41, null, null, null,
  82.41, null, null, null, 73.42, null, null, null
];
const PAD_FREQS = [220, 261.63, 329.63];

const defaultStem = (): StemUiState => ({ muted: false, solo: false, gain: 0.85 });
const initialStems = (): Record<StemName, StemUiState> =>
  Object.fromEntries(STEM_NAMES.map((n) => [n, defaultStem()])) as Record<
    StemName,
    StemUiState
  >;

export function useStemPlayer(): StemPlayer {
  const ctxRef = useRef<AudioContext | null>(null);
  const graphRef = useRef<AudioGraph | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const stepRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [stems, setStems] = useState<Record<StemName, StemUiState>>(initialStems);
  const stemsRef = useRef(stems);
  stemsRef.current = stems;

  const makeNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  };

  const buildGraph = useCallback((ctx: AudioContext): AudioGraph => {
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    const stemsNodes = {} as Record<StemName, StemNodes>;
    for (const name of STEM_NAMES) {
      const gain = ctx.createGain();
      gain.gain.value = 0.85;
      gain.connect(master);
      const env = ctx.createGain();
      env.gain.value = name === "other" ? 0.18 : 0;
      env.connect(gain);
      stemsNodes[name] = { gain, env };
    }

    // Sustained pad for "other".
    const pad = PAD_FREQS.map((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 8;
      osc.connect(stemsNodes.other.env);
      osc.start();
      return osc;
    });
    stemsNodes.other.pad = pad;

    // Pitched, gated voices for vocals + bass.
    for (const name of ["vocals", "bass"] as StemName[]) {
      const osc = ctx.createOscillator();
      osc.type = name === "vocals" ? "triangle" : "sawtooth";
      osc.frequency.value = name === "vocals" ? 440 : 55;
      osc.connect(stemsNodes[name].env);
      osc.start();
      stemsNodes[name].osc = osc;
    }

    return { master, stems: stemsNodes, noise: makeNoiseBuffer(ctx) };
  }, []);

  const effectiveGain = useCallback((name: StemName): number => {
    const current = stemsRef.current;
    const anySolo = STEM_NAMES.some((n) => current[n].solo);
    const s = current[name];
    if (anySolo) return s.solo ? s.gain : 0;
    return s.muted ? 0 : s.gain;
  }, []);

  const applyMix = useCallback(() => {
    const ctx = ctxRef.current;
    const graph = graphRef.current;
    if (!ctx || !graph) return;
    for (const name of STEM_NAMES) {
      graph.stems[name].gain.gain.setTargetAtTime(
        effectiveGain(name),
        ctx.currentTime,
        0.03
      );
    }
  }, [effectiveGain]);

  const triggerDrum = useCallback(
    (time: number, kind: "kick" | "snare" | "hat") => {
      const ctx = ctxRef.current;
      const graph = graphRef.current;
      if (!ctx || !graph) return;
      const out = graph.stems.drums.env;

      if (kind === "kick") {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
        env.gain.setValueAtTime(1, time);
        env.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        osc.connect(env);
        env.connect(out);
        osc.start(time);
        osc.stop(time + 0.2);
        return;
      }

      const src = ctx.createBufferSource();
      src.buffer = graph.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = kind === "snare" ? 1800 : 7000;
      const env = ctx.createGain();
      const peak = kind === "snare" ? 0.7 : 0.35;
      const decay = kind === "snare" ? 0.18 : 0.05;
      env.gain.setValueAtTime(peak, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + decay);
      src.connect(filter);
      filter.connect(env);
      env.connect(out);
      src.start(time);
      src.stop(time + decay + 0.02);
    },
    []
  );

  const scheduleStep = useCallback(
    (step: number, time: number) => {
      const ctx = ctxRef.current;
      const graph = graphRef.current;
      if (!ctx || !graph) return;

      // Drums.
      if (step % 4 === 0) triggerDrum(time, "kick");
      if (step === 4 || step === 12) triggerDrum(time, "snare");
      triggerDrum(time, "hat");

      // Vocals (gated triangle).
      const vocal = VOCAL_SEQ[step];
      if (vocal && graph.stems.vocals.osc) {
        graph.stems.vocals.osc.frequency.setValueAtTime(vocal, time);
        const env = graph.stems.vocals.env.gain;
        env.cancelScheduledValues(time);
        env.setValueAtTime(0.0001, time);
        env.exponentialRampToValueAtTime(0.5, time + 0.02);
        env.exponentialRampToValueAtTime(0.0001, time + SECONDS_PER_16TH * 1.8);
      }

      // Bass (gated saw).
      const bass = BASS_SEQ[step];
      if (bass && graph.stems.bass.osc) {
        graph.stems.bass.osc.frequency.setValueAtTime(bass, time);
        const env = graph.stems.bass.env.gain;
        env.cancelScheduledValues(time);
        env.setValueAtTime(0.0001, time);
        env.exponentialRampToValueAtTime(0.6, time + 0.02);
        env.exponentialRampToValueAtTime(0.0001, time + SECONDS_PER_16TH * 3.5);
      }
    },
    [triggerDrum]
  );

  const stopScheduler = useCallback(() => {
    if (schedulerRef.current !== null) {
      window.clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    let ctx = ctxRef.current;
    if (!ctx) {
      ctx = new AudioContext();
      ctxRef.current = ctx;
      graphRef.current = buildGraph(ctx);
    }
    void ctx.resume();
    applyMix();
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    stepRef.current = 0;

    schedulerRef.current = window.setInterval(() => {
      const audio = ctxRef.current;
      if (!audio) return;
      while (nextNoteTimeRef.current < audio.currentTime + 0.1) {
        scheduleStep(stepRef.current, nextNoteTimeRef.current);
        nextNoteTimeRef.current += SECONDS_PER_16TH;
        stepRef.current = (stepRef.current + 1) % 16;
      }
    }, 25);
    setIsPlaying(true);
  }, [applyMix, buildGraph, scheduleStep]);

  const pause = useCallback(() => {
    stopScheduler();
    const ctx = ctxRef.current;
    const graph = graphRef.current;
    if (ctx && graph) {
      graph.master.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      window.setTimeout(() => {
        void ctx.suspend();
        graph.master.gain.setValueAtTime(0.9, ctx.currentTime);
      }, 60);
    }
    setIsPlaying(false);
  }, [stopScheduler]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const setMuted = useCallback((name: StemName, muted: boolean) => {
    setStems((prev) => ({ ...prev, [name]: { ...prev[name], muted } }));
  }, []);
  const setSolo = useCallback((name: StemName, solo: boolean) => {
    setStems((prev) => ({ ...prev, [name]: { ...prev[name], solo } }));
  }, []);
  const setGain = useCallback((name: StemName, gain: number) => {
    setStems((prev) => ({ ...prev, [name]: { ...prev[name], gain } }));
  }, []);

  const karaoke = useCallback(() => {
    setStems((prev) => {
      const next = { ...prev } as Record<StemName, StemUiState>;
      for (const n of STEM_NAMES) {
        next[n] = { ...prev[n], solo: false, muted: n === "vocals" };
      }
      return next;
    });
  }, []);
  const acapella = useCallback(() => {
    setStems((prev) => {
      const next = { ...prev } as Record<StemName, StemUiState>;
      for (const n of STEM_NAMES) {
        next[n] = { ...prev[n], muted: false, solo: n === "vocals" };
      }
      return next;
    });
  }, []);
  const resetMix = useCallback(() => setStems(initialStems()), []);

  // Reflect mix changes into the audio graph live.
  useEffect(() => {
    applyMix();
  }, [stems, applyMix]);

  useEffect(() => {
    return () => {
      stopScheduler();
      void ctxRef.current?.close();
      ctxRef.current = null;
      graphRef.current = null;
    };
  }, [stopScheduler]);

  return {
    isPlaying,
    stems,
    toggle,
    setMuted,
    setSolo,
    setGain,
    karaoke,
    acapella,
    resetMix
  };
}
