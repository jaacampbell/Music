import type { Measurement } from "./audio";
import { sanitizeChain, type Chain } from "./chain";

export interface ReferenceMatchResult {
  chain: Chain;
  pocketDb: number;
  duckDb: number;
  beatLevelDb: number;
  voiceProfile: string;
  fusionLabel: string;
  masterLabel: string;
  dnaSummary: string;
  confidence: number;
}

type Input = {
  vocal: Measurement;
  reference: Measurement;
  beat: Measurement | null;
  current: Chain;
  referenceAmount: number;
  polish: number;
  glue: number;
  space: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);

function relativeBands(m: Measurement): number[] {
  return m.bands.map((v) => v - m.spectrumRmsDb);
}

export function buildReferenceMatch(input: Input): ReferenceMatchResult {
  const { vocal, reference, beat, current } = input;
  const ref = clamp(input.referenceAmount / 100, 0, 1);
  const polish = clamp(input.polish / 100, 0, 1);
  const glue = clamp(input.glue / 100, 0, 1);
  const space = clamp(input.space / 100, 0, 1);

  const a = relativeBands(vocal);
  const b = relativeBands(reference);
  const delta = a.map((v, i) => clamp(b[i] - v, -8, 8));

  const vocalCrest = Math.max(1, vocal.peakDb - vocal.rmsDb);
  const refCrest = Math.max(1, reference.peakDb - reference.rmsDb);
  const densityNeed = clamp((vocalCrest - refCrest) / 10, -1, 1);

  const warmthTarget = clamp(delta[0] * ref * 0.9, -6, 6);
  const presenceTarget = clamp(delta[1] * ref * 0.85, -6, 6);
  const airTarget = clamp(delta[2] * ref * 0.75, -5, 5);

  const thresholdTarget = clamp(-20 - Math.max(0, densityNeed) * 9 - glue * 4, -36, -14);
  const ratioTarget = clamp(2.2 + Math.max(0, densityNeed) * 2.8 + glue * 1.5, 1.5, 6.5);
  const driveTarget = clamp(5 + polish * 10 + Math.max(0, densityNeed) * 7, 3, 24);

  const highAir = clamp((b[2] + 10) / 14, 0, 1);
  const spaciousness = clamp((refCrest - 5) / 12, 0, 1);
  const spaceTarget = clamp(7 + space * (9 + spaciousness * 12), 5, 34);
  const echoTarget = clamp(3 + space * (5 + spaciousness * 10), 0, 24);
  const widthTarget = clamp(space * (6 + highAir * 14), 0, 24);

  const outputDelta = clamp((reference.rmsDb - vocal.rmsDb) * 0.22 * polish, -3, 3);
  const chain = sanitizeChain({
    ...current,
    warmth: mix(current.warmth, warmthTarget, ref),
    presence: mix(current.presence, presenceTarget, ref),
    air: mix(current.air, airTarget, ref),
    threshold: mix(current.threshold, thresholdTarget, 0.45 + glue * 0.45),
    ratio: mix(current.ratio, ratioTarget, 0.4 + glue * 0.45),
    drive: mix(current.drive, driveTarget, 0.35 + polish * 0.45),
    space: mix(current.space, spaceTarget, space * 0.8),
    echo: mix(current.echo, echoTarget, space * 0.75),
    width: mix(current.width, widthTarget, space * 0.7),
    output: clamp(current.output + outputDelta, -8, 1),
  });

  let pocketDb = 1.5;
  let duckDb = 2.5;
  let beatLevelDb = -9;
  if (beat) {
    const vocalPresence = vocal.bands[1] + chain.input + chain.output;
    const beatPresence = beat.bands[1];
    const overlap = clamp((beatPresence - vocalPresence + 8) / 12, 0, 1);
    pocketDb = clamp(1 + overlap * 3.5 * glue, 0.5, 4.5);
    duckDb = clamp(1.5 + overlap * 3.5 * glue, 1, 5);
    beatLevelDb = clamp(vocal.rmsDb + chain.input + chain.output - beat.rmsDb - (3 + glue * 2), -24, -2);
  }

  const warmthWord = chain.warmth > 1.5 ? "warm" : chain.warmth < -1.5 ? "lean" : "balanced";
  const presenceWord = chain.presence > 1.5 ? "forward" : chain.presence < -1.5 ? "soft" : "centered";
  const airWord = chain.air > 1.5 ? "open" : chain.air < -1.5 ? "dark" : "smooth";
  const voiceProfile = `${warmthWord} · ${presenceWord} · ${airWord}`;
  const fusionLabel = beat ? `${pocketDb.toFixed(1)} dB pocket · ${duckDb.toFixed(1)} dB dynamic duck` : "Load beat for dynamic pocket";
  const masterLabel = `${chain.output.toFixed(1)} dB vocal output · reference-aware balance`;
  const confidence = clamp(0.45 + ref * 0.25 + (beat ? 0.15 : 0) + (reference.duration > 8 ? 0.1 : 0), 0, 0.95);

  return {
    chain,
    pocketDb,
    duckDb,
    beatLevelDb,
    voiceProfile,
    fusionLabel,
    masterLabel,
    confidence,
    dnaSummary:
      `Reference DNA: preserve JO₵YN identity; ${voiceProfile}; serial-style moderate compression; controlled harmonic density; ` +
      `duck ambience around phrases; beat pocket ${pocketDb.toFixed(1)} dB; vocal-driven duck ${duckDb.toFixed(1)} dB. ` +
      `Use the reference as a target, not a literal plugin-copy.`,
  };
}
