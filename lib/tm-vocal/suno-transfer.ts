import type { Measurement } from "./audio";
import type { Chain } from "./chain";
import { sanitizeChain } from "./chain";
import { DEFAULT_STUDIO_GRADE, type StudioGradeSettings } from "./studio-grade";

export type SunoStemRole =
  | "reference_mix"
  | "processed_lead"
  | "raw_lead"
  | "backing_vocals"
  | "drums"
  | "bass"
  | "music"
  | "fx"
  | "instrumental"
  | "unknown";

export type SunoTransferAsset = {
  id: string;
  name: string;
  role: SunoStemRole;
  confidence: number;
  measurement: Measurement;
};

export type LearnedSunoDna = {
  schema: "tm-suno-dna/v1";
  name: string;
  createdAt: string;
  chain: Partial<Chain>;
  studioGrade: StudioGradeSettings;
  referenceAmount: number;
  polish: number;
  glue: number;
  space: number;
  confidence: number;
  dnaSummary: string;
  evidence: {
    rawLead: string;
    processedLead: string;
    referenceMix?: string | null;
    assets: Array<{ name: string; role: SunoStemRole; confidence: number }>;
  };
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function classifySunoStem(name: string): { role: SunoStemRole; confidence: number } {
  const n = name.toLowerCase().replace(/[._-]+/g, " ");
  const hit = (r: RegExp, role: SunoStemRole, confidence = 0.94) =>
    r.test(n) ? { role, confidence } : null;

  return (
    hit(/(reference|rough|full|master|mixdown|bounce|song mix)/, "reference_mix", 0.9) ||
    hit(/(processed|wet|suno).*(lead|vocal)|(lead|vocal).*(processed|wet|suno)/, "processed_lead", 0.94) ||
    hit(/(raw|dry).*(lead|vocal)|(lead|vocal).*(raw|dry)/, "raw_lead", 0.96) ||
    hit(/(backing|background|bgv|bvox|harmony|harmonies|adlib)/, "backing_vocals") ||
    hit(/(drum|percussion|kick|snare)/, "drums") ||
    hit(/(bass|808)/, "bass") ||
    hit(/(fx|effect|sfx|ambience|ambient)/, "fx") ||
    hit(/(instrumental|inst|music only|no vocal)/, "instrumental") ||
    hit(/(guitar|keys|piano|synth|strings|music|other)/, "music", 0.86) ||
    hit(/(lead vocal|vocals?)/, "processed_lead", 0.68) ||
    { role: "unknown", confidence: 0.25 }
  );
}

export function learnSunoDna(args: {
  raw: SunoTransferAsset;
  processed: SunoTransferAsset;
  referenceMix?: SunoTransferAsset | null;
  assets: SunoTransferAsset[];
  baseChain: Chain;
}): LearnedSunoDna {
  const { raw, processed, referenceMix, assets, baseChain } = args;
  const rb = raw.measurement.bands.map((v) => v - raw.measurement.spectrumRmsDb);
  const pb = processed.measurement.bands.map((v) => v - processed.measurement.spectrumRmsDb);
  const bandDelta = pb.map((v, i) => clamp(v - rb[i], -8, 8));

  const rawCrest = raw.measurement.peakDb - raw.measurement.rmsDb;
  const wetCrest = processed.measurement.peakDb - processed.measurement.rmsDb;
  const compressionDelta = clamp(rawCrest - wetCrest, -4, 10);
  const rmsLift = clamp(processed.measurement.rmsDb - raw.measurement.rmsDb, -6, 10);

  const chain = sanitizeChain({
    ...baseChain,
    warmth: clamp(baseChain.warmth + bandDelta[0] * 0.8, -6, 6),
    presence: clamp(baseChain.presence + bandDelta[1] * 0.85, -6, 6),
    air: clamp(baseChain.air + bandDelta[2] * 0.75, -5, 5),
    threshold: clamp(baseChain.threshold - Math.max(0, compressionDelta) * 0.8, -36, -14),
    ratio: clamp(baseChain.ratio + Math.max(0, compressionDelta) * 0.22, 1.8, 6),
    drive: clamp(baseChain.drive + Math.max(0, rmsLift) * 0.9, 3, 24),
    space: clamp(baseChain.space + Math.max(0, bandDelta[2]) * 1.1 + 4, 5, 34),
    echo: clamp(baseChain.echo + Math.max(0, bandDelta[2]) * 0.65 + 2, 0, 24),
    width: clamp(baseChain.width + Math.max(0, bandDelta[2]) * 0.8 + 4, 0, 24),
  });

  const hasBacking = assets.some((a) => a.role === "backing_vocals");
  const hasFx = assets.some((a) => a.role === "fx");
  const studioGrade: StudioGradeSettings = {
    ...DEFAULT_STUDIO_GRADE,
    deEss: clamp(58 + Math.max(0, pb[2] - rb[2]) * 4, 45, 82),
    multiband: clamp(54 + Math.max(0, compressionDelta) * 2.5, 45, 82),
    serialCompression: clamp(60 + Math.max(0, compressionDelta) * 3, 50, 86),
    fxDuck: hasFx ? 76 : 68,
    masterGlue: clamp(52 + Math.max(0, compressionDelta) * 2, 45, 76),
    masterMatch: referenceMix ? 84 : 72,
    pitchCorrection: 0,
    timingTightness: 0,
  };

  const evidenceCount = 2 + (referenceMix ? 1 : 0) + (hasBacking ? 1 : 0) + (hasFx ? 1 : 0);
  const confidence = clamp(0.52 + evidenceCount * 0.07 + Math.min(0.12, processed.measurement.duration / 300), 0, 0.94);
  const tone = chain.air > 1.5 ? "open top" : chain.air < -1.5 ? "dark top" : "smooth top";
  const body = chain.warmth > 1.5 ? "warm body" : chain.warmth < -1.5 ? "lean body" : "balanced body";

  return {
    schema: "tm-suno-dna/v1",
    name: "JO₵YN Suno DNA",
    createdAt: new Date().toISOString(),
    chain,
    studioGrade,
    referenceAmount: 86,
    polish: 82,
    glue: 76,
    space: 70,
    confidence,
    dnaSummary:
      `JO₵YN Suno DNA learned from the same voice before/after Suno processing: ${body}, ${tone}, ` +
      `crest reduction ${compressionDelta.toFixed(1)} dB, RMS shift ${rmsLift.toFixed(1)} dB. Preserve identity; ` +
      `use adaptive de-essing, multiband control, serial compression, phrase-ducked ambience and reference mastering.`,
    evidence: {
      rawLead: raw.name,
      processedLead: processed.name,
      referenceMix: referenceMix?.name ?? null,
      assets: assets.map((a) => ({ name: a.name, role: a.role, confidence: a.confidence })),
    },
  };
}
