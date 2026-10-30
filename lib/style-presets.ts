import {
  DEFAULT_STYLE_CONTROL,
  normalizeStyleControl,
  type StyleControlState,
  type UnexpectedStyleCategory
} from "@/lib/style-control";

export type StylePreset = {
  id: string;
  name: string;
  builtIn?: boolean;
  createdAt: string;
  state: StyleControlState;
};

export const STYLE_PRESETS_STORAGE_KEY = "jocyn:style-presets:v1";
const MAX_USER_PRESETS = 24;

const preset = (id: string, name: string, patch: Partial<StyleControlState>): StylePreset => ({
  id,
  name,
  builtIn: true,
  createdAt: new Date(0).toISOString(),
  state: normalizeStyleControl({ ...DEFAULT_STYLE_CONTROL, ...patch })
});

const lane = (enabled: boolean, value = "", intensity = 20) => ({ enabled, value, intensity });

export const BUILT_IN_STYLE_PRESETS: StylePreset[] = [
  preset("builtin-club-pressure", "Club pressure", {
    includeTags: ["punchy kick", "sub-forward low end", "dry drums", "chant hooks"],
    excludeTags: ["muddy mix", "soft transients", "ballad pacing"],
    styleInfluence: 84,
    vocalInfluence: 60,
    weirdness: 18,
    variety: 40,
    randomization: 25,
    soundTextures: ["dry", "gritty", "wide"],
    genreArchetypes: ["Afro-club rap", "jersey club"],
    styleWeights: [{ label: "Club energy", weight: 75 }, { label: "Rap cadence", weight: 25 }]
  }),
  preset("builtin-late-night-rnb", "Late-night R&B", {
    includeTags: ["lush chords", "intimate vocal", "soft 808", "space"],
    excludeTags: ["harsh highs", "overcompressed", "EDM drops"],
    styleInfluence: 70,
    vocalInfluence: 88,
    weirdness: 15,
    variety: 35,
    randomization: 20,
    soundTextures: ["warm", "airy", "intimate", "analog"],
    genreArchetypes: ["R&B", "alternative R&B"],
    styleWeights: [{ label: "Vocal intimacy", weight: 60 }, { label: "Chord color", weight: 40 }]
  }),
  preset("builtin-left-field", "Left-field experiment", {
    includeTags: ["unusual textures", "broken rhythm", "found sound"],
    excludeTags: ["generic AI sound", "predictable drops"],
    styleInfluence: 62,
    vocalInfluence: 55,
    weirdness: 78,
    variety: 80,
    randomization: 70,
    seedMode: "fresh",
    soundTextures: ["distorted", "lo-fi", "dark"],
    genreArchetypes: ["electronic", "cinematic hip-hop"],
    unexpected: {
      rhythm: lane(true, "broken-beat pocket", 55),
      instrumentation: lane(true, "detuned music box", 40),
      harmony: lane(false),
      production: lane(true, "tape-stop transitions", 35),
      vocalTreatment: lane(false)
    }
  })
];

const makeId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function loadUserStylePresets(): StylePreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(STYLE_PRESETS_STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item): item is StylePreset => Boolean(item && typeof item === "object" && typeof item.id === "string" && typeof item.name === "string"))
      .slice(0, MAX_USER_PRESETS)
      .map((item) => ({
        id: item.id,
        name: String(item.name).slice(0, 60),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
        state: normalizeStyleControl(item.state)
      }));
  } catch {
    return [];
  }
}

function writeUserPresets(presets: StylePreset[]): StylePreset[] {
  const next = presets.slice(0, MAX_USER_PRESETS);
  if (typeof window !== "undefined") window.localStorage.setItem(STYLE_PRESETS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function saveUserStylePreset(name: string, state: StyleControlState): StylePreset[] {
  const cleanName = name.trim().slice(0, 60) || "Untitled preset";
  const existing = loadUserStylePresets();
  const match = existing.find((item) => item.name.toLowerCase() === cleanName.toLowerCase());
  const entry: StylePreset = {
    id: match?.id ?? makeId(),
    name: cleanName,
    createdAt: new Date().toISOString(),
    state: normalizeStyleControl(state)
  };
  return writeUserPresets([entry, ...existing.filter((item) => item.id !== entry.id)]);
}

export function deleteUserStylePreset(id: string): StylePreset[] {
  return writeUserPresets(loadUserStylePresets().filter((item) => item.id !== id));
}

/**
 * Applies a preset while keeping the currently attached reference audio,
 * because the reference file itself lives in IndexedDB and is not part of presets.
 */
export function applyStylePreset(current: StyleControlState, presetState: StyleControlState): StyleControlState {
  return normalizeStyleControl({ ...presetState, referenceAudio: current.referenceAudio, updatedAt: current.updatedAt });
}

const level = (value: number): string =>
  value >= 80 ? "very strong" : value >= 60 ? "strong" : value >= 40 ? "moderate" : value >= 20 ? "light" : "minimal";

const unexpectedNames: Record<UnexpectedStyleCategory, string> = {
  rhythm: "rhythm",
  instrumentation: "instrumentation",
  harmony: "harmony",
  production: "production",
  vocalTreatment: "vocal treatment"
};

/** Plain-language brief of the configured direction. Describes settings only — never audio facts. */
export function describeStyleControl(state: StyleControlState): string[] {
  const lines: string[] = [];
  const core = [...state.genreArchetypes, ...state.includeTags].slice(0, 6);
  lines.push(core.length ? `Aim for ${core.join(", ")}.` : "No genre or include tags yet — the planner has wide latitude.");
  if (state.excludeTags.length) lines.push(`Steer away from ${state.excludeTags.slice(0, 5).join(", ")}.`);
  if (state.soundTextures.length) lines.push(`Texture palette: ${state.soundTextures.join(", ")}.`);
  lines.push(`Style steering is ${level(state.styleInfluence)}; vocal identity steering is ${level(state.vocalInfluence)}.`);

  const exploration = Math.round((state.weirdness + state.variety + state.randomization) / 3);
  const seed = state.seedMode === "locked" ? `locked to seed ${state.seed ?? 1} for repeatable runs` : state.seedMode === "fresh" ? "fresh every run" : "guided";
  lines.push(`Exploration is ${level(exploration)} (weirdness ${state.weirdness}%, variety ${state.variety}%, randomization ${state.randomization}%); seed is ${seed}.`);

  const weights = state.styleWeights.filter((item) => item.weight > 0);
  if (weights.length) {
    const total = weights.reduce((sum, item) => sum + item.weight, 0) || 1;
    lines.push(`Blend: ${weights.map((item) => `${item.label} ${Math.round((item.weight / total) * 100)}%`).join(" · ")}.`);
  }

  const lanes = (Object.keys(state.unexpected) as UnexpectedStyleCategory[])
    .filter((key) => state.unexpected[key].enabled && state.unexpected[key].value.trim())
    .map((key) => `${unexpectedNames[key]} → “${state.unexpected[key].value.trim()}” (${state.unexpected[key].intensity}%)`);
  if (lanes.length) lines.push(`Surprise lanes: ${lanes.join("; ")}.`);

  if (state.referenceAudio) {
    const measured = state.referenceAudio.analysis
      ? ` Measured in browser: ${state.referenceAudio.analysis.bpm ?? "BPM unavailable"}${state.referenceAudio.analysis.bpm ? " BPM" : ""}, ${state.referenceAudio.analysis.key ?? "key unavailable"}.`
      : " No browser measurement is available for it.";
    lines.push(`Reference “${state.referenceAudio.name}” anchors ${state.referenceAudio.role} at ${state.referenceAudio.weight}% weight.${measured}`);
  }
  return lines;
}

export type StyleDiffRow = { label: string; a: string; b: string };

const listText = (values: string[]): string => values.length ? values.join(", ") : "—";

/** Field-by-field differences between two Style Control states. */
export function diffStyleControl(a: StyleControlState, b: StyleControlState): StyleDiffRow[] {
  const rows: StyleDiffRow[] = [];
  const push = (label: string, left: string, right: string): void => {
    if (left !== right) rows.push({ label, a: left, b: right });
  };
  push("Include", listText(a.includeTags), listText(b.includeTags));
  push("Exclude", listText(a.excludeTags), listText(b.excludeTags));
  push("Genres", listText(a.genreArchetypes), listText(b.genreArchetypes));
  push("Textures", listText(a.soundTextures), listText(b.soundTextures));
  push("Style influence", `${a.styleInfluence}%`, `${b.styleInfluence}%`);
  push("Vocal influence", `${a.vocalInfluence}%`, `${b.vocalInfluence}%`);
  push("Weirdness", `${a.weirdness}%`, `${b.weirdness}%`);
  push("Variety", `${a.variety}%`, `${b.variety}%`);
  push("Randomization", `${a.randomization}%`, `${b.randomization}%`);
  push("Seed", a.seedMode === "locked" ? `locked ${a.seed ?? 1}` : a.seedMode, b.seedMode === "locked" ? `locked ${b.seed ?? 1}` : b.seedMode);
  push("Vocal gender", a.vocalGender, b.vocalGender);
  push("Blend", a.styleWeights.map((item) => `${item.label} ${item.weight}%`).join(", ") || "—", b.styleWeights.map((item) => `${item.label} ${item.weight}%`).join(", ") || "—");
  (Object.keys(a.unexpected) as UnexpectedStyleCategory[]).forEach((key) => {
    const fmt = (state: StyleControlState): string => state.unexpected[key].enabled ? `${state.unexpected[key].value || "(empty)"} · ${state.unexpected[key].intensity}%` : "off";
    push(`Surprise: ${unexpectedNames[key]}`, fmt(a), fmt(b));
  });
  return rows;
}

/** Stable comparison that ignores timestamps. */
export function sameStyleControl(a: StyleControlState, b: StyleControlState): boolean {
  const strip = (state: StyleControlState) => JSON.stringify({ ...state, updatedAt: "" });
  return strip(a) === strip(b);
}
