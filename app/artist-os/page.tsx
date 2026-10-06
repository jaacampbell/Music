"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  getCurrentUser,
  getSessionAccessToken,
  isCloudConfigured,
  signOut,
  supabaseRest
} from "@/lib/persistence/supabase-rest";
import type { MusicProjectRow, MusicReleaseRow } from "@/lib/persistence/types";
import type {
  ArtistActivityRow,
  ArtistAgentMessageRow,
  ArtistBrandRow,
  ArtistCampaignRow,
  ArtistContentRow,
  ArtistLinkRow,
  ArtistTaskPriority,
  ArtistTaskRow,
  ArtistWorkspaceRow
} from "@/lib/artist-os/types";
import styles from "./artist-os.module.css";

type Section = "command" | "tasks" | "campaigns" | "content" | "links";

const NAV: Array<{ id: Section; label: string; hint: string }> = [
  { id: "command", label: "Command", hint: "What matters now" },
  { id: "tasks", label: "Tasks", hint: "Work + checklists" },
  { id: "campaigns", label: "Campaigns", hint: "Release rollouts" },
  { id: "content", label: "Content", hint: "Calendar + posts" },
  { id: "links", label: "Link Hub", hint: "Public artist page" }
];

const priorityRank: Record<ArtistTaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3
};

function formatDate(value: string | null): string {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value: string | null): string {
  if (!value) return "Unscheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function taskSort(a: ArtistTaskRow, b: ArtistTaskRow): number {
  const priority = priorityRank[a.priority] - priorityRank[b.priority];
  if (priority !== 0) return priority;
  const aDue = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
  const bDue = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
  if (aDue !== bDue) return aDue - bDue;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export default function ArtistOsPage(): React.JSX.Element {
  const [section, setSection] = useState<Section>("command");
  const [workspace, setWorkspace] = useState<ArtistWorkspaceRow | null>(null);
  const [brand, setBrand] = useState<ArtistBrandRow | null>(null);
  const [campaigns, setCampaigns] = useState<ArtistCampaignRow[]>([]);
  const [tasks, setTasks] = useState<ArtistTaskRow[]>([]);
  const [contentItems, setContentItems] = useState<ArtistContentRow[]>([]);
  const [links, setLinks] = useState<ArtistLinkRow[]>([]);
  const [messages, setMessages] = useState<ArtistAgentMessageRow[]>([]);
  const [activity, setActivity] = useState<ArtistActivityRow[]>([]);
  const [projects, setProjects] = useState<MusicProjectRow[]>([]);
  const [releases, setReleases] = useState<MusicReleaseRow[]>([]);
  const [status, setStatus] = useState("Connecting Artist OS…");
  const [busy, setBusy] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<ArtistTaskPriority>("normal");
  const [taskDue, setTaskDue] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentPlatform, setContentPlatform] = useState("instagram");
  const [contentDate, setContentDate] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [askInput, setAskInput] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [brandDraft, setBrandDraft] = useState({
    bio: "",
    audience: "",
    voice: "",
    visual_direction: ""
  });

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done" && task.status !== "archived").sort(taskSort),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "done").sort((a, b) => {
      const aTime = new Date(a.completed_at ?? a.updated_at).getTime();
      const bTime = new Date(b.completed_at ?? b.updated_at).getTime();
      return bTime - aTime;
    }),
    [tasks]
  );
  const activeCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.status === "active") ?? campaigns[0] ?? null,
    [campaigns]
  );
  const upcomingContent = useMemo(
    () => contentItems
      .filter((item) => item.status !== "published" && item.status !== "archived")
      .sort((a, b) => {
        const aTime = a.scheduled_for ? new Date(a.scheduled_for).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.scheduled_for ? new Date(b.scheduled_for).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }),
    [contentItems]
  );

  async function run(work: () => Promise<void>, success?: string): Promise<void> {
    setBusy(true);
    try {
      await work();
      if (success) setStatus(success);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Artist OS could not complete that action.");
    } finally {
      setBusy(false);
    }
  }

  async function loadData(activeBrand: ArtistBrandRow): Promise<void> {
    const [campaignRows, taskRows, contentRows, linkRows, messageRows, activityRows, projectRows, releaseRows] = await Promise.all([
      supabaseRest<ArtistCampaignRow[]>("artist_campaigns", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=updated_at.desc" }),
      supabaseRest<ArtistTaskRow[]>("artist_tasks", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=created_at.desc" }),
      supabaseRest<ArtistContentRow[]>("artist_content_items", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=scheduled_for.asc.nullslast" }),
      supabaseRest<ArtistLinkRow[]>("artist_links", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=position.asc" }),
      supabaseRest<ArtistAgentMessageRow[]>("artist_agent_messages", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=created_at.asc&limit=80" }),
      supabaseRest<ArtistActivityRow[]>("artist_activity", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=created_at.desc&limit=30" }),
      supabaseRest<MusicProjectRow[]>("music_projects", { query: "select=*&order=updated_at.desc&limit=60" }),
      supabaseRest<MusicReleaseRow[]>("music_releases", { query: "select=*&order=release_date.asc.nullslast&limit=60" })
    ]);
    setCampaigns(campaignRows);
    setTasks(taskRows);
    setContentItems(contentRows);
    setLinks(linkRows);
    setMessages(messageRows);
    setActivity(activityRows);
    setProjects(projectRows);
    setReleases(releaseRows);
  }

  useEffect(() => {
    if (!isCloudConfigured()) {
      setStatus("Supabase is not configured for this deployment.");
      return;
    }

    void getCurrentUser().then(async (user) => {
      if (!user) {
        window.location.replace("/login?next=/artist-os");
        return;
      }

      let workspaces = await supabaseRest<ArtistWorkspaceRow[]>("artist_workspaces", {
        query: "select=*&order=created_at.asc&limit=1"
      });

      if (!workspaces.length) {
        workspaces = await supabaseRest<ArtistWorkspaceRow[]>("artist_workspaces", {
          method: "POST",
          body: { owner_id: user.id, name: "JO₵YN Artist OS" }
        });
      }

      const activeWorkspace = workspaces[0];
      if (!activeWorkspace) throw new Error("Artist workspace could not be created.");
      setWorkspace(activeWorkspace);

      let brands = await supabaseRest<ArtistBrandRow[]>("artist_brands", {
        query: "select=*&workspace_id=eq." + activeWorkspace.id + "&order=created_at.asc&limit=1"
      });

      if (!brands.length) {
        brands = await supabaseRest<ArtistBrandRow[]>("artist_brands", {
          method: "POST",
          body: {
            workspace_id: activeWorkspace.id,
            user_id: user.id,
            display_name: "JOCYN",
            stylized_name: "JO₵YN",
            slug: "jocyn",
            brand_type: "artist",
            bio: "New Orleans recording artist. Music, film, movement, and world-building.",
            audience: "Rap listeners, culture-forward music fans, nightlife audiences, and visual-storytelling fans.",
            voice: "Confident, direct, cinematic, sharp, human, and never generic.",
            visual_direction: "Editorial, masculine, cinematic, modern, fashion-forward, atmospheric, and travel-driven.",
            is_public: true
          }
        });
      }

      const activeBrand = brands[0];
      if (!activeBrand) throw new Error("Artist profile could not be created.");
      setBrand(activeBrand);
      setBrandDraft({
        bio: activeBrand.bio,
        audience: activeBrand.audience,
        voice: activeBrand.voice,
        visual_direction: activeBrand.visual_direction
      });
      await loadData(activeBrand);
      setStatus("Artist OS connected.");
    }).catch((error) => {
      setStatus(error instanceof Error ? error.message : "Artist OS could not load.");
    });
  }, []);

  async function refresh(): Promise<void> {
    if (!brand) return;
    await loadData(brand);
  }

  async function addTask(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!brand || !taskTitle.trim()) return;
    await run(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Sign in again.");
      await supabaseRest<ArtistTaskRow[]>("artist_tasks", {
        method: "POST",
        body: {
          brand_id: brand.id,
          user_id: user.id,
          title: taskTitle.trim(),
          priority: taskPriority,
          due_at: taskDue ? new Date(taskDue).toISOString() : null,
          source: "manual",
          created_by: "user"
        }
      });
      setTaskTitle("");
      setTaskDue("");
      await refresh();
    }, "Task added.");
  }

  async function updateTask(task: ArtistTaskRow, nextStatus: ArtistTaskRow["status"]): Promise<void> {
    await run(async () => {
      await supabaseRest<ArtistTaskRow[]>("artist_tasks", {
        method: "PATCH",
        query: "id=eq." + task.id,
        body: {
          status: nextStatus,
          completed_at: nextStatus === "done" ? new Date().toISOString() : null
        }
      });
      const user = await getCurrentUser();
      if (brand && user) {
        await supabaseRest<ArtistActivityRow[]>("artist_activity", {
          method: "POST",
          body: {
            brand_id: brand.id,
            user_id: user.id,
            entity_type: "task",
            entity_id: task.id,
            action: nextStatus,
            summary: (nextStatus === "done" ? "Completed " : "Updated ") + task.title,
            metadata: { source: "command-center" }
          }
        });
      }
      await refresh();
    });
  }

  async function addCampaign(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!brand || !campaignTitle.trim()) return;
    await run(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Sign in again.");
      await supabaseRest<ArtistCampaignRow[]>("artist_campaigns", {
        method: "POST",
        body: {
          brand_id: brand.id,
          user_id: user.id,
          title: campaignTitle.trim(),
          goal: campaignGoal.trim(),
          phase: "planning",
          status: campaigns.length ? "draft" : "active"
        }
      });
      setCampaignTitle("");
      setCampaignGoal("");
      await refresh();
    }, "Campaign created.");
  }

  async function activateCampaign(campaign: ArtistCampaignRow): Promise<void> {
    await run(async () => {
      const active = campaigns.filter((item) => item.status === "active" && item.id !== campaign.id);
      for (const item of active) {
        await supabaseRest<ArtistCampaignRow[]>("artist_campaigns", {
          method: "PATCH",
          query: "id=eq." + item.id,
          body: { status: "paused" }
        });
      }
      await supabaseRest<ArtistCampaignRow[]>("artist_campaigns", {
        method: "PATCH",
        query: "id=eq." + campaign.id,
        body: { status: "active" }
      });
      await refresh();
    }, campaign.title + " is now the active campaign.");
  }

  async function addContent(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!brand || !contentTitle.trim()) return;
    await run(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Sign in again.");
      await supabaseRest<ArtistContentRow[]>("artist_content_items", {
        method: "POST",
        body: {
          brand_id: brand.id,
          user_id: user.id,
          campaign_id: activeCampaign?.id ?? null,
          platform: contentPlatform,
          format: contentPlatform === "youtube" ? "video" : "post",
          title: contentTitle.trim(),
          status: contentDate ? "scheduled" : "idea",
          scheduled_for: contentDate ? new Date(contentDate).toISOString() : null
        }
      });
      setContentTitle("");
      setContentDate("");
      await refresh();
    }, "Content item added.");
  }

  async function markContentPublished(item: ArtistContentRow): Promise<void> {
    await run(async () => {
      await supabaseRest<ArtistContentRow[]>("artist_content_items", {
        method: "PATCH",
        query: "id=eq." + item.id,
        body: { status: "published", published_at: new Date().toISOString() }
      });
      await refresh();
    }, "Content marked published.");
  }

  async function addLink(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!brand || !linkLabel.trim() || !linkUrl.trim()) return;
    await run(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Sign in again.");
      await supabaseRest<ArtistLinkRow[]>("artist_links", {
        method: "POST",
        body: {
          brand_id: brand.id,
          user_id: user.id,
          campaign_id: activeCampaign?.id ?? null,
          label: linkLabel.trim(),
          url: linkUrl.trim(),
          kind: "link",
          position: links.length,
          is_visible: true
        }
      });
      setLinkLabel("");
      setLinkUrl("");
      await refresh();
    }, "Link added to the public hub.");
  }

  async function toggleLink(link: ArtistLinkRow): Promise<void> {
    await run(async () => {
      await supabaseRest<ArtistLinkRow[]>("artist_links", {
        method: "PATCH",
        query: "id=eq." + link.id,
        body: { is_visible: !link.is_visible }
      });
      await refresh();
    });
  }

  async function saveBrand(): Promise<void> {
    if (!brand) return;
    await run(async () => {
      const rows = await supabaseRest<ArtistBrandRow[]>("artist_brands", {
        method: "PATCH",
        query: "id=eq." + brand.id,
        body: brandDraft
      });
      if (rows[0]) setBrand(rows[0]);
    }, "Artist identity updated.");
  }

  async function askArtistOs(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!brand || !askInput.trim()) return;
    const question = askInput.trim();
    setAskInput("");
    setBusy(true);
    setStatus("Artist OS is working…");
    try {
      const token = await getSessionAccessToken();
      const response = await fetch("/api/artist-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (token ?? "")
        },
        body: JSON.stringify({
          question,
          brandId: brand.id,
          history: messages.slice(-10).map((message) => ({ role: message.role, body: message.body }))
        })
      });
      const payload = await response.json() as { answer?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Artist OS could not answer.");
      await refresh();
      setStatus("Artist OS updated the workspace.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Artist OS could not answer.");
    } finally {
      setBusy(false);
    }
  }

  async function leave(): Promise<void> {
    await signOut();
    window.location.assign("/login");
  }

  if (!isCloudConfigured()) {
    return (
      <main className={styles.setup}>
        <h1>Artist OS needs Supabase.</h1>
        <p>Apply <code>db/music-os-phase16.sql</code> after the existing Music OS migrations.</p>
      </main>
    );
  }

  const nextTask = openTasks[0] ?? null;
  const releaseRows = projects.map((project) => ({
    project,
    release: releases.find((item) => item.project_id === project.id) ?? null
  })).filter((item) => item.release || item.project.status !== "archived");

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logoBlock}>
          <div className={styles.logo}>J</div>
          <div><strong>JO₵YN</strong><span>Artist OS</span></div>
        </div>

        <nav className={styles.nav} aria-label="Artist OS sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={section === item.id ? styles.navActive : ""}
              onClick={() => setSection(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <Link href="/dashboard">Music Dashboard</Link>
          <Link href="/studio">TM Studio</Link>
          <button onClick={() => setAssistantOpen(true)}>Ask Artist OS</button>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.eyebrow}>{workspace?.name ?? "Artist workspace"}</span>
            <h1>{section === "command" ? "Command Center" : NAV.find((item) => item.id === section)?.label}</h1>
          </div>
          <div className={styles.topActions}>
            <span className={styles.status}>{busy ? "Working…" : status}</span>
            <Link href="/jocyn" target="_blank">View public hub ↗</Link>
            <button onClick={() => void leave()}>Sign out</button>
          </div>
        </header>

        {section === "command" && (
          <div className={styles.commandLayout}>
            <section className={styles.heroCard}>
              <div>
                <span className={styles.eyebrow}>Current campaign</span>
                <h2>{activeCampaign?.title ?? "No active campaign yet"}</h2>
                <p>{activeCampaign?.goal || "Create the first campaign so Artist OS can organize the rollout around a real objective."}</p>
              </div>
              <div className={styles.heroMeta}>
                <span>{activeCampaign?.phase ?? "planning"}</span>
                <span>{activeCampaign?.status ?? "not started"}</span>
              </div>
            </section>

            <section className={styles.nextMove}>
              <span className={styles.eyebrow}>Next move</span>
              <h2>{nextTask?.title ?? "Build the first artist-management task"}</h2>
              <p>{nextTask ? (nextTask.due_at ? "Due " + formatDateTime(nextTask.due_at) : "Highest-priority open task") : "Tell Artist OS what needs to happen next and it will keep the checklist moving."}</p>
              <div className={styles.actionRow}>
                {nextTask && <button onClick={() => void updateTask(nextTask, "done")}>Mark complete</button>}
                <button className={styles.secondary} onClick={() => setAssistantOpen(true)}>Ask Artist OS</button>
              </div>
            </section>

            <section className={styles.metricGrid}>
              <div><strong>{openTasks.length}</strong><span>Open tasks</span></div>
              <div><strong>{campaigns.filter((item) => item.status === "active").length}</strong><span>Active campaign</span></div>
              <div><strong>{upcomingContent.length}</strong><span>Content queued</span></div>
              <div><strong>{releases.length}</strong><span>Release records</span></div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div><span className={styles.eyebrow}>Today</span><h3>What needs attention</h3></div>
                <button className={styles.textButton} onClick={() => setSection("tasks")}>All tasks →</button>
              </div>
              <div className={styles.taskStack}>
                {openTasks.length === 0 ? <p className={styles.emptyText}>No open tasks. Ask the assistant to create one from your conversation.</p> :
                  openTasks.slice(0, 6).map((task) => (
                    <div className={styles.taskRow} key={task.id}>
                      <button className={styles.checkButton} onClick={() => void updateTask(task, "done")}>○</button>
                      <div><strong>{task.title}</strong><span>{task.priority} {task.due_at ? "· " + formatDateTime(task.due_at) : ""}</span></div>
                      <span className={styles.taskState}>{task.status}</span>
                    </div>
                  ))
                }
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div><span className={styles.eyebrow}>Release runway</span><h3>Music already in the system</h3></div>
                <Link className={styles.textLink} href="/dashboard">Open Music OS →</Link>
              </div>
              <div className={styles.releaseStack}>
                {releaseRows.length === 0 ? <p className={styles.emptyText}>No Music OS projects yet.</p> :
                  releaseRows.slice(0, 6).map(({ project, release }) => (
                    <Link href={"/dashboard?projectId=" + project.id} className={styles.releaseRow} key={project.id}>
                      <div><strong>{release?.release_title || project.title}</strong><span>{project.status} · {project.readiness}% ready</span></div>
                      <span>{release?.release_date ? formatDate(release.release_date) : "No date"}</span>
                    </Link>
                  ))
                }
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div><span className={styles.eyebrow}>Upcoming content</span><h3>Next on the calendar</h3></div>
                <button className={styles.textButton} onClick={() => setSection("content")}>Content →</button>
              </div>
              <div className={styles.contentStack}>
                {upcomingContent.length === 0 ? <p className={styles.emptyText}>Nothing scheduled yet.</p> :
                  upcomingContent.slice(0, 5).map((item) => (
                    <div className={styles.contentRow} key={item.id}>
                      <span className={styles.platform}>{item.platform}</span>
                      <div><strong>{item.title}</strong><span>{formatDateTime(item.scheduled_for)}</span></div>
                      <span>{item.status}</span>
                    </div>
                  ))
                }
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div><span className={styles.eyebrow}>Artist DNA</span><h3>Teach the system once</h3></div>
                <button className={styles.textButton} onClick={() => void saveBrand()}>Save</button>
              </div>
              <div className={styles.dnaGrid}>
                <label>Bio<textarea value={brandDraft.bio} onChange={(event) => setBrandDraft({ ...brandDraft, bio: event.target.value })} /></label>
                <label>Audience<textarea value={brandDraft.audience} onChange={(event) => setBrandDraft({ ...brandDraft, audience: event.target.value })} /></label>
                <label>Voice<textarea value={brandDraft.voice} onChange={(event) => setBrandDraft({ ...brandDraft, voice: event.target.value })} /></label>
                <label>Visual direction<textarea value={brandDraft.visual_direction} onChange={(event) => setBrandDraft({ ...brandDraft, visual_direction: event.target.value })} /></label>
              </div>
            </section>
          </div>
        )}

        {section === "tasks" && (
          <div className={styles.sectionLayout}>
            <section className={styles.panel}>
              <div className={styles.panelHead}><div><span className={styles.eyebrow}>Task manager</span><h2>Open work</h2></div><span>{openTasks.length} active</span></div>
              <form className={styles.createGrid} onSubmit={(event) => void addTask(event)}>
                <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="What needs to happen?" required />
                <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as ArtistTaskPriority)}>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
                <input type="datetime-local" value={taskDue} onChange={(event) => setTaskDue(event.target.value)} />
                <button disabled={busy}>Add task</button>
              </form>
              <div className={styles.taskBoard}>
                {openTasks.map((task) => (
                  <article className={styles.taskCard} key={task.id}>
                    <div className={styles.taskCardTop}><span className={styles.priority}>{task.priority}</span><span>{task.status}</span></div>
                    <h3>{task.title}</h3>
                    <p>{task.description || (task.due_at ? "Due " + formatDateTime(task.due_at) : "No due date")}</p>
                    <div className={styles.actionRow}>
                      {task.status !== "doing" && <button className={styles.secondary} onClick={() => void updateTask(task, "doing")}>Start</button>}
                      <button onClick={() => void updateTask(task, "done")}>Complete</button>
                      {task.status !== "blocked" && <button className={styles.ghost} onClick={() => void updateTask(task, "blocked")}>Block</button>}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}><div><span className={styles.eyebrow}>Completed</span><h3>Nothing disappears</h3></div><span>{completedTasks.length} done</span></div>
              <div className={styles.completedList}>
                {completedTasks.slice(0, 15).map((task) => (
                  <div key={task.id}><span>✓</span><strong>{task.title}</strong><small>{formatDateTime(task.completed_at)}</small></div>
                ))}
                {completedTasks.length === 0 && <p className={styles.emptyText}>Completed tasks stay here as a permanent record.</p>}
              </div>
            </section>
          </div>
        )}

        {section === "campaigns" && (
          <div className={styles.sectionLayout}>
            <section className={styles.panel}>
              <div className={styles.panelHead}><div><span className={styles.eyebrow}>Campaigns</span><h2>Build releases as systems</h2></div></div>
              <form className={styles.campaignForm} onSubmit={(event) => void addCampaign(event)}>
                <label>Campaign name<input value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} placeholder="TALK BOUT rollout" required /></label>
                <label>Goal<input value={campaignGoal} onChange={(event) => setCampaignGoal(event.target.value)} placeholder="Awareness, streams, pre-saves, audience growth…" /></label>
                <button>Create campaign</button>
              </form>
              <div className={styles.campaignGrid}>
                {campaigns.map((campaign) => (
                  <article className={campaign.status === "active" ? styles.campaignActive : styles.campaignCard} key={campaign.id}>
                    <span className={styles.eyebrow}>{campaign.phase}</span>
                    <h3>{campaign.title}</h3>
                    <p>{campaign.goal || "No campaign goal added yet."}</p>
                    <div className={styles.campaignMeta}><span>{campaign.status}</span><span>{campaign.primary_cta || "CTA not set"}</span></div>
                    {campaign.status !== "active" && <button onClick={() => void activateCampaign(campaign)}>Make active</button>}
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {section === "content" && (
          <div className={styles.sectionLayout}>
            <section className={styles.panel}>
              <div className={styles.panelHead}><div><span className={styles.eyebrow}>Content calendar</span><h2>One rollout, many platform-native pieces</h2></div></div>
              <form className={styles.createGrid} onSubmit={(event) => void addContent(event)}>
                <input value={contentTitle} onChange={(event) => setContentTitle(event.target.value)} placeholder="Hook performance Reel" required />
                <select value={contentPlatform} onChange={(event) => setContentPlatform(event.target.value)}>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                  <option value="threads">Threads</option>
                </select>
                <input type="datetime-local" value={contentDate} onChange={(event) => setContentDate(event.target.value)} />
                <button>Add content</button>
              </form>
              <div className={styles.calendarList}>
                {contentItems.map((item) => (
                  <article key={item.id}>
                    <span className={styles.platform}>{item.platform}</span>
                    <div><h3>{item.title}</h3><p>{item.caption || "Caption not drafted yet."}</p></div>
                    <div className={styles.calendarMeta}><strong>{formatDateTime(item.scheduled_for)}</strong><span>{item.status}</span></div>
                    {item.status !== "published" && <button onClick={() => void markContentPublished(item)}>Published ✓</button>}
                  </article>
                ))}
                {contentItems.length === 0 && <p className={styles.emptyText}>Start with the next piece of content you already know you need.</p>}
              </div>
            </section>
          </div>
        )}

        {section === "links" && (
          <div className={styles.linkLayout}>
            <section className={styles.panel}>
              <div className={styles.panelHead}><div><span className={styles.eyebrow}>JO₵YN Hub</span><h2>Your Linktree replacement</h2></div><Link className={styles.textLink} href="/jocyn" target="_blank">Preview ↗</Link></div>
              <form className={styles.linkForm} onSubmit={(event) => void addLink(event)}>
                <input value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="LISTEN TO TALK BOUT" required />
                <input type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://…" required />
                <button>Add link</button>
              </form>
              <div className={styles.linkList}>
                {links.map((link) => (
                  <article key={link.id}>
                    <div><strong>{link.label}</strong><span>{link.url}</span></div>
                    <button className={link.is_visible ? styles.visible : styles.hidden} onClick={() => void toggleLink(link)}>
                      {link.is_visible ? "Visible" : "Hidden"}
                    </button>
                  </article>
                ))}
                {links.length === 0 && <p className={styles.emptyText}>Add the first public destination. The hub updates from this dashboard.</p>}
              </div>
            </section>

            <section className={styles.hubPreview}>
              <span className={styles.eyebrow}>Live preview</span>
              <div className={styles.previewAvatar}>J</div>
              <h2>{brand?.stylized_name || "JO₵YN"}</h2>
              <p>{brand?.bio}</p>
              <div>
                {links.filter((link) => link.is_visible).slice(0, 5).map((link) => <span key={link.id}>{link.label}</span>)}
              </div>
              <Link href="/jocyn" target="_blank">Open full hub ↗</Link>
            </section>
          </div>
        )}
      </section>

      <button className={styles.assistantFab} onClick={() => setAssistantOpen(!assistantOpen)}>
        {assistantOpen ? "×" : "Ask Artist OS"}
      </button>

      {assistantOpen && (
        <aside className={styles.assistant}>
          <div className={styles.assistantHead}>
            <div><span className={styles.eyebrow}>Artist OS Assistant</span><h2>What are we doing next?</h2></div>
            <button onClick={() => setAssistantOpen(false)}>×</button>
          </div>

          <div className={styles.assistantFeed}>
            {messages.length === 0 && (
              <div className={styles.assistantWelcome}>
                <strong>Talk normally.</strong>
                <p>Try “we need to finish the cover,” “I completed the master,” or “what do I need to do today?”</p>
              </div>
            )}
            {messages.slice(-14).map((message) => (
              <div className={message.role === "user" ? styles.userMessage : styles.assistantMessage} key={message.id}>
                <strong>{message.role === "user" ? "You" : "Artist OS"}</strong>
                <p>{message.body}</p>
              </div>
            ))}
          </div>

          <form className={styles.assistantForm} onSubmit={(event) => void askArtistOs(event)}>
            <textarea value={askInput} onChange={(event) => setAskInput(event.target.value)} placeholder="Tell Artist OS what changed, what you finished, or what needs to happen…" />
            <button disabled={busy || !askInput.trim()}>{busy ? "Working…" : "Send"}</button>
          </form>

          <div className={styles.activityStrip}>
            <strong>Recent automation</strong>
            {activity.slice(0, 3).map((item) => <span key={item.id}>{item.summary}</span>)}
            {activity.length === 0 && <span>No automated actions yet.</span>}
          </div>
        </aside>
      )}
    </main>
  );
}
