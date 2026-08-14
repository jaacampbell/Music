import type { LiveAudioAnalysis } from "@/lib/types";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const rotate = (values: number[], shift: number): number[] =>
  values.map((_, index) => values[(index - shift + values.length) % values.length]);

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    aa += a[index] * a[index];
    bb += b[index] * b[index];
  }
  return aa > 0 && bb > 0 ? dot / Math.sqrt(aa * bb) : 0;
};

const estimateTempo = (samples: Float32Array, sampleRate: number): { bpm: number | null; confidence: number } => {
  const envelopeRate = 200;
  const blockSize = Math.max(1, Math.floor(sampleRate / envelopeRate));
  const blockCount = Math.floor(samples.length / blockSize);
  if (blockCount < envelopeRate * 5) return { bpm: null, confidence: 0 };

  const envelope = new Float32Array(blockCount);
  for (let block = 0; block < blockCount; block += 1) {
    let sum = 0;
    const start = block * blockSize;
    for (let index = start; index < start + blockSize; index += 1) sum += Math.abs(samples[index]);
    envelope[block] = sum / blockSize;
  }

  const onset = new Float32Array(blockCount);
  let onsetMean = 0;
  for (let index = 1; index < blockCount; index += 1) {
    onset[index] = Math.max(0, envelope[index] - envelope[index - 1]);
    onsetMean += onset[index];
  }
  onsetMean /= Math.max(1, blockCount - 1);
  for (let index = 0; index < blockCount; index += 1) onset[index] = Math.max(0, onset[index] - onsetMean * 0.35);

  let bestBpm = 0;
  let bestScore = -Infinity;
  const scores: number[] = [];
  for (let bpm = 60; bpm <= 200; bpm += 1) {
    const lag = Math.round((envelopeRate * 60) / bpm);
    let score = 0;
    let normA = 0;
    let normB = 0;
    for (let index = lag; index < blockCount; index += 1) {
      const a = onset[index];
      const b = onset[index - lag];
      score += a * b;
      normA += a * a;
      normB += b * b;
    }
    const normalized = normA > 0 && normB > 0 ? score / Math.sqrt(normA * normB) : 0;
    scores.push(normalized);
    if (normalized > bestScore) {
      bestScore = normalized;
      bestBpm = bpm;
    }
  }

  const sorted = scores.slice().sort((a, b) => b - a);
  const second = sorted[1] ?? 0;
  const confidence = Math.max(0, Math.min(1, bestScore * 0.75 + Math.max(0, bestScore - second) * 2));
  return { bpm: bestBpm || null, confidence: Number(confidence.toFixed(2)) };
};

const goertzelEnergy = (samples: Float32Array, sampleRate: number, frequency: number, stride: number): number => {
  const normalized = frequency / sampleRate;
  const coeff = 2 * Math.cos(2 * Math.PI * normalized * stride);
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  for (let index = 0; index < samples.length; index += stride) {
    s0 = samples[index] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return Math.max(0, s1 * s1 + s2 * s2 - coeff * s1 * s2);
};

const estimateKey = (samples: Float32Array, sampleRate: number): { key: string | null; confidence: number } => {
  if (samples.length < sampleRate * 3) return { key: null, confidence: 0 };

  const maxSeconds = 24;
  const usable = samples.subarray(0, Math.min(samples.length, Math.floor(sampleRate * maxSeconds)));
  const stride = Math.max(1, Math.floor(sampleRate / 11025));
  const chroma = new Array<number>(12).fill(0);

  for (let midi = 36; midi <= 83; midi += 1) {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    if (frequency >= sampleRate / (2 * stride) * 0.92) continue;
    const pitchClass = midi % 12;
    chroma[pitchClass] += Math.sqrt(goertzelEnergy(usable, sampleRate, frequency, stride));
  }

  const total = chroma.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) return { key: null, confidence: 0 };
  const normalized = chroma.map((value) => value / total);

  const candidates: Array<{ key: string; score: number }> = [];
  for (let root = 0; root < 12; root += 1) {
    candidates.push({ key: `${NOTE_NAMES[root]} major`, score: cosineSimilarity(normalized, rotate(MAJOR_PROFILE, root)) });
    candidates.push({ key: `${NOTE_NAMES[root]} minor`, score: cosineSimilarity(normalized, rotate(MINOR_PROFILE, root)) });
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const second = candidates[1];
  if (!best) return { key: null, confidence: 0 };
  const gap = best.score - (second?.score ?? 0);
  const confidence = Math.max(0, Math.min(1, (best.score - 0.55) * 1.6 + gap * 4));
  return { key: best.key, confidence: Number(confidence.toFixed(2)) };
};

export const analyzeAudioFile = async (file: File): Promise<LiveAudioAnalysis> => {
  const AudioContextCtor = window.AudioContext;
  const context = new AudioContextCtor();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    const channels = decoded.numberOfChannels;
    const length = decoded.length;
    const mono = new Float32Array(length);

    for (let channel = 0; channel < channels; channel += 1) {
      const data = decoded.getChannelData(channel);
      for (let index = 0; index < length; index += 1) mono[index] += data[index] / channels;
    }

    let peak = 0;
    let squareSum = 0;
    for (let index = 0; index < mono.length; index += 1) {
      const value = mono[index];
      peak = Math.max(peak, Math.abs(value));
      squareSum += value * value;
    }
    const rms = Math.sqrt(squareSum / Math.max(1, mono.length));
    const toDb = (value: number): number => (value > 1e-9 ? 20 * Math.log10(value) : -120);

    const tempo = estimateTempo(mono, decoded.sampleRate);
    const key = estimateKey(mono, decoded.sampleRate);

    return {
      bpm: tempo.bpm,
      key: key.key,
      bpmConfidence: tempo.confidence,
      keyConfidence: key.confidence,
      peakDb: Number(toDb(peak).toFixed(1)),
      rmsDb: Number(toDb(rms).toFixed(1)),
      durationSec: Number(decoded.duration.toFixed(2)),
      sampleRate: decoded.sampleRate,
      channels,
      engine: "Beat Lab browser DSP v1",
      analyzedAt: new Date().toISOString()
    };
  } finally {
    await context.close();
  }
};
