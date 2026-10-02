import { type Chain } from "./chain";
export interface Measurement {
  peakDb: number;
  rmsDb: number;
  clippedSamples: number;
  duration: number;
  bands: number[];
  spectrumRmsDb: number;
  wave: number[];
  silent: boolean;
}
const db = (n: number) => (n > 1e-6 ? 20 * Math.log10(n) : -120);
export async function measure(buffer: AudioBuffer): Promise<Measurement> {
  let peak = 0,
    sum = 0,
    clipped = 0;
  const mono = new Float32Array(buffer.length);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const a = Math.abs(data[i]);
      peak = Math.max(peak, a);
      sum += a * a;
      if (a >= 0.999) clipped++;
      mono[i] += data[i] / buffer.numberOfChannels;
    }
  }
  const wave = Array.from({ length: 120 }, (_, p) => {
    let v = 0;
    const end = Math.floor(((p + 1) * mono.length) / 120);
    for (let i = Math.floor((p * mono.length) / 120); i < end; i++)
      v = Math.max(v, Math.abs(mono[i]));
    return v;
  });
  let spectrumSum = 0;
  const spectrumLength = Math.min(mono.length, buffer.sampleRate * 20);
  for (let i = 0; i < spectrumLength; i++) spectrumSum += mono[i] * mono[i];
  const bands = await Promise.all(
    [220, 3000, 9000].map(async (frequency) => {
      const length = Math.min(buffer.length, buffer.sampleRate * 20);
      const ctx = new OfflineAudioContext(1, length, buffer.sampleRate);
      const b = ctx.createBuffer(1, length, buffer.sampleRate);
      b.copyToChannel(mono.subarray(0, length), 0);
      const src = ctx.createBufferSource();
      src.buffer = b;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = Math.min(frequency, buffer.sampleRate * 0.4);
      filter.Q.value = 0.7;
      src.connect(filter).connect(ctx.destination);
      src.start();
      const out = (await ctx.startRendering()).getChannelData(0);
      let energy = 0;
      for (const v of out) energy += v * v;
      return db(Math.sqrt(energy / out.length));
    }),
  );
  return {
    peakDb: db(peak),
    rmsDb: db(Math.sqrt(sum / (buffer.length * buffer.numberOfChannels))),
    clippedSamples: clipped,
    duration: buffer.duration,
    bands,
    spectrumRmsDb: db(Math.sqrt(spectrumSum / spectrumLength)),
    wave,
    silent: peak < 1e-5,
  };
}
export function buildGraph(
  ctx: BaseAudioContext,
  source: AudioNode,
  chain: Chain,
  destination: AudioNode,
): void {
  const gain = (v: number) => {
    const node = ctx.createGain();
    node.gain.value = v;
    return node;
  };
  let current: AudioNode = gain(10 ** (chain.input / 20));
  source.connect(current);
  for (const stage of chain.order) {
    if (stage === "eq") {
      for (const [type, freq, value] of [
        ["highpass", chain.highpass, 0],
        ["peaking", 220, chain.warmth],
        ["peaking", 3000, chain.presence],
        ["highshelf", 9000, chain.air],
      ] as const) {
        const n = ctx.createBiquadFilter();
        n.type = type;
        n.frequency.value = freq;
        n.Q.value = 0.7;
        n.gain.value = value;
        current.connect(n);
        current = n;
      }
    } else if (stage === "compression" || stage === "limiter") {
      const n = ctx.createDynamicsCompressor();
      n.threshold.value = stage === "limiter" ? -3 : chain.threshold;
      n.ratio.value = stage === "limiter" ? 12 : chain.ratio;
      n.knee.value = stage === "limiter" ? 0 : 12;
      n.attack.value = stage === "limiter" ? 0.003 : 0.012;
      n.release.value = 0.15;
      current.connect(n);
      current = n;
    } else if (stage === "saturation") {
      const n = ctx.createWaveShaper();
      const curve = new Float32Array(4096);
      const amount = 1 + chain.drive / 12;
      for (let i = 0; i < curve.length; i++) {
        const x = (2 * i) / (curve.length - 1) - 1;
        curve[i] =
          chain.drive <= 0 ? x : Math.tanh(amount * x) / Math.tanh(amount);
      }
      n.curve = curve;
      n.oversample = "2x";
      current.connect(n);
      current = n;
    } else {
      const mix =
        stage === "reverb"
          ? chain.space / 100
          : stage === "delay"
            ? chain.echo / 100
            : chain.width / 100;
      const join = gain(1),
        dry = gain(1 - mix),
        wet = gain(mix);
      current.connect(dry).connect(join);
      if (stage === "reverb") {
        const n = ctx.createConvolver();
        const length = Math.floor(ctx.sampleRate * 1.7);
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
        let seed = 123456;
        for (let c = 0; c < 2; c++) {
          const a = impulse.getChannelData(c);
          for (let i = 0; i < length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            a[i] =
              ((seed / 4294967296) * 2 - 1) *
              Math.exp(-i / (ctx.sampleRate * 0.35));
          }
        }
        n.buffer = impulse;
        current.connect(n).connect(wet).connect(join);
      } else if (stage === "delay") {
        const n = ctx.createDelay(1);
        n.delayTime.value = chain.delayTime / 1000;
        const fb = gain(0.25);
        current.connect(n).connect(wet).connect(join);
        n.connect(fb).connect(n);
      } else {
        const splitter = ctx.createChannelMerger(2);
        [0.018, 0.031].forEach((time, i) => {
          const delay = ctx.createDelay(1);
          delay.delayTime.value = time;
          current.connect(delay);
          delay.connect(splitter, 0, i);
        });
        splitter.connect(wet).connect(join);
      }
      current = join;
    }
  }
  current.connect(gain(10 ** (chain.output / 20))).connect(destination);
}
export async function renderWet(
  buffer: AudioBuffer,
  chain: Chain,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    2,
    Math.ceil((buffer.duration + 3) * buffer.sampleRate),
    buffer.sampleRate,
  );
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  buildGraph(ctx, source, chain, ctx.destination);
  source.start();
  return ctx.startRendering();
}
export function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const channels = buffer.numberOfChannels,
    length = buffer.length * channels * 2;
  const array = new ArrayBuffer(44 + length);
  const view = new DataView(array);
  const str = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(offset + i, value.charCodeAt(i));
  };
  str(0, "RIFF");
  view.setUint32(4, 36 + length, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, length, true);
  const data = Array.from({ length: channels }, (_, c) =>
    buffer.getChannelData(c),
  );
  for (let i = 0; i < buffer.length; i++)
    for (let c = 0; c < channels; c++) {
      const sample = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(
        44 + (i * channels + c) * 2,
        sample < 0 ? sample * 32768 : sample * 32767,
        true,
      );
    }
  return array;
}
/** Schedule instrumental gain from the vocal envelope, never from a fabricated timeline. */
export function scheduleDucking(
  ctx: BaseAudioContext,
  node: GainNode,
  vocal: AudioBuffer,
  levelDb: number,
  duckDb: number,
  start = 0,
): void {
  const step = 0.04,
    block = Math.max(1, Math.floor(vocal.sampleRate * step));
  const data = vocal.getChannelData(0);
  let peakRms = 0;
  const envelope: number[] = [];
  for (let i = 0; i < data.length; i += block) {
    let sum = 0;
    const end = Math.min(i + block, data.length);
    for (let j = i; j < end; j++) sum += data[j] * data[j];
    const rms = Math.sqrt(sum / (end - i));
    envelope.push(rms);
    peakRms = Math.max(peakRms, rms);
  }
  node.gain.setValueAtTime(10 ** (levelDb / 20), start);
  if (peakRms < 1e-5 || duckDb <= 0) return;
  let smoothed = 0;
  for (let i = 0; i < envelope.length; i++) {
    const strength = Math.min(1, envelope[i] / (peakRms * 0.3));
    smoothed += (strength - smoothed) * (strength > smoothed ? 0.75 : 0.2);
    node.gain.linearRampToValueAtTime(
      10 ** ((levelDb - duckDb * smoothed) / 20),
      start + (i + 1) * step,
    );
  }
  node.gain.linearRampToValueAtTime(
    10 ** (levelDb / 20),
    start + vocal.duration + 0.25,
  );
}
export function connectBeat(
  ctx: BaseAudioContext,
  source: AudioNode,
  vocal: AudioBuffer,
  levelDb: number,
  pocketDb: number,
  duckDb: number,
  start = 0,
): void {
  const cut = ctx.createBiquadFilter();
  cut.type = "peaking";
  cut.frequency.value = 3000;
  cut.Q.value = 0.7;
  cut.gain.value = -Math.max(0, Math.min(6, pocketDb));
  const gain = ctx.createGain();
  scheduleDucking(
    ctx,
    gain,
    vocal,
    Math.max(-30, Math.min(0, levelDb)),
    Math.max(0, Math.min(9, duckDb)),
    start,
  );
  source.connect(cut).connect(gain).connect(ctx.destination);
}
export async function renderMix(
  vocal: AudioBuffer,
  beat: AudioBuffer,
  chain: Chain,
  levelDb: number,
  pocketDb: number,
  duckDb: number,
): Promise<AudioBuffer> {
  const wet = await renderWet(vocal, chain);
  const ctx = new OfflineAudioContext(
    2,
    Math.ceil(Math.max(wet.duration, beat.duration) * wet.sampleRate),
    wet.sampleRate,
  );
  const lead = ctx.createBufferSource();
  lead.buffer = wet;
  lead.connect(ctx.destination);
  const instrumental = ctx.createBufferSource();
  instrumental.buffer = beat;
  connectBeat(ctx, instrumental, wet, levelDb, pocketDb, duckDb);
  lead.start();
  instrumental.start();
  return ctx.startRendering();
}
