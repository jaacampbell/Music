"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  getProjectAudio,
  loadActiveProjectId,
  loadStoredProjects,
  saveActiveProjectId,
  saveStoredProject
} from "@/lib/browser-project-storage";
import {
  getCurrentUser,
  isCloudConfigured,
  supabaseRest,
  uploadPrivateFile
} from "@/lib/persistence/supabase-rest";
import type { CloudUser, MusicProjectRow, MusicVersionRow } from "@/lib/persistence/types";
import type { Project } from "@/lib/types";

const SYNC_INTERVAL_MS = 4000;

function projectStatus(status: MusicProjectRow["status"]): Project["status"] {
  if (status === "ready-for-release" || status === "released") return "ready-for-export";
  if (status === "in-progress" || status === "mixing") return "in-progress";
  return "draft";
}

function cloudStatus(status: Project["status"]): MusicProjectRow["status"] {
  if (status === "ready-for-export") return "ready-for-release";
  if (status === "in-progress") return "in-progress";
  return "draft";
}

function defaultPlanningProject(row: MusicProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    brief: row.brief,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: projectStatus(row.status),
    songDna: {
      bpm: row.bpm,
      key: row.song_key,
      mood: [],
      structure: [],
      vocalSpace: "balanced",
      palette: [],
      notes: ""
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
      projectId: row.id,
      title: row.title,
      bpm: row.bpm,
      key: row.song_key,
      sampleRate: 44100,
      bitDepth: 24,
      durationSeconds: 0,
      stems: [],
      tempoMap: [],
      markers: [],
      chords: [],
      exports: []
    },
    promptTelemetry: [],
    history: []
  };
}

function hydratePlanningProject(row: MusicProjectRow): Project {
  const base = row.planning_state ?? defaultPlanningProject(row);
  return {
    ...base,
    id: row.id,
    title: row.title,
    brief: row.brief,
    updatedAt: row.updated_at,
    status: projectStatus(row.status),
    songDna: {
      ...base.songDna,
      bpm: row.bpm ?? base.songDna.bpm,
      key: row.song_key ?? base.songDna.key
    },
    manifest: {
      ...base.manifest,
      projectId: row.id,
      title: row.title,
      bpm: row.bpm ?? base.manifest.bpm,
      key: row.song_key ?? base.manifest.key
    },
    sourceAudio: base.sourceAudio
      ? { ...base.sourceAudio, storage: row.source_audio_path ? "hybrid" : base.sourceAudio.storage, cloudPath: row.source_audio_path ?? base.sourceAudio.cloudPath }
      : undefined
  };
}

async function importIntoPlanningApi(projects: Project[]): Promise<void> {
  if (!projects.length) return;
  await fetch("/api/projects/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projects })
  }).catch(() => undefined);
}

async function uploadCanonicalSource(user: CloudUser, row: MusicProjectRow, project: Project): Promise<MusicProjectRow> {
  if (row.source_audio_path || !project.sourceAudio) return row;
  const sourceFile = await getProjectAudio(project.id);
  if (!sourceFile) return row;

  const path = await uploadPrivateFile(project.id, sourceFile, "source");
  const versions = await supabaseRest<MusicVersionRow[]>("music_versions", {
    query: `select=id,version_number&project_id=eq.${project.id}&order=version_number.desc&limit=1`
  });
  const nextNumber = (versions[0]?.version_number ?? 0) + 1;
  await supabaseRest<MusicVersionRow[]>("music_versions", {
    method: "POST",
    body: {
      project_id: project.id,
      user_id: user.id,
      version_number: nextNumber,
      label: nextNumber === 1 ? "Source / Version 1" : `Source / Version ${nextNumber}`,
      storage_path: path,
      original_name: sourceFile.name,
      mime_type: sourceFile.type || null,
      byte_size: sourceFile.size,
      duration_sec: project.liveAnalysis?.durationSec ?? null,
      bpm: project.liveAnalysis?.bpm ?? project.songDna.bpm,
      song_key: project.liveAnalysis?.key ?? project.songDna.key
    }
  });

  const cloudPlanning: Project = {
    ...project,
    sourceAudio: { ...project.sourceAudio, storage: "hybrid", cloudPath: path }
  };
  saveStoredProject(cloudPlanning);
  const patched = await supabaseRest<MusicProjectRow[]>("music_projects", {
    method: "PATCH",
    query: `id=eq.${project.id}`,
    body: {
      source_audio_path: path,
      live_analysis: project.liveAnalysis ?? null,
      planning_state: cloudPlanning,
      last_synced_at: new Date().toISOString()
    }
  });
  return patched[0] ?? { ...row, source_audio_path: path, planning_state: cloudPlanning };
}

export function CloudProjectBridge(): React.JSX.Element | null {
  const [user, setUser] = useState<CloudUser | null>(null);
  const [path, setPath] = useState("");
  const syncingRef = useRef(false);

  useEffect(() => {
    setPath(window.location.pathname);
    if (!isCloudConfigured()) return;
    void getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user || !isCloudConfigured()) return;

    const sync = async (): Promise<void> => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        let rows = await supabaseRest<MusicProjectRow[]>("music_projects", { query: "select=*&order=updated_at.desc" });
        const local = loadStoredProjects();
        const localById = new Map(local.map((project) => [project.id, project]));
        const rowById = new Map(rows.map((row) => [row.id, row]));

        // Hydrate projects created in the persistent dashboard into the existing production engine.
        const hydrated: Project[] = [];
        for (const row of rows) {
          const localProject = localById.get(row.id);
          const cloudProject = hydratePlanningProject(row);
          const cloudIsNewer = !localProject || Date.parse(row.updated_at) > Date.parse(localProject.updatedAt || "1970-01-01");
          if (cloudIsNewer || !row.planning_state) {
            saveStoredProject(cloudProject);
            hydrated.push(cloudProject);
          }
        }
        if (hydrated.length) await importIntoPlanningApi(hydrated);

        // Promote projects created from Guided/Studio mode into the same persistent library.
        for (const project of loadStoredProjects()) {
          let row = rowById.get(project.id);
          if (!row) {
            const created = await supabaseRest<MusicProjectRow[]>("music_projects", {
              method: "POST",
              body: {
                id: project.id,
                user_id: user.id,
                title: project.title,
                brief: project.brief,
                status: cloudStatus(project.status),
                bpm: project.songDna.bpm,
                song_key: project.songDna.key,
                readiness: project.status === "ready-for-export" ? 85 : project.sourceAudio ? 35 : 10,
                planning_state: project,
                live_analysis: project.liveAnalysis ?? null,
                last_synced_at: new Date().toISOString()
              }
            });
            row = created[0];
            if (row) {
              rows = [row, ...rows];
              rowById.set(row.id, row);
            }
          } else {
            const lastSync = row.last_synced_at ? Date.parse(row.last_synced_at) : 0;
            if (Date.parse(project.updatedAt) > lastSync) {
              const patched = await supabaseRest<MusicProjectRow[]>("music_projects", {
                method: "PATCH",
                query: `id=eq.${project.id}`,
                body: {
                  title: project.title,
                  brief: project.brief,
                  status: cloudStatus(project.status),
                  bpm: project.songDna.bpm,
                  song_key: project.songDna.key,
                  planning_state: project,
                  live_analysis: project.liveAnalysis ?? null,
                  last_synced_at: new Date().toISOString()
                }
              });
              row = patched[0] ?? row;
              rowById.set(project.id, row);
            }
          }

          if (row) {
            const uploaded = await uploadCanonicalSource(user, row, project).catch(() => row as MusicProjectRow);
            rowById.set(project.id, uploaded);
          }
        }

        const params = new URLSearchParams(window.location.search);
        const requestedProject = params.get("projectId");
        if (requestedProject && rowById.has(requestedProject) && loadActiveProjectId() !== requestedProject) {
          saveActiveProjectId(requestedProject);
          const row = rowById.get(requestedProject)!;
          const project = hydratePlanningProject(row);
          saveStoredProject(project);
          await importIntoPlanningApi([project]);
          const reloadKey = `music-os-cloud-boot:${requestedProject}`;
          if (!sessionStorage.getItem(reloadKey) && window.location.pathname === "/") {
            sessionStorage.setItem(reloadKey, "1");
            window.location.reload();
          }
        }
      } finally {
        syncingRef.current = false;
      }
    };

    void sync();
    const timer = window.setInterval(() => void sync(), SYNC_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  if (path !== "/" && !path.startsWith("/stem-studio")) return null;
  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 90, display: "flex", gap: 8, padding: 8, borderRadius: 999, background: "rgba(10,10,14,.92)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 12px 40px rgba(0,0,0,.3)" }}>
      <Link href={user ? "/dashboard" : "/login"} style={{ color: "white", textDecoration: "none", font: "600 13px/1 system-ui", padding: "9px 12px" }}>
        {user ? "My Music" : "Sign in"}
      </Link>
    </div>
  );
}
