import type { LiveAudioAnalysis } from "@/lib/types";

export type UnexpectedStyleCategory =
  | "rhythm"
  | "instrumentation"
  | "harmony"
  | "production"
  | "vocalTreatment";

export type UnexpectedStyleInjection = {
  enabled: boolean;
  value: string;
  intensity: number;
};

export type StyleControlState = {
  version: 1;
  includeTags: string[];
  excludeTags: string[];
  vocalInfluence: number;
  styleInfluence: number;
  weirdness: number;
  variety: number;
  randomization: number;
  seedMode: "locked" | "fresh" | "guided";
  seed: number | null;
  vocalGender: "unspecified" | "male" | "female" | "androgynous" | "mixed";
  soundTextures: string[];
  genreArchetypes: string[];
  styleWeights: Array<{ label: string; weight: number }>;
  unexpected: Record<UnexpectedStyleCategory, UnexpectedStyleInjection>;
  referenceAudio: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
    weight: number;
    role: "style" | "vocal" | "production" | "rhythm" | "overall";
    analysis?: LiveAudioAnalysis;
  } | null;
  updatedAt: string;
};

export const STYLE_CONTROL_STORAGE_KEY = "jocyn:style-control:v1";
const REFERENCE_DB = "jocyn-style-control";
const REFERENCE_STORE = "reference-audio";
const REFERENCE_KEY = "active";

export const DEFAULT_STYLE_CONTROL: StyleControlState = {
  version: 1,
  includeTags: ["cinematic", "premium", "clean low end"],
  excludeTags: ["generic AI sound", "muddy mix", "overproduced"],
  vocalInfluence: 72,
  styleInfluence: 78,
  weirdness: 22,
  variety: 48,
  randomization: 35,
  seedMode: "guided",
  seed: null,
  vocalGender: "male",
  soundTextures: ["warm", "dry", "wide"],
  genreArchetypes: [],
  styleWeights: [
    { label: "Primary style", weight: 70 },
    { label: "Secondary influence", weight: 30 }
  ],
  unexpected: {
    rhythm: { enabled: false, value: "", intensity: 20 },
    instrumentation: { enabled: false, value: "", intensity: 20 },
    harmony: { enabled: false, value: "", intensity: 20 },
    production: { enabled: false, value: "", intensity: 20 },
    vocalTreatment: { enabled: false, value: "", intensity: 20 }
  },
  referenceAudio: null,
  updatedAt: new Date(0).toISOString()
};

const clamp = (value: unknown, fallback: number): number => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : fallback;
};

const cleanList = (value: unknown, limit = 24): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean))).slice(0, limit)
    : [];

export function normalizeStyleControl(value: unknown): StyleControlState {
  const raw = value && typeof value === "object" ? value as Partial<StyleControlState> : {};
  const unexpectedRaw = raw.unexpected ?? DEFAULT_STYLE_CONTROL.unexpected;
  const unexpected = Object.fromEntries(
    (Object.keys(DEFAULT_STYLE_CONTROL.unexpected) as UnexpectedStyleCategory[]).map((key) => {
      const item = unexpectedRaw[key] ?? DEFAULT_STYLE_CONTROL.unexpected[key];
      return [key, {
        enabled: Boolean(item.enabled),
        value: String(item.value ?? "").slice(0, 180),
        intensity: clamp(item.intensity, 20)
      }];
    })
  ) as StyleControlState["unexpected"];

  return {
    version: 1,
    includeTags: cleanList(raw.includeTags),
    excludeTags: cleanList(raw.excludeTags),
    vocalInfluence: clamp(raw.vocalInfluence, DEFAULT_STYLE_CONTROL.vocalInfluence),
    styleInfluence: clamp(raw.styleInfluence, DEFAULT_STYLE_CONTROL.styleInfluence),
    weirdness: clamp(raw.weirdness, DEFAULT_STYLE_CONTROL.weirdness),
    variety: clamp(raw.variety, DEFAULT_STYLE_CONTROL.variety),
    randomization: clamp(raw.randomization, DEFAULT_STYLE_CONTROL.randomization),
    seedMode: ["locked", "fresh", "guided"].includes(String(raw.seedMode)) ? raw.seedMode as StyleControlState["seedMode"] : "guided",
    seed: typeof raw.seed === "number" && Number.isFinite(raw.seed) ? Math.trunc(raw.seed) : null,
    vocalGender: ["unspecified","male","female","androgynous","mixed"].includes(String(raw.vocalGender)) ? raw.vocalGender as StyleControlState["vocalGender"] : "unspecified",
    soundTextures: cleanList(raw.soundTextures, 16),
    genreArchetypes: cleanList(raw.genreArchetypes, 16),
    styleWeights: Array.isArray(raw.styleWeights)
      ? raw.styleWeights.slice(0, 8).map((item) => ({ label: String(item?.label ?? "").slice(0, 80), weight: clamp(item?.weight, 50) })).filter((item) => item.label)
      : DEFAULT_STYLE_CONTROL.styleWeights,
    unexpected,
    referenceAudio: raw.referenceAudio ? {
      name: String(raw.referenceAudio.name ?? "").slice(0, 220),
      size: Number(raw.referenceAudio.size ?? 0),
      type: String(raw.referenceAudio.type ?? "audio/*").slice(0, 100),
      lastModified: Number(raw.referenceAudio.lastModified ?? 0),
      weight: clamp(raw.referenceAudio.weight, 65),
      role: ["style","vocal","production","rhythm","overall"].includes(String(raw.referenceAudio.role)) ? raw.referenceAudio.role : "overall",
      analysis: raw.referenceAudio.analysis
    } : null,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString()
  };
}

export function loadStyleControl(): StyleControlState {
  if (typeof window === "undefined") return DEFAULT_STYLE_CONTROL;
  try {
    const raw = window.localStorage.getItem(STYLE_CONTROL_STORAGE_KEY);
    return raw ? normalizeStyleControl(JSON.parse(raw)) : DEFAULT_STYLE_CONTROL;
  } catch {
    return DEFAULT_STYLE_CONTROL;
  }
}

export function saveStyleControl(value: StyleControlState): StyleControlState {
  const next = normalizeStyleControl({ ...value, updatedAt: new Date().toISOString() });
  if (typeof window !== "undefined") window.localStorage.setItem(STYLE_CONTROL_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function openReferenceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(REFERENCE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(REFERENCE_STORE)) db.createObjectStore(REFERENCE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStyleReferenceFile(file: File): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openReferenceDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(REFERENCE_STORE, "readwrite");
    tx.objectStore(REFERENCE_STORE).put(file, REFERENCE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadStyleReferenceFile(): Promise<File | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openReferenceDb();
  const result = await new Promise<File | null>((resolve, reject) => {
    const tx = db.transaction(REFERENCE_STORE, "readonly");
    const request = tx.objectStore(REFERENCE_STORE).get(REFERENCE_KEY);
    request.onsuccess = () => resolve(request.result instanceof File ? request.result : null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export async function clearStyleReferenceFile(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openReferenceDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(REFERENCE_STORE, "readwrite");
    tx.objectStore(REFERENCE_STORE).delete(REFERENCE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
