import type { Project, SourceAudioAttachment } from "@/lib/types";

const PROJECTS_KEY = "agentic-beat-lab:projects:v2";
const ACTIVE_PROJECT_KEY = "agentic-beat-lab:active-project:v2";
const DB_NAME = "agentic-beat-lab-media";
const DB_VERSION = 1;
const AUDIO_STORE = "source-audio";
const MANIFEST_STORE = "separation-manifests";

export type SeparationSnapshotKind = "core" | "deep";

interface StoredAudio {
  projectId: string;
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
  size: number;
  savedAt: string;
}

interface StoredManifest {
  key: string;
  projectId: string;
  kind: SeparationSnapshotKind;
  manifest: unknown;
  savedAt: string;
}

const isBrowser = (): boolean => typeof window !== "undefined";

const openDatabase = (): Promise<IDBDatabase> => {
  if (!isBrowser() || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Could not open media storage."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: "projectId" });
      }
      if (!db.objectStoreNames.contains(MANIFEST_STORE)) {
        db.createObjectStore(MANIFEST_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
};

const idbPut = async (storeName: string, value: unknown): Promise<void> => {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not save browser media."));
    tx.objectStore(storeName).put(value);
  });
  db.close();
};

const idbGet = async <T,>(storeName: string, key: IDBValidKey): Promise<T | null> => {
  const db = await openDatabase();
  const result = await new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Could not read browser media."));
  });
  db.close();
  return result;
};

export const loadStoredProjects = (): Project[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed.filter((project) => Boolean(project?.id)) : [];
  } catch {
    return [];
  }
};

export const saveStoredProjects = (projects: Project[]): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.slice(0, 100)));
  } catch {
    // Storage can be unavailable in private/restricted browsing. The app remains usable for this session.
  }
};

export const saveStoredProject = (project: Project): void => {
  const current = loadStoredProjects();
  const next = [project, ...current.filter((item) => item.id !== project.id)].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  saveStoredProjects(next);
};

export const loadActiveProjectId = (): string | null => {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACTIVE_PROJECT_KEY);
};

export const saveActiveProjectId = (projectId: string | null): void => {
  if (!isBrowser()) return;
  if (projectId) window.localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
  else window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
};

const persistSourceAttachment = async (projectId: string, file: File): Promise<void> => {
  const current = loadStoredProjects();
  const project = current.find((item) => item.id === projectId);
  if (!project) return;

  const timestamp = new Date().toISOString();
  const sourceAudio: SourceAudioAttachment = {
    name: file.name,
    size: file.size,
    type: file.type || "audio/*",
    lastModified: file.lastModified,
    attachedAt: timestamp,
    storage: "browser-indexeddb"
  };
  const updated: Project = {
    ...project,
    sourceAudio,
    updatedAt: timestamp,
    manifest: {
      ...project.manifest,
      sourceFile: file.name
    },
    history: [
      ...(project.history ?? []),
      {
        id: crypto.randomUUID(),
        type: "audio-attached",
        message: `Source audio attached: ${file.name}`,
        createdAt: timestamp,
        details: { size: file.size, type: file.type || "audio/*" }
      }
    ].slice(-200)
  };

  saveStoredProject(updated);

  // Best-effort rehydration keeps the Netlify API session in sync. A worker or
  // network failure after this point must not erase the locally attached song.
  await fetch("/api/projects/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projects: [updated] })
  }).catch(() => undefined);
};

export const attachProjectAudio = async (projectId: string, file: File): Promise<void> => {
  if (!file.size) throw new Error("The selected audio file is empty.");
  const record: StoredAudio = {
    projectId,
    blob: file,
    name: file.name,
    type: file.type || "audio/*",
    lastModified: file.lastModified,
    size: file.size,
    savedAt: new Date().toISOString()
  };
  await idbPut(AUDIO_STORE, record);
  await persistSourceAttachment(projectId, file);
};

export const getProjectAudio = async (projectId: string): Promise<File | null> => {
  try {
    const record = await idbGet<StoredAudio>(AUDIO_STORE, projectId);
    if (!record) return null;
    return new File([record.blob], record.name, {
      type: record.type,
      lastModified: record.lastModified
    });
  } catch {
    return null;
  }
};

export const saveSeparationSnapshot = async (
  projectId: string,
  kind: SeparationSnapshotKind,
  manifest: unknown
): Promise<void> => {
  const record: StoredManifest = {
    key: `${projectId}:${kind}`,
    projectId,
    kind,
    manifest,
    savedAt: new Date().toISOString()
  };
  await idbPut(MANIFEST_STORE, record);
};

export const loadSeparationSnapshot = async <T,>(
  projectId: string,
  kind: SeparationSnapshotKind
): Promise<T | null> => {
  try {
    const record = await idbGet<StoredManifest>(MANIFEST_STORE, `${projectId}:${kind}`);
    return (record?.manifest as T | undefined) ?? null;
  } catch {
    return null;
  }
};
