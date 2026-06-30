/**
 * Shared seed entry shape for all catalogue batches.
 */

export interface BatchSeedEntry {
  id: string;
  name: string;
  regionScene: string;
  coreDnaAngle: string;
  country?: string;
  region?: string;
  primaryGenres: string[];
  sceneMovement: string;
  signatureSoundSummary: string;
  artisticDna: string;
  technicalDna: string;
  rhythmicDna: string;
  melodicHarmonicDna: string;
  arrangementDna: string;
  typeBeatInspiredDirection: string;
  originalityTwist: string;
  researchConfidence: string;
}

export const capsuleDefaults = (): Pick<
  BatchSeedEntry,
  "technicalDna" | "researchConfidence"
> => ({
  technicalDna:
    "Verified tools require per-source research. Audible analysis suggests production identity pending full citation pass.",
  researchConfidence: "Mixed: historical facts need citation; audible analysis marked D-tier."
});
