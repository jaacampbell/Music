import crypto from "node:crypto";

import type {
  ExportArtifact,
  GenerationVersion,
  Job,
  JobType,
  Project,
  Scorecard,
  StemAsset
} from "@/lib/types";

const DEFAULT_STEMS = ["vocals", "drums", "bass", "other"];

const now = (): string => new Date().toISOString();
const id = (): string => crypto.randomUUID();

const keyFromMood = (brief: string): string => {
  const lowered = brief.toLowerCase();
  if (lowered.includes("minor") || lowered.includes("dark")) {
    return "D minor";
  }
  if (lowered.includes("major") || lowered.includes("happy")) {
    return "C major";
  }
  return "A minor";
};

const bpmFromBrief = (brief: string): number => {
  const match = brief.match(/\b(\d{2,3})\s*bpm\b/i);
  if (match) {
    return Number(match[1]);
  }
  return 98;
};

const stemNamesForMode = (mode: number): string[] => {
  if (mode === 2) {
    return ["vocals", "instrumental"];
  }
  if (mode === 6) {
    return ["vocals", "drums", "bass", "guitar", "keys", "other"];
  }
  if (mode === 10) {
    return [
      "lead_vocals",
      "background_vocals",
      "kick",
      "snare",
      "hi_hat",
      "cymbals",
      "percussion",
      "bass",
      "guitar",
      "keys_other"
    ];
  }
  return DEFAULT_STEMS;
};

interface StoreState {
  projects: Map<string, Project>;
  jobs: Map<string, Job>;
}

const createInitialState = (): StoreState => ({
  projects: new Map<string, Project>(),
  jobs: new Map<string, Job>()
});

const globalStore = globalThis as typeof globalThis & {
  __beatLabStore?: StoreState;
};

const state: StoreState = globalStore.__beatLabStore ?? createInitialState();
globalStore.__beatLabStore = state;

const buildStems = (projectId: string, mode: number): StemAsset[] => {
  const names = stemNamesForMode(mode);
  return names.map((stemName, idx) => ({
    id: id(),
    name: stemName,
    file: `${projectId}/${stemName}.wav`,
    startTime: 0,
    durationSec: 185.0,
    sampleRate: 44100,
    channels: 2,
    lufs: -16.5 + idx * 0.6,
    confidence: Math.max(0.62, 0.95 - idx * 0.03),
    midiFile:
      stemName.includes("bass") || stemName.includes("keys") || stemName.includes("vocals")
        ? `${projectId}/${stemName}.mid`
        : undefined
  }));
};

const buildStrategies = (brief: string): string[] => [
  "GPS Noir",
  "Night Ride Bounce",
  "Hotel Hallway Tension",
  "Luxury Toxic R&B Trap",
  `Reference-safe profile from: ${brief.slice(0, 52)}`
];

const buildPromptPack = (brief: string, bpm: number, key: string): string[] => [
  `Direction A: ${bpm} BPM in ${key}. ${brief}. Prioritize vocal pocket and minimal clutter.`,
  `Direction B: same harmony, denser hats, call/response motif, preserve open hook section.`,
  `Direction C: strip arrangement for female feature pocket, improve transition impacts.`
];

const buildGenerations = (strategies: string[], bpm: number, key: string): GenerationVersion[] =>
  strategies.slice(0, 4).map((strategy, idx) => ({
    id: id(),
    name: `Version ${idx + 1}`,
    strategy,
    prompt: `${strategy} @ ${bpm} BPM ${key}`,
    bpm,
    key,
    score: 74 + (idx % 3) * 6,
    strengths: [
      idx === 0 ? "atmosphere" : "groove",
      idx === 1 ? "drum bounce" : "melodic framing"
    ],
    weaknesses: [idx === 2 ? "vocal space too dense" : "bridge transition depth"],
    selected: idx === 0
  }));

const buildScorecards = (generations: GenerationVersion[]): Scorecard[] =>
  generations.map((generation, idx) => ({
    id: id(),
    generationId: generation.id,
    emotionalAlignment: Math.min(10, 7 + (idx % 3)),
    vocalSpace: Math.min(10, 6 + ((idx + 1) % 3)),
    lowEndControl: Math.min(10, 7 + (idx % 2)),
    originality: Math.min(10, 7 + (idx % 3)),
    replayValue: Math.min(10, 7 + ((idx + 2) % 3)),
    releaseReadiness: Math.min(10, 6 + (idx % 4)),
    summary: `${generation.name} excels in ${generation.strengths.join(", ")}.`
  }));

const buildJob = (projectId: string, type: JobType, message: string): Job => {
  const job: Job = {
    id: id(),
    projectId,
    type,
    status: "running",
    progress: 10,
    message,
    createdAt: now(),
    updatedAt: now()
  };
  state.jobs.set(job.id, job);
  return job;
};

const completeJob = (job: Job, result: Record<string, unknown>): Job => {
  const updated: Job = {
    ...job,
    status: "completed",
    progress: 100,
    result,
    updatedAt: now()
  };
  state.jobs.set(job.id, updated);
  return updated;
};

export const listProjects = (): Project[] =>
  [...state.projects.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const getProject = (projectId: string): Project | undefined => state.projects.get(projectId);

export const createProject = (title: string, brief: string): Project => {
  const projectId = id();
  const bpm = bpmFromBrief(brief);
  const key = keyFromMood(brief);
  const project: Project = {
    id: projectId,
    title,
    brief,
    createdAt: now(),
    updatedAt: now(),
    status: "draft",
    songDna: {
      bpm,
      key,
      mood: ["dark", "mobile", "expensive"],
      structure: ["intro", "verse", "hook", "verse", "hook", "outro"],
      vocalSpace: "balanced",
      palette: ["808", "soft rimshot", "muted guitar", "reverse synth"],
      notes: "Reference-safe translation enabled."
    },
    strategyMap: [],
    promptPack: [],
    generations: [],
    stems: [],
    scorecards: [],
    mixNotes: "",
    revisionPrompt: "",
    exportPlan: "",
    manifest: {
      projectId,
      title,
      bpm,
      key,
      sampleRate: 44100,
      bitDepth: 24,
      durationSeconds: 185,
      stems: [],
      tempoMap: [{ bar: 1, bpm }],
      markers: [
        { bar: 1, label: "intro" },
        { bar: 17, label: "verse" },
        { bar: 33, label: "hook" }
      ],
      chords: [
        { bar: 1, chord: "Dm" },
        { bar: 5, chord: "Bb" },
        { bar: 9, chord: "F" },
        { bar: 13, chord: "C" }
      ],
      exports: []
    },
    promptTelemetry: []
  };
  state.projects.set(projectId, project);
  return project;
};

export const saveProjectState = (
  projectId: string,
  updates: Partial<Pick<Project, "mixNotes" | "revisionPrompt" | "exportPlan" | "brief">>
): Project | undefined => {
  const current = state.projects.get(projectId);
  if (!current) return undefined;
  const updated: Project = {
    ...current,
    ...updates,
    updatedAt: now()
  };
  state.projects.set(projectId, updated);
  const job = buildJob(projectId, "save-state", "Saving project state");
  completeJob(job, { updatedFields: Object.keys(updates) });
  return updated;
};

export const runExtraction = (projectId: string, mode: number): Job | undefined => {
  const project = state.projects.get(projectId);
  if (!project) return undefined;
  const job = buildJob(projectId, "extract", `Extracting ${mode}-stem package`);
  const stems = buildStems(projectId, mode);
  const updated: Project = {
    ...project,
    status: "in-progress",
    stems,
    updatedAt: now(),
    manifest: {
      ...project.manifest,
      stems
    }
  };
  state.projects.set(projectId, updated);
  return completeJob(job, { stemsCreated: stems.length, mode });
};

export const runAnalysis = (projectId: string): Job | undefined => {
  const project = state.projects.get(projectId);
  if (!project) return undefined;
  const job = buildJob(projectId, "analyze", "Running BPM/key/loudness analysis");
  const updated: Project = {
    ...project,
    songDna: {
      ...project.songDna,
      bpm: project.songDna.bpm ?? 98,
      key: project.songDna.key ?? "A minor",
      notes: `${project.songDna.notes} Analysis refreshed ${new Date().toLocaleString()}.`
    },
    updatedAt: now()
  };
  state.projects.set(projectId, updated);
  return completeJob(job, {
    bpm: updated.songDna.bpm,
    key: updated.songDna.key,
    stemCount: updated.stems.length
  });
};

export const runExport = (
  projectId: string,
  type: ExportArtifact["type"]
): Job | undefined => {
  const project = state.projects.get(projectId);
  if (!project) return undefined;
  const job = buildJob(projectId, "export", `Building ${type} export`);
  const artifact: ExportArtifact = {
    id: id(),
    type,
    status: "ready",
    files: [
      `${projectId}/manifest.json`,
      ...project.stems.map((stem) => stem.file),
      `${projectId}/README-import.txt`
    ],
    notes: "Aligned stems start at 0.0s and share sample rate/bit depth.",
    createdAt: now()
  };
  const updated: Project = {
    ...project,
    status: "ready-for-export",
    updatedAt: now(),
    exportPlan:
      "Universal WAV ZIP + DAW sidecars with tempo/key metadata. Reaper session enabled.",
    manifest: {
      ...project.manifest,
      exports: [...project.manifest.exports, artifact]
    }
  };
  state.projects.set(projectId, updated);
  return completeJob(job, { exportId: artifact.id, type });
};

export const runAgentLoop = (
  projectId: string,
  command: string,
  promptTelemetry?: Project["promptTelemetry"][number]
): Job | undefined => {
  const project = state.projects.get(projectId);
  if (!project) return undefined;
  const job = buildJob(projectId, "agent-loop", "Running producer + A&R + engineer loop");

  const bpm = project.songDna.bpm ?? bpmFromBrief(project.brief);
  const key = project.songDna.key ?? keyFromMood(project.brief);
  const strategyMap = buildStrategies(project.brief);
  const promptPack = buildPromptPack(project.brief, bpm, key);
  const generations = buildGenerations(strategyMap, bpm, key);
  const scorecards = buildScorecards(generations);
  const selected = generations
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((version) => version.name)
    .join(" + ");

  const revisionPrompt =
    command ||
    "Tighten low-end masking by sidechaining 808 to kick and open 2k-4k band for lead vocal.";

  const updated: Project = {
    ...project,
    status: "in-progress",
    updatedAt: now(),
    strategyMap,
    promptPack,
    generations,
    scorecards,
    revisionPrompt,
    mixNotes: `Selected blend: ${selected}. Preserve emotional tone while reducing section clutter.`,
    promptTelemetry: promptTelemetry
      ? [...project.promptTelemetry, promptTelemetry]
      : project.promptTelemetry
  };
  state.projects.set(projectId, updated);
  return completeJob(job, {
    strategies: strategyMap.length,
    generations: generations.length,
    scorecards: scorecards.length
  });
};

export const getJob = (jobId: string): Job | undefined => state.jobs.get(jobId);
