import type { Chain } from "./chain";
import type { Measurement } from "./audio";
import { buildGraph, connectBeat, measure } from "./audio";

export interface StudioGradeSettings {
  deEss: number;
  multiband: number;
  serialCompression: number;
  fxDuck: number;
  masterGlue: number;
  masterMatch: number;
  pitchCorrection: number;
  timingTightness: number;
}

export const DEFAULT_STUDIO_GRADE: StudioGradeSettings = {
  deEss: 64,
  multiband: 58,
  serialCompression: 66,
  fxDuck: 72,
  masterGlue: 55,
  masterMatch: 78,
  pitchCorrection: 0,
  timingTightness: 0,
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lin = (db: number) => 10 ** (db / 20);

function gain(ctx: BaseAudioContext, value = 1): GainNode {
  const n = ctx.createGain();
  n.gain.value = value;
  return n;
}

function compressor(
  ctx: BaseAudioContext,
  threshold: number,
  ratio: number,
  attack: number,
  release: number,
  knee = 8,
): DynamicsCompressorNode {
  const n = ctx.createDynamicsCompressor();
  n.threshold.value = threshold;
  n.ratio.value = ratio;
  n.attack.value = attack;
  n.release.value = release;
  n.knee.value = knee;
  return n;
}

function schedulePhraseWet(
  node: GainNode,
  vocal: AudioBuffer,
  baseMix: number,
  duckAmount: number,
): void {
  const data = vocal.getChannelData(0);
  const step = 0.035;
  const block = Math.max(1, Math.floor(vocal.sampleRate * step));
  let max = 0;
  const env: number[] = [];
  for (let i = 0; i < data.length; i += block) {
    let sum = 0;
    const end = Math.min(data.length, i + block);
    for (let j = i; j < end; j++) sum += data[j] * data[j];
    const rms = Math.sqrt(sum / Math.max(1, end - i));
    env.push(rms);
    max = Math.max(max, rms);
  }
  node.gain.setValueAtTime(baseMix, 0);
  if (max < 1e-5 || baseMix <= 0) return;
  let smooth = 0;
  for (let i = 0; i < env.length; i++) {
    const activity = clamp(env[i] / (max * 0.28), 0, 1);
    smooth += (activity - smooth) * (activity > smooth ? 0.7 : 0.12);
    const wet = baseMix * (1 - clamp(duckAmount, 0, 0.9) * smooth);
    node.gain.linearRampToValueAtTime(wet, (i + 1) * step);
  }
}

function makeImpulse(ctx: BaseAudioContext, seconds = 1.9): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  let seed = 918273;
  for (let c = 0; c < 2; c++) {
    const a = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      a[i] = ((seed / 4294967296) * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.42));
    }
  }
  return impulse;
}

export async function renderStudioVocal(
  buffer: AudioBuffer,
  chain: Chain,
  settings: StudioGradeSettings,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    2,
    Math.ceil((buffer.duration + 4) * buffer.sampleRate),
    buffer.sampleRate,
  );
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const input = gain(ctx, lin(chain.input));
  source.connect(input);

  // Adaptive de-ess: split the sibilance band and compress only that band.
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 5700;
  low.Q.value = 0.72;
  const sib = ctx.createBiquadFilter();
  sib.type = "highpass";
  sib.frequency.value = 5200;
  sib.Q.value = 0.72;
  const sibComp = compressor(
    ctx,
    -27 + (100 - settings.deEss) * 0.08,
    2.2 + settings.deEss / 25,
    0.0015,
    0.055,
    4,
  );
  const deEssSum = gain(ctx);
  input.connect(low).connect(deEssSum);
  input.connect(sib).connect(sibComp).connect(deEssSum);

  // Three-band dynamic control.
  const mbSum = gain(ctx);
  const amount = settings.multiband / 100;
  const bands = [
    { type: "lowpass" as BiquadFilterType, f: 260, t: -22, r: 1.7 + amount * 1.8 },
    { type: "bandpass" as BiquadFilterType, f: 1500, t: -25, r: 1.8 + amount * 2.2 },
    { type: "highpass" as BiquadFilterType, f: 4700, t: -28, r: 1.6 + amount * 2.4 },
  ];
  for (const band of bands) {
    const filter = ctx.createBiquadFilter();
    filter.type = band.type;
    filter.frequency.value = band.f;
    filter.Q.value = band.type === "bandpass" ? 0.45 : 0.7;
    const comp = compressor(ctx, band.t, band.r, 0.008, 0.12, 10);
    deEssSum.connect(filter).connect(comp).connect(mbSum);
  }

  // Serial compression: slower leveler followed by fast peak control.
  const serial = settings.serialCompression / 100;
  const leveler = compressor(ctx, -20 - serial * 8, 1.8 + serial * 1.6, 0.022, 0.2, 16);
  const peak = compressor(ctx, -10 - serial * 5, 3.5 + serial * 2.5, 0.0025, 0.075, 5);
  mbSum.connect(leveler).connect(peak);

  // Reuse the established tone/saturation/double/limiter chain, but not its basic comp/FX.
  const toneBus = gain(ctx);
  const advancedChain: Chain = {
    ...chain,
    input: 0,
    output: 0,
    order: chain.order.filter((x) => !["compression", "reverb", "delay"].includes(x)),
  };
  buildGraph(ctx, peak, advancedChain, toneBus);

  const output = gain(ctx, lin(chain.output));
  const dry = gain(ctx, 1);
  toneBus.connect(dry).connect(output);

  const fxDuck = clamp(settings.fxDuck / 100, 0, 1) * 0.82;
  if (chain.space > 0) {
    const verb = ctx.createConvolver();
    verb.buffer = makeImpulse(ctx);
    const wet = gain(ctx, chain.space / 100);
    schedulePhraseWet(wet, buffer, chain.space / 100, fxDuck);
    toneBus.connect(verb).connect(wet).connect(output);
  }
  if (chain.echo > 0) {
    const delay = ctx.createDelay(1);
    delay.delayTime.value = clamp(chain.delayTime / 1000, 0.06, 0.8);
    const feedback = gain(ctx, 0.18 + (chain.echo / 100) * 0.18);
    const wet = gain(ctx, chain.echo / 100);
    schedulePhraseWet(wet, buffer, chain.echo / 100, fxDuck * 0.9);
    toneBus.connect(delay).connect(wet).connect(output);
    delay.connect(feedback).connect(delay);
  }

  output.connect(ctx.destination);
  source.start();
  return ctx.startRendering();
}

export async function renderStudioMix(
  vocal: AudioBuffer,
  beat: AudioBuffer,
  chain: Chain,
  settings: StudioGradeSettings,
  beatLevelDb: number,
  pocketDb: number,
  duckDb: number,
): Promise<AudioBuffer> {
  const wet = await renderStudioVocal(vocal, chain, settings);
  const sr = wet.sampleRate;
  const ctx = new OfflineAudioContext(2, Math.ceil(Math.max(wet.duration, beat.duration) * sr), sr);
  const lead = ctx.createBufferSource();
  lead.buffer = wet;
  lead.connect(ctx.destination);
  const instrumental = ctx.createBufferSource();
  instrumental.buffer = beat;
  connectBeat(ctx, instrumental, wet, beatLevelDb, pocketDb, duckDb);
  lead.start();
  instrumental.start();
  return ctx.startRendering();
}

export async function renderReferenceMaster(
  mix: AudioBuffer,
  reference: Measurement,
  settings: StudioGradeSettings,
): Promise<AudioBuffer> {
  const before = await measure(mix);
  const ctx = new OfflineAudioContext(2, mix.length, mix.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = mix;

  const pre = gain(ctx);
  const targetLift = clamp((reference.rmsDb - before.rmsDb) * (settings.masterMatch / 100), -5, 5);
  pre.gain.value = lin(targetLift);

  const glue = settings.masterGlue / 100;
  const bus = compressor(ctx, -13 - glue * 5, 1.5 + glue * 1.4, 0.025, 0.18, 12);

  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(8192);
  const drive = 1.05 + glue * 0.55;
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  shaper.curve = curve;
  shaper.oversample = "4x";

  const ceiling = gain(ctx, lin(-0.8));
  src.connect(pre).connect(bus).connect(shaper).connect(ceiling).connect(ctx.destination);
  src.start();
  return ctx.startRendering();
}
