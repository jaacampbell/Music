import crypto from "node:crypto";

import { canonicalSource, detectBpmKey, verifyAlignment } from "./analysis";
import { simulatedHtdemucsFt, type Separator } from "./separator";
import {
  STEM_NAMES,
  type ExportTarget,
  type StemExport,
  type StemManifest,
  type StemProject,
  type StemTrack
} from "./types";

const now = (): string => new Date().toISOString();
const id = (): string => crypto.randomUUID();

interface StemStoreState {
  projects: Map<string, StemProject>;
}

const globalStore = globalThis as typeof globalThis & {
  __stemExtractionStore?: StemStoreState;
};

const state: StemStoreState =
  globalStore.__stemExtractionStore ?? { projects: new Map<string, StemProject>() };
globalStore.__stemExtractionStore = state;

const separator: Separator = simulatedHtdemucsFt;

export const listStemProjects = (): StemProject[] =>
  [...state.projects.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const getStemProject = (projectId: string): StemProject | undefined =>
  state.projects.get(projectId);

// Step 1 + 2: "upload" + canonical decode. We accept a filename + duration rather
// than a binary in this simulated slice.
export const createStemProject = (
  filename: string,
  durationSec: number
): StemProject => {
  const projectId = id();
  const source = canonicalSource(filename, durationSec);
  const project: StemProject = {
    id: projectId,
    createdAt: now(),
    updatedAt: now(),
    status: "created",
    manifest: {
      projectId,
      source,
      analysis: null,
      separation: {
        model: separator.id,
        stemMode: 4,
        warnings: [],
        alignment: null
      },
      stems: []
    },
    exports: []
  };
  state.projects.set(projectId, project);
  return project;
};

// Steps 3-7: 4-stem separation, alignment verification, BPM/key analysis, manifest.
export const runSeparation = (projectId: string): StemProject | undefined => {
  const project = state.projects.get(projectId);
  if (!project) return undefined;

  const { source } = project.manifest;
  const output = separator.separate({
    sha256: source.sha256,
    durationSec: source.durationSec
  });
  const alignment = verifyAlignment(source);
  const analysis = detectBpmKey(source);

  const stems: StemTrack[] = output.stems.map((stem, index) => ({
    name: stem.name,
    index: index + 1,
    file: `stems/${String(index + 1).padStart(2, "0")}_${stem.name}.wav`,
    url: `/api/stem-extraction/projects/${projectId}/stems/${stem.name}.wav`,
    durationSec: source.durationSec,
    sampleRate: source.sampleRate,
    channels: source.channels,
    bitDepth: source.bitDepth,
    integratedLufs: stem.integratedLufs,
    confidence: stem.confidence
  }));

  const updated: StemProject = {
    ...project,
    status: "separated",
    updatedAt: now(),
    manifest: {
      ...project.manifest,
      analysis,
      separation: {
        model: output.model,
        stemMode: output.stemMode,
        warnings: output.warnings,
        alignment
      },
      stems
    }
  };
  state.projects.set(projectId, updated);
  return updated;
};

const exportFiles = (project: StemProject, target: ExportTarget): string[] => {
  if (target === "universal_stem_pack_zip") {
    return [
      "manifest.json",
      "README.txt",
      ...project.manifest.stems.map((stem) => stem.file),
      "reference/source.wav"
    ];
  }
  if (target === "karaoke_wav") return ["mixdowns/karaoke.wav"];
  return ["mixdowns/acapella.wav"];
};

const exportNotes = (target: ExportTarget): string => {
  if (target === "universal_stem_pack_zip") {
    return "Aligned 24-bit WAV stems + manifest + source reference. Imports cleanly into any DAW.";
  }
  if (target === "karaoke_wav") {
    return "Karaoke = sum of all stems except vocals (re-mixed from existing stems; no re-separation).";
  }
  return "Acapella = vocals stem only (re-mixed from existing stems; no re-separation).";
};

// Step 8 + 10: build an export package or a karaoke/acapella mixdown. Mixdowns
// re-mix from existing stems (no separation re-run).
export const buildExport = (
  projectId: string,
  target: ExportTarget
): { project: StemProject; export: StemExport } | undefined => {
  const project = state.projects.get(projectId);
  if (!project) return undefined;
  if (project.manifest.stems.length !== STEM_NAMES.length) return undefined;

  const artifact: StemExport = {
    id: id(),
    target,
    files: exportFiles(project, target),
    notes: exportNotes(target),
    createdAt: now()
  };
  const updated: StemProject = {
    ...project,
    status: "exported",
    updatedAt: now(),
    exports: [...project.exports, artifact]
  };
  state.projects.set(projectId, updated);
  return { project: updated, export: artifact };
};

export const stemManifest = (projectId: string): StemManifest | undefined =>
  state.projects.get(projectId)?.manifest;
