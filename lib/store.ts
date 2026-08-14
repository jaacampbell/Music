import crypto from "node:crypto";

import type {
  ExportArtifact,
  GenerationVersion,
  Job,
  JobType,
  LiveAudioAnalysis,
  Project,
  ProjectHistoryEntry,
  ProjectHistoryType,
  Scorecard,
  SourceAudioAttachment,
  StemAsset
} from "@/lib/types";

const DEFAULT_STEMS = ["vocals", "drums", "bass", "other"];

const now = (): string => new Date().toISOString();
const id = (): string => crypto.randomUUID();

const historyEntry = (
  type: ProjectHistoryType,
  message: string,
  details?: Record<string, unknown>
): ProjectHistoryEntry => ({
  id: id(),
  type,
  message,
  createdAt: now(),
  details
});

const appendHistory = (
  project: Project,
  type: ProjectHistoryType,
  message: string,
  details?: Record<string, unknown>
): ProjectHistoryEntry[] => [
  ...(project.history ?? []),
  historyEntry(type, message, details)
].slice(-200);

const keyFromMood = (brief: string): string => {
  const lowered = brief.toLowerCase();
  if (lowered.includes("minor") || lowered.includes("dark")) return "D minor";
  if (lowered.includes("major") || lowered.includes("happy")) return "C major";
  return "A minor";
};

const bpmFromBrief = (brief: string): number => {
  const match = brief.match(/\b(\d{2,3})\s*bpm\b/i);
  return match ? Number(match[1]) : 98;
};

const stemNamesForMode = (mode: number): string[] => {
  if (mode === 2) return ["vocals", "instrumental"];
  if (mode === 6) return ["vocals", "drums", "bass", "guitar", "keys", "other"];
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

const normalizeProject = (project: Project): Project => ({
  ...project,
  history: project.history ?? [],
  promptTelemetry: project.promptTelemetry ?? [],
  strategyMap: project.strategyMap ?? [],
  promptPack: project.promptPack ?? [],
  generations: project.generations ?? [],
  stems: project.stems ?? [],
  scorecards: project.scorecards ?? []
});

const buildStems = (projectId: string, mode: number): StemAsset[] =>
  stemNamesForMode(mode).map((stemName, idx) => ({
    id: id(),
    name: stemName,
    file: `${projectId}/${stemName}.wav`,
    startTime: 0,
    durationSec: 185,
    sampleRate: 44100,
    channels: 2,
    lufs: -16.5 + idx * 0.6,
    confidence: Math.max(0.62, 0.95 - idx * 0.03),
    midiFile:
      stemName.includes("bass") || stemName.includes("keys") || stemName.includes("vocals")
        ? `${projectId}/${stemName}.mid`
        : undefined
  }));

const buildStrategies = (brief: string): string[] => [
  "GPS Noir",
  "Night Ride Bounce",
  "Hotel Hallway Tension",
  "Luxury Toxic R&B Trap",
  `Reference-safe profile from: ${brief.slice(0, 52)}`
];

const buildPromptPack = (brief: string, bpm: number, key: string): string[] => [
  `Direction A: ${bpm} BPM in ${key}. ${brief}. Prioritize vocal pocket and minimal clutter.`,
  "Direction B: same harmony, denser hats, call/response motif, preserve open hook section.",
  "Direction C: strip arrangement for feature pocket, improve transition impacts."
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
  [...state.projects.values()]
    .map(normalizeProject)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const getProject = (projectId: string): Project | undefined => {
  const project = state.projects.get(projectId);
  return project ? normalizeProject(project) : undefined;
};

export const importProjects = (projects: Project[]): number => {
  for (const project of projects) {
    if (!project?.id || !project?.title) continue;
    const incoming = normalizeProject(project);
    const current = state.projects.get(incoming.id);
    if (!current || incoming.updatedAt >= current.updatedAt) {
      state.projects.set(incoming.id, incoming);
    }
  }
  return projects.length;
};

export const createProject = (title: string, brief: string): Project => {
  const projectId = id();
  const createdAt = now();
  const bpm = bpmFromBrief(brief);
  const key = keyFromMood(brief);
  const project: Project = {
    id: projectId,
    title,
    brief,
    createdAt,
    updatedAt: createdAt,
    status: "draft",
    songDna: {
      bpm,
      key,
      mood: ["dark", "mobile", "expensive"],
      structure: ["intro", "verse", "hook", "verse", "hook", "outro"],
      vocalSpace: "balanced",
      palette: ["808", "soft rimshot", "muted guitar", "reverse synth"],
      notes: "Brief-derived starting point. Attach audio to replace BPM/key with measured analysis."
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
    promptTelemetry: [],
    history: [historyEntry("project-created", `Project created: ${title}`)]
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
    ...normalizeProject(current),
    ...updates,
    updatedAt: now(),
    history: appendHistory(current, "state-saved", "Project notes and state saved.", {
      updatedFields: Object.keys(updates)
    })
  };
  state.projects.set(projectId, updated);
  const job = buildJob(projectId, "save-state", "Saving project state");
  completeJob(job, { updatedFields: Object.keys(updates) });
  return updated;
};

export interface LiveAudioResultInput {
  source: SourceAudioAttachment;
  analysis: LiveAudioAnalysis;
  stems: Array<{
    name: string;
    label?: string;
    family?: string;
    file?: string;
    url?: string;
    integratedDb?: number;
    engine?: string;
  }>;
  mode: "core" | "deep";
  model: string;
  zipUrl?: string;
}

export const applyLiveAudioResult = (
  projectId: string,
  payload: LiveAudioResultInput
): Project | undefined => {
  const current = state.projects.get(projectId);
  if (!current) return undefined;

  const stems: StemAsset[] = payload.stems.map((stem) => ({
    id: id(),
    name: stem.label ?? stem.name,
    file: stem.file ?? stem.url ?? stem.name,
    startTime: 0,
    durationSec: payload.analysis.durationSec,
    sampleRate: payload.analysis.sampleRate,
    channels: payload.analysis.channels,
    lufs: stem.integratedDb ?? -120,
    confidence: payload.mode === "core" ? 0.95 : 0.8,
    family: stem.family,
    engine: stem.engine ?? payload.model,
    downloadUrl: stem.url
  }));

  const bpm = payload.analysis.bpm ?? current.songDna.bpm;
  const key = payload.analysis.key ?? current.songDna.key;
  const updated: Project = {
    ...normalizeProject(current),
    updatedAt: now(),
    status: "in-progress",
    sourceAudio: payload.source,
    liveAnalysis: payload.analysis,
    stems,
    songDna: {
      ...current.songDna,
      bpm,
      key,
      notes: `Measured audio analysis attached. BPM confidence ${(payload.analysis.bpmConfidence * 100).toFixed(0)}%; key confidence ${(payload.analysis.keyConfidence * 100).toFixed(0)}%.`
    },
    manifest: {
      ...current.manifest,
      sourceFile: payload.source.name,
      bpm,
      key,
      sampleRate: payload.analysis.sampleRate,
      durationSeconds: payload.analysis.durationSec,
      stems,
      tempoMap: bpm ? [{ bar: 1, bpm }] : current.manifest.tempoMap
    },
    history: [
      ...appendHistory(
        current,
        "audio-analyzed",
        `Measured ${payload.analysis.bpm ?? "unknown"} BPM · ${payload.analysis.key ?? "unknown key"}.`,
        {
          bpmConfidence: payload.analysis.bpmConfidence,
          keyConfidence: payload.analysis.keyConfidence,
          engine: payload.analysis.engine
        }
      ),
      historyEntry(
        payload.mode === "deep" ? "deep-separated" : "core-separated",
        `${payload.mode === "deep" ? "Deep" : "Core"} separation saved to project.`,
        { stemCount: stems.length, model: payload.model, zipUrl: payload.zipUrl }
      )
    ].slice(-200)
  };

  state.projects.set(projectId, updated);
  return updated;
};

export const runExtraction = (projectId: string, mode: number): Job | undefined => {
  const project = state.projects.get(projectId);
  if (!project) return undefined;
  const job = buildJob(projectId, "extract", `Modeling ${mode}-stem package`);
  const stems = buildStems(projectId, mode);
  const updated: Project = {
    ...normalizeProject(project),
    status: "in-progress",
    stems,
    updatedAt: now(),
    manifest: { ...project.manifest, stems },
    history: appendHistory(project, "agent-loop", `Modeled a ${mode}-stem planning package.`)
  };
  state.projects.set(projectId, updated);
  return completeJob(job, { stemsCreated: stems.length, mode, simulated: true });
};

export const runAnalysis = (projectId: string): Job | undefined => {
  const project = state.projects.get(projectId);
  if (!project) return undefined;
  const job = buildJob(projectId, "analyze", "Refreshing planning analysis");
  const updated: Project = {
    ...normalizeProject(project),
    songDna: {
      ...project.songDna,
      bpm: project.songDna.bpm ?? 98,
      key: project.songDna.key ?? "A minor",
      notes: `${project.songDna.notes} Planning analysis refreshed ${new Date().toLocaleString()}.`
    },
    updatedAt: now()
  };
  state.projects.set(projectId, updated);
  return completeJob(job, {
    bpm: updated.songDna.bpm,
    key: updated.songDna.key,
    stemCount: updated.stems.length,
    simulated: true
  });
};

export const runExport = (
  projectId: string,
  type: ExportArtifact["type"]
): Job | undefined => {
  const project = state.projects.get(projectId);
  if (!project) return undefined;
  const job = buildJob(projectId, "export", `Building ${type} export plan`);
  const artifact: ExportArtifact = {
    id: id(),
    type,
    status: "ready",
    files: [
      `${projectId}/manifest.json`,
      ...project.stems.map((stem) => stem.file),
      `${projectId}/README-import.txt`
    ],
    notes: "Planning artifact. Real downloadable audio is produced by the separator worker.",
    createdAt: now()
  };
  const updated: Project = {
    ...normalizeProject(project),
    status: "ready-for-export",
    updatedAt: now(),
    exportPlan: "Organized WAV ZIP + DAW handoff notes. Use the live separator ZIP for real audio files.",
    manifest: {
      ...project.manifest,
      exports: [...project.manifest.exports, artifact]
    },
    history: appendHistory(project, "export", `Created ${type} export plan.`, { type })
  };
  state.projects.set(projectId, updated);
  return completeJob(job, { exportId: artifact.id, type, planningOnly: true });
};

export const runAgentLoop = (
  projectId: string,
  command: string,
  promptTelemetry?: Project["promptTelemetry"][number]
): Job | undefined => {
  const project = state.projects.get(projectId);
  if (!project) return undefined;
  const job = buildJob(projectId, "agent-loop", "Running producer + A&R + engineer planning loop");

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
    command || "Tighten low-end masking and preserve space for the lead vocal.";

  const updated: Project = {
    ...normalizeProject(project),
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
      : project.promptTelemetry,
    history: appendHistory(project, "agent-loop", "Producer/A&R planning loop completed.", {
      command,
      strategies: strategyMap.length,
      modeledGenerations: generations.length
    })
  };
  state.projects.set(projectId, updated);
  return completeJob(job, {
    strategies: strategyMap.length,
    generations: generations.length,
    scorecards: scorecards.length
  });
};

export const getJob = (jobId: string): Job | undefined => state.jobs.get(jobId);
