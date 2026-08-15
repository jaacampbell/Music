import { useCallback, useEffect, useRef, useState } from "react";

export interface StemInfo {
  name: string;
  label?: string;
  group?: string;
  family?: string;
  engine?: string;
  mixable?: boolean;
  prompt?: string;
  file?: string;
  downloadName?: string;
  url: string;
  integratedDb: number;
}

export interface StemUi {
  name: string;
  muted: boolean;
  solo: boolean;
  gain: number;
  loaded: boolean;
}

export interface RealStemPlayer {
  stems: StemUi[];
  isPlaying: boolean;
  isLoading: boolean;
  loadStems: (baseUrl: string, stems: StemInfo[]) => Promise<void>;
  play: () => void;
  stop: () => void;
  setMuted: (name: string, muted: boolean) => void;
  setSolo: (name: string, solo: boolean) => void;
  setGain: (name: string, gain: number) => void;
  karaoke: () => void;
  acapella: () => void;
  reset: () => void;
}

interface StemNode {
  buffer: AudioBuffer;
  gain: GainNode;
  source?: AudioBufferSourceNode;
}

export function useRealStemPlayer(): RealStemPlayer {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<Map<string, StemNode>>(new Map());

  const [stems, setStems] = useState<StemUi[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const stemsRef = useRef<StemUi[]>([]);
  stemsRef.current = stems;

  const ensureCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      const master = ctxRef.current.createGain();
      master.gain.value = 1;
      master.connect(ctxRef.current.destination);
      masterRef.current = master;
    }
    return ctxRef.current;
  }, []);

  const applyMix = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const current = stemsRef.current;
    const anySolo = current.some((s) => s.solo);
    for (const s of current) {
      const node = nodesRef.current.get(s.name);
      if (!node) continue;
      const target = anySolo ? (s.solo ? s.gain : 0) : s.muted ? 0 : s.gain;
      node.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.02);
    }
  }, []);

  const loadStems = useCallback(
    async (baseUrl: string, incoming: StemInfo[]): Promise<void> => {
      setIsLoading(true);
      try {
        const ctx = ensureCtx();
        nodesRef.current.forEach((n) => n.source?.stop());
        nodesRef.current.clear();
        setIsPlaying(false);

        const loaded = await Promise.all(
          incoming.map(async (stem) => {
            const url = /^https?:\/\//i.test(stem.url) ? stem.url : baseUrl + stem.url;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`fetch ${stem.name} failed (${res.status})`);
            const buf = await ctx.decodeAudioData(await res.arrayBuffer());
            const gain = ctx.createGain();
            gain.gain.value = 0.9;
            gain.connect(masterRef.current!);
            nodesRef.current.set(stem.name, { buffer: buf, gain });
            return stem.name;
          })
        );

        setStems(
          incoming.map((s) => ({
            name: s.name,
            muted: false,
            solo: false,
            gain: 0.9,
            loaded: loaded.includes(s.name)
          }))
        );
      } finally {
        setIsLoading(false);
      }
    },
    [ensureCtx]
  );

  const stop = useCallback(() => {
    nodesRef.current.forEach((node) => {
      try {
        node.source?.stop();
      } catch {
        // already stopped
      }
      node.source = undefined;
    });
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || nodesRef.current.size === 0) return;
    void ctx.resume();
    nodesRef.current.forEach((node) => {
      try {
        node.source?.stop();
      } catch {
        // ignore
      }
    });
    const startAt = ctx.currentTime + 0.05;
    nodesRef.current.forEach((node) => {
      const source = ctx.createBufferSource();
      source.buffer = node.buffer;
      source.loop = true;
      source.connect(node.gain);
      source.start(startAt);
      node.source = source;
    });
    applyMix();
    setIsPlaying(true);
  }, [applyMix]);

  const update = useCallback((name: string, patch: Partial<StemUi>) => {
    setStems((prev) => prev.map((s) => (s.name === name ? { ...s, ...patch } : s)));
  }, []);

  const setMuted = useCallback((name: string, muted: boolean) => update(name, { muted }), [update]);
  const setSolo = useCallback((name: string, solo: boolean) => update(name, { solo }), [update]);
  const setGain = useCallback((name: string, gain: number) => update(name, { gain }), [update]);

  const karaoke = useCallback(() => {
    setStems((prev) =>
      prev.map((s) => ({ ...s, solo: false, muted: s.name === "vocals" }))
    );
  }, []);
  const acapella = useCallback(() => {
    setStems((prev) => prev.map((s) => ({ ...s, muted: false, solo: s.name === "vocals" })));
  }, []);
  const reset = useCallback(() => {
    setStems((prev) => prev.map((s) => ({ ...s, muted: false, solo: false, gain: 0.9 })));
  }, []);

  useEffect(() => {
    applyMix();
  }, [stems, applyMix]);

  useEffect(() => {
    return () => {
      nodesRef.current.forEach((n) => {
        try {
          n.source?.stop();
        } catch {
          // ignore
        }
      });
      void ctxRef.current?.close();
    };
  }, []);

  return {
    stems,
    isPlaying,
    isLoading,
    loadStems,
    play,
    stop,
    setMuted,
    setSolo,
    setGain,
    karaoke,
    acapella,
    reset
  };
}
