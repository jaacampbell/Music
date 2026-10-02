"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredSession, isCloudConfigured, supabaseRest } from "@/lib/persistence/supabase-rest";
import type { MusicProjectRow, MusicProjectStatus } from "@/lib/persistence/types";

type RecentProject = Pick<MusicProjectRow, "id" | "title" | "status" | "bpm" | "song_key" | "readiness" | "updated_at">;

type PanelState =
  | { kind: "loading" }
  | { kind: "unconfigured" }
  | { kind: "signed-out" }
  | { kind: "error"; message: string }
  | { kind: "ready"; projects: RecentProject[] };

const statusLabels: Record<MusicProjectStatus, string> = {
  draft: "Draft",
  "in-progress": "In progress",
  mixing: "Mixing",
  "ready-for-release": "Release-ready",
  released: "Released",
  archived: "Archived"
};

const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "";
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

export function RecentProjects(): React.JSX.Element {
  const [state, setState] = useState<PanelState>({ kind: "loading" });

  useEffect(() => {
    if (!isCloudConfigured()) { setState({ kind: "unconfigured" }); return; }
    if (!getStoredSession()) { setState({ kind: "signed-out" }); return; }
    let cancelled = false;
    void supabaseRest<RecentProject[]>("music_projects", {
      query: "select=id,title,status,bpm,song_key,readiness,updated_at&status=neq.archived&order=updated_at.desc&limit=4"
    })
      .then((projects) => { if (!cancelled) setState({ kind: "ready", projects: projects ?? [] }); })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Could not load projects.";
        setState(/sign in/i.test(message) ? { kind: "signed-out" } : { kind: "error", message });
      });
    return () => { cancelled = true; };
  }, []);

  return <section className="musicStudioSection studioResume" aria-labelledby="studio-resume-title">
    <div className="musicStudioSectionHead">
      <div>
        <p className="musicStudioKicker">PICK UP WHERE YOU LEFT OFF</p>
        <h2 id="studio-resume-title">Your songs</h2>
      </div>
      <Link className="studioResumeAll" href="/dashboard">All projects →</Link>
    </div>

    {state.kind === "loading" && <div className="studioResumeGrid" aria-busy="true">{[0, 1, 2, 3].map((item) => <div className="studioResumeCard skeleton" key={item}/>)}</div>}

    {state.kind === "signed-out" && <div className="studioResumeEmpty"><p>Sign in to see your private songs here and jump straight back into them.</p><Link className="musicStudioPrimary" href="/login?next=/studio">Sign in</Link></div>}

    {state.kind === "unconfigured" && <div className="studioResumeEmpty"><p>Cloud projects aren’t connected on this deployment yet. You can still start a song in Music OS on this device.</p><Link className="musicStudioSecondary" href="/">Start a song</Link></div>}

    {state.kind === "error" && <div className="studioResumeEmpty"><p>Couldn’t load your projects right now: {state.message}</p><Link className="musicStudioSecondary" href="/dashboard">Open Song Dashboard</Link></div>}

    {state.kind === "ready" && state.projects.length === 0 && <div className="studioResumeEmpty"><p>No songs yet. Create your first project and it will show up here.</p><Link className="musicStudioPrimary" href="/dashboard">Create a song</Link></div>}

    {state.kind === "ready" && state.projects.length > 0 && <div className="studioResumeGrid">
      {state.projects.map((project) => {
        const query = `?projectId=${encodeURIComponent(project.id)}`;
        const readiness = Math.max(0, Math.min(100, Math.round(project.readiness ?? 0)));
        const facts = [project.bpm ? `${project.bpm} BPM` : null, project.song_key].filter(Boolean).join(" · ");
        return <article className="studioResumeCard" key={project.id}>
          <div className="studioResumeTop"><span className={`studioResumeStatus s-${project.status}`}>{statusLabels[project.status] ?? project.status}</span><small>{relativeTime(project.updated_at)}</small></div>
          <h3>{project.title || "Untitled song"}</h3>
          <p>{facts || "Tempo and key not set yet"}</p>
          <div className="studioResumeMeter" role="meter" aria-label="Project readiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness}><span style={{ width: `${readiness}%` }}/></div>
          <small className="studioResumeMeterLabel">{readiness}% project readiness</small>
          <div className="studioResumeActions">
            <Link href={`/${query}`}>Open song</Link>
            <Link href={`/stem-agent${query}`}>Stems</Link>
            <Link href={`/dashboard${query}`}>Details</Link>
          </div>
        </article>;
      })}
    </div>}
  </section>;
}
