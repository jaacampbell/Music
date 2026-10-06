"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  getCurrentUser,
  getSessionAccessToken,
  isCloudConfigured,
  signOut,
  supabaseRest
} from "@/lib/persistence/supabase-rest";
import type { MusicAssetRow, MusicProjectRow, MusicReleaseRow } from "@/lib/persistence/types";
import type {
  ArtistActivityRow,
  ArtistAgentMessageRow,
  ArtistBrandRow,
  ArtistCampaignRow,
  ArtistContentRow,
  ArtistLinkRow,
  ArtistTaskPriority,
  ArtistTaskRow
} from "@/lib/artist-os/types";
import styles from "./artist-os.module.css";

type Section =
  | "command"
  | "releases"
  | "content"
  | "calendar"
  | "campaigns"
  | "ideas"
  | "media"
  | "audience"
  | "analytics"
  | "hub"
  | "ai";

type QuickCreateAction =
  | "post"
  | "campaign"
  | "release"
  | "ideas"
  | "caption"
  | "series"
  | "media"
  | "link"
  | "ai";

const NAV: Array<{ id: Section; label: string; icon: string; group?: string }> = [
  { id: "command", label: "Command Center", icon: "⌂" },
  { id: "releases", label: "Releases", icon: "♫" },
  { id: "content", label: "Content", icon: "▣" },
  { id: "calendar", label: "Calendar", icon: "▦" },
  { id: "campaigns", label: "Campaigns", icon: "◎" },
  { id: "ideas", label: "Ideas", icon: "✦" },
  { id: "media", label: "Media", icon: "▧" },
  { id: "audience", label: "Audience", icon: "◉", group: "GROW" },
  { id: "analytics", label: "Analytics", icon: "↗" },
  { id: "hub", label: "Artist Hub", icon: "◇", group: "PRESENCE" },
  { id: "ai", label: "AI Manager", icon: "✦", group: "INTELLIGENCE" }
];

const QUICK_CREATE: Array<{ id: QuickCreateAction; label: string; detail: string; icon: string }> = [
  { id: "post", label: "Create Post", detail: "Draft a platform-native content piece", icon: "▣" },
  { id: "campaign", label: "Create Campaign", detail: "Build a creative mission around a goal", icon: "◎" },
  { id: "release", label: "Create Release", detail: "Start a release workspace", icon: "♫" },
  { id: "ideas", label: "Capture Idea", detail: "Save a thought before you lose it", icon: "✦" },
  { id: "caption", label: "Write Caption", detail: "Open content with AI context", icon: "✎" },
  { id: "series", label: "Content Series", detail: "Turn one thought into a repeatable format", icon: "⊞" },
  { id: "media", label: "Upload Media", detail: "Add photos, video, artwork, or audio", icon: "↑" },
  { id: "link", label: "Add Link", detail: "Update the public Artist Hub", icon: "↗" },
  { id: "ai", label: "Ask Artist OS", detail: "Start from any idea or problem", icon: "✦" }
];

const priorityRank: Record<ArtistTaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3
};

const accentFallback = "#8d7bff";

function formatDate(value: string | null): string {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatCompactDate(value: string | null): string {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
}

function formatDateTime(value: string | null): string {
  if (!value) return "Unscheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function daysUntil(value: string | null): number | null {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.ceil((b - a) / 86400000);
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function taskSort(a: ArtistTaskRow, b: ArtistTaskRow): number {
  const priority = priorityRank[a.priority] - priorityRank[b.priority];
  if (priority !== 0) return priority;
  const aDue = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
  const bDue = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
  if (aDue !== bDue) return aDue - bDue;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function checklistProgress(checklist: Record<string, boolean> | undefined): number {
  if (!checklist) return 0;
  const entries = Object.values(checklist);
  if (!entries.length) return 0;
  return Math.round((entries.filter(Boolean).length / entries.length) * 100);
}

function safeAccent(release: MusicReleaseRow | null): string {
  const maybe = release?.metadata?.accent;
  return typeof maybe === "string" && /^#[0-9a-f]{6}$/i.test(maybe) ? maybe : accentFallback;
}

function titleMonogram(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "J";
}

function isToday(value: string | null): boolean {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function withinDays(value: string | null, days: number): boolean {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  const delta = date.getTime() - now.getTime();
  return delta >= 0 && delta <= days * 86400000;
}

export default function ArtistOsPage(): React.JSX.Element {
  const [section, setSection] = useState<Section>("command");
  const [brand, setBrand] = useState<ArtistBrandRow | null>(null);
  const [campaigns, setCampaigns] = useState<ArtistCampaignRow[]>([]);
  const [tasks, setTasks] = useState<ArtistTaskRow[]>([]);
  const [contentItems, setContentItems] = useState<ArtistContentRow[]>([]);
  const [links, setLinks] = useState<ArtistLinkRow[]>([]);
  const [messages, setMessages] = useState<ArtistAgentMessageRow[]>([]);
  const [activity, setActivity] = useState<ArtistActivityRow[]>([]);
  const [projects, setProjects] = useState<MusicProjectRow[]>([]);
  const [releases, setReleases] = useState<MusicReleaseRow[]>([]);
  const [assets, setAssets] = useState<MusicAssetRow[]>([]);
  const [status, setStatus] = useState("Connecting Artist OS…");
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [askInput, setAskInput] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<ArtistTaskPriority>("normal");
  const [taskDue, setTaskDue] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentPlatform, setContentPlatform] = useState("instagram");
  const [contentDate, setContentDate] = useState("");
  const [ideaInput, setIdeaInput] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [brandDraft, setBrandDraft] = useState({ bio: "", audience: "", voice: "", visual_direction: "" });

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done" && task.status !== "archived").sort(taskSort),
    [tasks]
  );
  const activeCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.status === "active") ?? campaigns[0] ?? null,
    [campaigns]
  );
  const activeRelease = useMemo(() => {
    const linked = activeCampaign?.music_project_id
      ? releases.find((release) => release.project_id === activeCampaign.music_project_id)
      : null;
    if (linked) return linked;
    const future = releases
      .filter((release) => release.release_date && new Date(release.release_date).getTime() >= Date.now() - 86400000)
      .sort((a, b) => new Date(a.release_date ?? "").getTime() - new Date(b.release_date ?? "").getTime())[0];
    return future ?? releases[0] ?? null;
  }, [activeCampaign, releases]);
  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeRelease?.project_id) ?? null,
    [projects, activeRelease]
  );
  const ideaItems = useMemo(
    () => contentItems.filter((item) => item.platform === "idea-vault"),
    [contentItems]
  );
  const pipelineItems = useMemo(
    () => contentItems.filter((item) => item.platform !== "idea-vault" && item.status !== "archived"),
    [contentItems]
  );
  const scheduledItems = useMemo(
    () => pipelineItems
      .filter((item) => item.scheduled_for && item.status !== "published")
      .sort((a, b) => new Date(a.scheduled_for ?? "").getTime() - new Date(b.scheduled_for ?? "").getTime()),
    [pipelineItems]
  );

  const activeTitle = activeRelease?.release_title || activeProject?.title || activeCampaign?.title || "Your next release";
  const countdown = daysUntil(activeRelease?.release_date ?? null);
  const releaseProgress = activeProject?.readiness ?? checklistProgress(activeRelease?.checklist);
  const accent = safeAccent(activeRelease);
  const shellStyle = { "--era-accent": accent } as CSSProperties;
  const artUrl = activeRelease?.artwork_path?.startsWith("http") ? activeRelease.artwork_path : null;

  const todayDo = useMemo(
    () => openTasks.filter((task) => task.priority === "urgent" || task.priority === "high" || isToday(task.due_at)).slice(0, 4),
    [openTasks]
  );
  const todayUpcoming = useMemo(
    () => openTasks.filter((task) => !todayDo.some((candidate) => candidate.id === task.id) && withinDays(task.due_at, 7)).slice(0, 3),
    [openTasks, todayDo]
  );
  const todayOptional = useMemo(
    () => openTasks.filter((task) => !todayDo.some((candidate) => candidate.id === task.id) && !todayUpcoming.some((candidate) => candidate.id === task.id)).slice(0, 2),
    [openTasks, todayDo, todayUpcoming]
  );

  const recommendations = useMemo(() => {
    const recs: Array<{ title: string; body: string; action: string; section: Section }> = [];
    if (!activeCampaign) {
      recs.push({ title: "Build the active campaign", body: "Artist OS has no active campaign yet. Start one so releases, content, tasks, and the public hub can move together.", action: "Create campaign", section: "campaigns" });
    }
    if (activeRelease && countdown !== null && countdown >= 0 && countdown <= 14 && !scheduledItems.some((item) => withinDays(item.scheduled_for, 7))) {
      recs.push({ title: "Your release needs a content runway", body: activeTitle + " is close, but there is very little scheduled content in the next seven days.", action: "Fill the gap", section: "content" });
    }
    const blocked = openTasks.find((task) => task.status === "blocked");
    if (blocked) {
      recs.push({ title: "A blocker is slowing the rollout", body: blocked.title + " is marked blocked. Resolve it before adding more work.", action: "Review blocker", section: "command" });
    }
    if (!links.some((link) => link.is_visible)) {
      recs.push({ title: "Your public Artist Hub is empty", body: "Add the current release, video, or primary call to action before driving profile traffic.", action: "Update hub", section: "hub" });
    }
    if (!recs.length) {
      recs.push({ title: "Keep the current release moving", body: openTasks[0]?.title ? "The highest-leverage next action is: " + openTasks[0].title + "." : "Your active queue is clear. Use the space to create the next high-value content piece.", action: openTasks[0] ? "Open today" : "Create something", section: openTasks[0] ? "command" : "content" });
    }
    return recs.slice(0, 3);
  }, [activeCampaign, activeRelease, activeTitle, countdown, scheduledItems, openTasks, links]);

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
    const [campaignRows, taskRows, contentRows, linkRows, messageRows, activityRows, projectRows, releaseRows, assetRows] = await Promise.all([
      supabaseRest<ArtistCampaignRow[]>("artist_campaigns", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=updated_at.desc" }),
      supabaseRest<ArtistTaskRow[]>("artist_tasks", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=created_at.desc" }),
      supabaseRest<ArtistContentRow[]>("artist_content_items", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=scheduled_for.asc.nullslast" }),
      supabaseRest<ArtistLinkRow[]>("artist_links", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=position.asc" }),
      supabaseRest<ArtistAgentMessageRow[]>("artist_agent_messages", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=created_at.asc&limit=100" }),
      supabaseRest<ArtistActivityRow[]>("artist_activity", { query: "select=*&brand_id=eq." + activeBrand.id + "&order=created_at.desc&limit=40" }),
      supabaseRest<MusicProjectRow[]>("music_projects", { query: "select=*&order=updated_at.desc&limit=80" }),
      supabaseRest<MusicReleaseRow[]>("music_releases", { query: "select=*&order=release_date.asc.nullslast&limit=80" }),
      supabaseRest<MusicAssetRow[]>("music_assets", { query: "select=*&order=created_at.desc&limit=100" })
    ]);
    setCampaigns(campaignRows);
    setTasks(taskRows);
    setContentItems(contentRows);
    setLinks(linkRows);
    setMessages(messageRows);
    setActivity(activityRows);
    setProjects(projectRows);
    setReleases(releaseRows);
    setAssets(assetRows);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setCreateOpen(false);
        setCommandOpen(false);
        setAssistantOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
          campaign_id: activeCampaign?.id ?? null,
          music_project_id: activeRelease?.project_id ?? null,
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
        body: { status: nextStatus, completed_at: nextStatus === "done" ? new Date().toISOString() : null }
      });
      await refresh();
    }, nextStatus === "done" ? "Task completed." : "Task updated.");
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
          music_project_id: activeRelease?.project_id ?? null,
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
      for (const item of campaigns.filter((value) => value.status === "active" && value.id !== campaign.id)) {
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
    }, campaign.title + " is now active.");
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
          music_project_id: activeRelease?.project_id ?? null,
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
    }, "Content added.");
  }

  async function addIdea(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!brand || !ideaInput.trim()) return;
    await run(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Sign in again.");
      await supabaseRest<ArtistContentRow[]>("artist_content_items", {
        method: "POST",
        body: {
          brand_id: brand.id,
          user_id: user.id,
          campaign_id: activeCampaign?.id ?? null,
          music_project_id: activeRelease?.project_id ?? null,
          platform: "idea-vault",
          format: "idea",
          title: ideaInput.trim().slice(0, 180),
          caption: ideaInput.trim(),
          status: "idea"
        }
      });
      setIdeaInput("");
      await refresh();
    }, "Idea captured.");
  }

  async function markContentPublished(item: ArtistContentRow): Promise<void> {
    await run(async () => {
      await supabaseRest<ArtistContentRow[]>("artist_content_items", {
        method: "PATCH",
        query: "id=eq." + item.id,
        body: { status: "published", published_at: new Date().toISOString() }
      });
      await refresh();
    }, "Content marked live.");
  }

  async function moveContent(item: ArtistContentRow, statusValue: ArtistContentRow["status"]): Promise<void> {
    await run(async () => {
      await supabaseRest<ArtistContentRow[]>("artist_content_items", {
        method: "PATCH",
        query: "id=eq." + item.id,
        body: { status: statusValue }
      });
      await refresh();
    }, "Content moved.");
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
    }, "Artist Hub updated.");
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
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (token ?? "") },
        body: JSON.stringify({
          question,
          brandId: brand.id,
          history: messages.slice(-12).map((message) => ({ role: message.role, body: message.body }))
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

  function quickCreate(action: QuickCreateAction): void {
    setCreateOpen(false);
    if (action === "post" || action === "caption" || action === "series") setSection("content");
    if (action === "campaign") setSection("campaigns");
    if (action === "release") setSection("releases");
    if (action === "ideas") setSection("ideas");
    if (action === "media") setSection("media");
    if (action === "link") setSection("hub");
    if (action === "ai") setSection("ai");
  }

  function navigate(target: Section): void {
    setSection(target);
    setCommandOpen(false);
    setCommandQuery("");
  }

  async function leave(): Promise<void> {
    await signOut();
    window.location.assign("/login");
  }

  if (!isCloudConfigured()) {
    return (
      <main className={styles.setup}>
        <span className={styles.eyebrow}>Artist OS</span>
        <h1>Connect the artist workspace.</h1>
        <p>Supabase is not configured for this deployment. Add the existing Music OS public Supabase variables, then reload.</p>
      </main>
    );
  }

  const visibleLinks = links.filter((link) => link.is_visible);
  const pipelineStages: Array<{ label: string; statuses: ArtistContentRow["status"][]; description: string }> = [
    { label: "IDEA", statuses: ["idea"], description: "Worth making" },
    { label: "CREATING", statuses: ["draft"], description: "In progress" },
    { label: "READY", statuses: ["approved"], description: "Approved to go" },
    { label: "SCHEDULED", statuses: ["scheduled"], description: "On the calendar" },
    { label: "LIVE", statuses: ["published"], description: "Published" }
  ];

  const commandItems = [
    { label: "Go to Command Center", section: "command" as Section },
    { label: "Create post", section: "content" as Section },
    { label: "Open current release", section: "releases" as Section },
    { label: "Schedule content", section: "calendar" as Section },
    { label: "Capture idea", section: "ideas" as Section },
    { label: "Find media", section: "media" as Section },
    { label: "Update Artist Hub", section: "hub" as Section },
    { label: "Ask Artist OS", section: "ai" as Section },
    { label: "Review analytics", section: "analytics" as Section }
  ].filter((item) => item.label.toLowerCase().includes(commandQuery.toLowerCase()));

  return (
    <main className={styles.shell} style={shellStyle}>
      <aside className={styles.sidebar}>
        <button className={styles.workspaceSwitcher} onClick={() => setSection("command")}>
          <span className={styles.workspaceAvatar}>{brand?.stylized_name?.slice(0, 1) || "J"}</span>
          <span className={styles.workspaceCopy}>
            <strong>{brand?.stylized_name || "JO₵YN"}</strong>
            <small>Artist OS</small>
          </span>
          <span className={styles.chevron}>⌄</span>
        </button>

        <button className={styles.createButton} onClick={() => setCreateOpen(true)}>
          <span>＋</span> CREATE
        </button>

        <nav className={styles.nav} aria-label="Artist OS">
          {NAV.map((item, index) => (
            <div key={item.id}>
              {item.group && (index === 0 || NAV[index - 1]?.group !== item.group) && <div className={styles.navGroup}>{item.group}</div>}
              <button className={section === item.id ? styles.navActive : ""} onClick={() => setSection(item.id)}>
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <button onClick={() => setCommandOpen(true)}><span>⌘</span><span>Command palette</span><kbd>⌘K</kbd></button>
          <Link href="/dashboard"><span>♫</span><span>Music OS</span></Link>
          <Link href="/studio"><span>≋</span><span>TM Studio</span></Link>
          <button onClick={() => void leave()}><span>↪</span><span>Sign out</span></button>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.mobileBrand}><strong>{brand?.stylized_name || "JO₵YN"}</strong><span>Artist OS</span></div>
          <div className={styles.topSearch} onClick={() => setCommandOpen(true)} role="button" tabIndex={0}>
            <span>⌕</span>
            <span>Search or jump anywhere</span>
            <kbd>⌘ K</kbd>
          </div>
          <div className={styles.topActions}>
            <span className={styles.syncStatus}>{busy ? "Working…" : status}</span>
            <button className={styles.topCreate} onClick={() => setCreateOpen(true)}>＋ CREATE</button>
            <button className={styles.avatarButton} aria-label="Account">{brand?.stylized_name?.slice(0, 1) || "J"}</button>
          </div>
        </header>

        {section === "command" && (
          <div className={styles.page}>
            <section className={styles.intro}>
              <div>
                <span className={styles.eyebrow}>NOW</span>
                <h1>{greeting()}, {brand?.stylized_name || "JO₵YN"}.</h1>
                <p>{activeRelease
                  ? (countdown !== null && countdown >= 0
                    ? activeTitle + " releases in " + countdown + (countdown === 1 ? " day." : " days.")
                    : activeTitle + " is your current release world.")
                  : "Your next era starts with one clear release and one clear next move."}</p>
              </div>
              <div className={styles.introActions}>
                <button onClick={() => setCreateOpen(true)}>＋ Create</button>
                <button className={styles.secondaryButton} onClick={() => setSection("calendar")}>View week</button>
              </div>
            </section>

            <form className={styles.aiOmnibox} onSubmit={(event) => { setAssistantOpen(true); void askArtistOs(event); }}>
              <span className={styles.aiSpark}>✦</span>
              <textarea
                value={askInput}
                onChange={(event) => setAskInput(event.target.value)}
                placeholder="What are you trying to create, promote, release, or figure out?"
              />
              <button disabled={busy || !askInput.trim()}>Ask Artist OS ↗</button>
            </form>

            <div className={styles.promptChips}>
              {["Plan today", "Give me something to post", "Build my release rollout", "What am I forgetting?"].map((prompt) => (
                <button key={prompt} onClick={() => { setAskInput(prompt); setAssistantOpen(true); }}>{prompt}</button>
              ))}
            </div>

            <section className={styles.releaseHero}>
              <div
                className={styles.releaseArtwork}
                style={artUrl ? { backgroundImage: "linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.28)), url(" + artUrl + ")" } : undefined}
              >
                {!artUrl && <span>{titleMonogram(activeTitle)}</span>}
                <small>CURRENT WORLD</small>
              </div>
              <div className={styles.releaseHeroBody}>
                <div className={styles.releaseMetaLine}>
                  <span>{activeRelease ? "CURRENT RELEASE" : "START HERE"}</span>
                  <span>{activeCampaign?.phase?.replace("-", " ") ?? "planning"}</span>
                </div>
                <h2>{activeTitle}</h2>
                <p>{activeCampaign?.goal || activeProject?.brief || "Connect the music, campaign, content, links, and tasks around one active release."}</p>

                <div className={styles.releaseNumbers}>
                  <div><strong>{countdown !== null && countdown >= 0 ? countdown : "—"}</strong><span>DAYS TO RELEASE</span></div>
                  <div><strong>{releaseProgress}%</strong><span>READY</span></div>
                  <div><strong>{pipelineItems.filter((item) => item.campaign_id === activeCampaign?.id).length}</strong><span>CONTENT PIECES</span></div>
                </div>

                <div className={styles.progressBlock}>
                  <div><span>Release readiness</span><strong>{releaseProgress}%</strong></div>
                  <div className={styles.progressTrack}><span style={{ width: Math.max(2, releaseProgress) + "%" }} /></div>
                </div>

                <div className={styles.heroActions}>
                  <button onClick={() => setSection("releases")}>Continue release</button>
                  <button className={styles.secondaryButton} onClick={() => setSection("campaigns")}>View campaign</button>
                </div>
              </div>
              <div className={styles.countdownBlock}>
                <span>{activeRelease ? formatCompactDate(activeRelease.release_date) : "NO DATE"}</span>
                <strong>{countdown !== null && countdown >= 0 ? countdown : "—"}</strong>
                <small>{countdown === 1 ? "DAY" : "DAYS"}</small>
              </div>
            </section>

            <div className={styles.commandGrid}>
              <section className={styles.todayPanel}>
                <div className={styles.sectionHead}>
                  <div><span className={styles.eyebrow}>NEXT</span><h2>Today</h2></div>
                  <span>{openTasks.length} open · {completedTasks.length} done</span>
                </div>

                <div className={styles.todayGroups}>
                  <div>
                    <span className={styles.todayLabel}>DO TODAY</span>
                    {todayDo.length ? todayDo.map((task) => (
                      <div className={styles.todayRow} key={task.id}>
                        <button onClick={() => void updateTask(task, "done")} aria-label={"Complete " + task.title}>○</button>
                        <div><strong>{task.title}</strong><small>{task.due_at ? formatDateTime(task.due_at) : task.priority + " priority"}</small></div>
                        <span className={styles.priorityBadge}>{task.priority}</span>
                      </div>
                    )) : <p className={styles.emptyCompact}>Nothing urgent. Protect the space for creative work.</p>}
                  </div>

                  {!!todayUpcoming.length && <div>
                    <span className={styles.todayLabel}>COMING UP</span>
                    {todayUpcoming.map((task) => (
                      <div className={styles.todayRow} key={task.id}>
                        <button onClick={() => void updateTask(task, "done")}>○</button>
                        <div><strong>{task.title}</strong><small>{formatDateTime(task.due_at)}</small></div>
                      </div>
                    ))}
                  </div>}

                  {!!todayOptional.length && <div>
                    <span className={styles.todayLabel}>OPTIONAL</span>
                    {todayOptional.map((task) => (
                      <div className={styles.todayRow} key={task.id}>
                        <button onClick={() => void updateTask(task, "done")}>○</button>
                        <div><strong>{task.title}</strong><small>When there is room</small></div>
                      </div>
                    ))}
                  </div>}
                </div>

                <form className={styles.quickTask} onSubmit={(event) => void addTask(event)}>
                  <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add something that matters…" />
                  <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as ArtistTaskPriority)}>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                  <input type="datetime-local" value={taskDue} onChange={(event) => setTaskDue(event.target.value)} />
                  <button disabled={!taskTitle.trim()}>Add</button>
                </form>
              </section>

              <section className={styles.recommendationPanel}>
                <div className={styles.sectionHead}>
                  <div><span className={styles.eyebrow}>✦ ARTIST OS RECOMMENDS</span><h2>Keep momentum</h2></div>
                </div>
                <div className={styles.recommendationStack}>
                  {recommendations.map((recommendation) => (
                    <article className={styles.recommendationCard} key={recommendation.title}>
                      <span>✦</span>
                      <div><h3>{recommendation.title}</h3><p>{recommendation.body}</p></div>
                      <button onClick={() => setSection(recommendation.section)}>{recommendation.action} ↗</button>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <section className={styles.momentumPanel}>
              <div className={styles.sectionHead}>
                <div><span className={styles.eyebrow}>CREATE</span><h2>Content momentum</h2></div>
                <button className={styles.textButton} onClick={() => setSection("content")}>Open pipeline →</button>
              </div>
              <div className={styles.momentumStrip}>
                {pipelineStages.map((stage) => {
                  const item = pipelineItems.find((candidate) => stage.statuses.includes(candidate.status));
                  return (
                    <div className={styles.momentumStage} key={stage.label}>
                      <span>{stage.label}</span>
                      {item ? (
                        <div className={styles.momentumCard}>
                          <div className={styles.thumb}><span>{item.platform.slice(0, 2).toUpperCase()}</span></div>
                          <strong>{item.title}</strong>
                          <small>{stage.description}</small>
                        </div>
                      ) : <button className={styles.emptyMomentum} onClick={() => setSection("content")}>＋</button>}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={styles.bottomInsightGrid}>
              <article className={styles.insightCard}>
                <span className={styles.eyebrow}>GROW</span>
                <h3>{activity[0]?.summary || "Performance becomes useful when it changes the next move."}</h3>
                <p>{activity[0] ? "Latest workspace activity · " + formatDateTime(activity[0].created_at) : "Publish and connect platform data to unlock decision-first insights here."}</p>
                <button onClick={() => setSection("analytics")}>View growth →</button>
              </article>

              <article className={styles.hubSnapshot}>
                <div><span className={styles.eyebrow}>PUBLIC PRESENCE</span><h3>{brand?.stylized_name || "JO₵YN"} Hub</h3></div>
                <div className={styles.hubLinkPreview}>
                  {visibleLinks.slice(0, 3).map((link) => <span key={link.id}>{link.label}</span>)}
                  {!visibleLinks.length && <span>Add your first public destination</span>}
                </div>
                <button onClick={() => setSection("hub")}>Edit Artist Hub →</button>
              </article>
            </section>
          </div>
        )}

        {section === "releases" && (
          <div className={styles.page}>
            <section className={styles.pageIntro}>
              <span className={styles.eyebrow}>RELEASE</span>
              <h1>Every song gets a world.</h1>
              <p>Connect the music, campaign, content, assets, links, milestones, and results instead of treating releases like isolated uploads.</p>
            </section>

            <section className={styles.releaseWorkspace}>
              <div className={styles.releaseWorkspaceTop}>
                <div
                  className={styles.largeArtwork}
                  style={artUrl ? { backgroundImage: "url(" + artUrl + ")" } : undefined}
                >
                  {!artUrl && <span>{titleMonogram(activeTitle)}</span>}
                </div>
                <div className={styles.releaseWorkspaceCopy}>
                  <span className={styles.eyebrow}>CURRENT RELEASE</span>
                  <h2>{activeTitle}</h2>
                  <div className={styles.releaseFacts}>
                    <span>{activeRelease?.release_date ? formatDate(activeRelease.release_date) : "Release date not set"}</span>
                    <span>{countdown !== null && countdown >= 0 ? countdown + " days" : "No countdown"}</span>
                    <span>{releaseProgress}% ready</span>
                  </div>
                  <p>{activeCampaign?.goal || activeProject?.brief || "Set an active release in Music OS, then build the campaign and content runway here."}</p>
                  <div className={styles.heroActions}>
                    <Link className={styles.primaryLinkButton} href={activeProject ? "/dashboard?projectId=" + activeProject.id : "/dashboard"}>Open release details</Link>
                    <button className={styles.secondaryButton} onClick={() => setSection("campaigns")}>Campaign</button>
                  </div>
                </div>
              </div>

              <div className={styles.releaseTabBar}>
                {["Overview", "Timeline", "Content", "Campaign", "Assets", "Links", "Tasks", "Results"].map((tab) => <span key={tab}>{tab}</span>)}
              </div>

              <div className={styles.releaseOverviewGrid}>
                <section className={styles.releaseMilestone}>
                  <span className={styles.eyebrow}>NEXT MILESTONE</span>
                  <h3>{openTasks[0]?.title || "Build the first release milestone"}</h3>
                  <p>{openTasks[0]?.due_at ? "Due " + formatDateTime(openTasks[0].due_at) : "No deadline assigned yet."}</p>
                  <div className={styles.progressTrack}><span style={{ width: Math.max(2, releaseProgress) + "%" }} /></div>
                </section>

                <section className={styles.coveragePanel}>
                  <span className={styles.eyebrow}>CONTENT COVERAGE</span>
                  <div className={styles.coverageGrid}>
                    {["Announce", "Story", "Performance", "BTS", "Release"].map((type, index) => (
                      <div key={type}><span>{type}</span><strong>{pipelineItems[index] ? "✓" : "○"}</strong></div>
                    ))}
                  </div>
                </section>

                <section className={styles.aiStrategyCard}>
                  <span>✦</span>
                  <div>
                    <strong>Artist OS strategy</strong>
                    <p>{recommendations[0]?.body}</p>
                  </div>
                  <button onClick={() => setSection(recommendations[0]?.section ?? "ai")}>Act on it →</button>
                </section>
              </div>
            </section>

            <section className={styles.releaseLibrary}>
              <div className={styles.sectionHead}>
                <div><span className={styles.eyebrow}>CATALOG</span><h2>Release center</h2></div>
                <Link href="/dashboard">Manage music records →</Link>
              </div>
              <div className={styles.releaseCardGrid}>
                {releases.map((release) => {
                  const project = projects.find((candidate) => candidate.id === release.project_id);
                  return (
                    <article className={styles.releaseCard} key={release.id}>
                      <div className={styles.releaseCardArt}><span>{titleMonogram(release.release_title || project?.title || "J")}</span></div>
                      <div><span className={styles.eyebrow}>{project?.status || "release"}</span><h3>{release.release_title || project?.title || "Untitled release"}</h3><p>{release.release_date ? formatDate(release.release_date) : "Release date TBD"}</p></div>
                      <strong>{project?.readiness ?? checklistProgress(release.checklist)}%</strong>
                    </article>
                  );
                })}
                {!releases.length && (
                  <article className={styles.emptyStateWide}>
                    <span>♫</span>
                    <h3>Your next era starts here.</h3>
                    <p>Add a release in Music OS and Artist OS will turn it into a connected campaign workspace.</p>
                    <Link href="/dashboard">Create release →</Link>
                  </article>
                )}
              </div>
            </section>
          </div>
        )}

        {section === "content" && (
          <div className={styles.page}>
            <section className={styles.pageIntroRow}>
              <div><span className={styles.eyebrow}>CREATE</span><h1>Content pipeline</h1><p>Move media from idea to live without turning the creative process into a spreadsheet.</p></div>
              <button className={styles.topCreate} onClick={() => setCreateOpen(true)}>＋ Create content</button>
            </section>

            <form className={styles.inlineCreator} onSubmit={(event) => void addContent(event)}>
              <input value={contentTitle} onChange={(event) => setContentTitle(event.target.value)} placeholder="What are you making?" required />
              <select value={contentPlatform} onChange={(event) => setContentPlatform(event.target.value)}>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="threads">Threads</option>
              </select>
              <input type="datetime-local" value={contentDate} onChange={(event) => setContentDate(event.target.value)} />
              <button>Add to pipeline</button>
            </form>

            <div className={styles.pipeline}>
              {pipelineStages.map((stage) => {
                const stageItems = pipelineItems.filter((item) => stage.statuses.includes(item.status));
                return (
                  <section className={styles.pipelineColumn} key={stage.label}>
                    <header><div><strong>{stage.label}</strong><span>{stage.description}</span></div><b>{stageItems.length}</b></header>
                    <div className={styles.pipelineStack}>
                      {stageItems.map((item) => (
                        <article className={styles.contentCard} key={item.id}>
                          <div className={styles.contentThumb}><span>{item.platform.toUpperCase()}</span></div>
                          <div className={styles.contentMeta}><span>{item.platform} · {item.format}</span><h3>{item.title}</h3><p>{item.scheduled_for ? formatDateTime(item.scheduled_for) : activeCampaign?.title || "No campaign"}</p></div>
                          <div className={styles.contentActions}>
                            {item.status === "idea" && <button onClick={() => void moveContent(item, "draft")}>Start creating</button>}
                            {item.status === "draft" && <button onClick={() => void moveContent(item, "approved")}>Mark ready</button>}
                            {item.status === "approved" && <button onClick={() => setSection("calendar")}>Schedule</button>}
                            {item.status === "scheduled" && <button onClick={() => void markContentPublished(item)}>Published ✓</button>}
                            {item.status === "published" && <button onClick={() => { setAskInput("How can I repurpose " + item.title + "?"); setSection("ai"); }}>Repurpose ✦</button>}
                          </div>
                        </article>
                      ))}
                      {!stageItems.length && <button className={styles.pipelineEmpty} onClick={() => setCreateOpen(true)}>＋ Add something</button>}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {section === "calendar" && (
          <div className={styles.page}>
            <section className={styles.pageIntroRow}>
              <div><span className={styles.eyebrow}>NEXT</span><h1>Creator calendar</h1><p>See promotional rhythm, release dates, shoots, and content gaps before they become problems.</p></div>
              <div className={styles.viewToggle}><button className={styles.selectedView}>Week</button><button>Month</button><button>Release timeline</button></div>
            </section>

            <div className={styles.calendarWeek}>
              {Array.from({ length: 7 }, (_, index) => {
                const date = new Date();
                date.setDate(date.getDate() + index);
                const dateKey = date.toDateString();
                const dayItems = scheduledItems.filter((item) => new Date(item.scheduled_for ?? "").toDateString() === dateKey);
                const releaseOnDay = releases.filter((release) => release.release_date && new Date(release.release_date).toDateString() === dateKey);
                return (
                  <section className={styles.dayColumn} key={dateKey}>
                    <header><span>{date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}</span><strong>{date.getDate()}</strong></header>
                    <div className={styles.dayContent}>
                      {releaseOnDay.map((release) => <article className={styles.calendarRelease} key={release.id}><span>RELEASE</span><strong>{release.release_title || "Release"}</strong></article>)}
                      {dayItems.map((item) => <article className={styles.calendarItem} key={item.id}><span>{item.platform}</span><strong>{item.title}</strong><small>{new Date(item.scheduled_for ?? "").toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</small></article>)}
                      {!dayItems.length && !releaseOnDay.length && <button className={styles.openDay} onClick={() => { setContentDate(date.toISOString().slice(0, 16)); setSection("content"); }}>Open space<br /><span>＋ Fill it</span></button>}
                    </div>
                  </section>
                );
              })}
            </div>

            <section className={styles.calendarInsight}>
              <span>✦</span>
              <div><strong>Artist OS sees the gaps.</strong><p>{scheduledItems.length ? "You have " + scheduledItems.length + " upcoming scheduled content item" + (scheduledItems.length === 1 ? "." : "s.") : "Nothing is scheduled yet. Build the first week around the active release instead of posting at random."}</p></div>
              <button onClick={() => { setAskInput("Build my content plan for the next seven days around " + activeTitle); setSection("ai"); }}>Build my week →</button>
            </section>
          </div>
        )}

        {section === "campaigns" && (
          <div className={styles.page}>
            <section className={styles.pageIntro}><span className={styles.eyebrow}>RELEASE</span><h1>Creative missions, not tickets.</h1><p>Every campaign should have a clear objective, current phase, content story, and next move.</p></section>

            <form className={styles.campaignCreator} onSubmit={(event) => void addCampaign(event)}>
              <label><span>Campaign</span><input value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} placeholder="TALK BOUT rollout" required /></label>
              <label><span>Mission</span><input value={campaignGoal} onChange={(event) => setCampaignGoal(event.target.value)} placeholder="Build awareness, drive pre-saves, introduce the visual world…" /></label>
              <button>Create mission</button>
            </form>

            <div className={styles.campaignGrid}>
              {campaigns.map((campaign) => {
                const related = pipelineItems.filter((item) => item.campaign_id === campaign.id);
                return (
                  <article className={campaign.status === "active" ? styles.campaignActive : styles.campaignCard} key={campaign.id}>
                    <div className={styles.campaignVisual}><span>{titleMonogram(campaign.title)}</span><small>{campaign.phase}</small></div>
                    <div className={styles.campaignBody}>
                      <span className={styles.eyebrow}>{campaign.status === "active" ? "ACTIVE MISSION" : campaign.status}</span>
                      <h2>{campaign.title}</h2>
                      <p>{campaign.goal || "Add a campaign objective so Artist OS can prioritize the right work."}</p>
                      <div className={styles.campaignStats}><span><strong>{related.length}</strong> content</span><span><strong>{tasks.filter((task) => task.campaign_id === campaign.id && task.status !== "done").length}</strong> open tasks</span></div>
                      <div className={styles.campaignPhases}>{["Tease", "Reveal", "Anticipation", "Release", "Extend"].map((phase) => <span key={phase} className={phase.toLowerCase() === campaign.phase.replace("-", " ") ? styles.phaseActive : ""}>{phase}</span>)}</div>
                      {campaign.status !== "active" && <button onClick={() => void activateCampaign(campaign)}>Make active</button>}
                    </div>
                  </article>
                );
              })}
              {!campaigns.length && <article className={styles.emptyStateWide}><span>◎</span><h3>Give the release a mission.</h3><p>Create one campaign and Artist OS will have a single context for tasks, content, links, and recommendations.</p></article>}
            </div>
          </div>
        )}

        {section === "ideas" && (
          <div className={styles.page}>
            <section className={styles.pageIntro}><span className={styles.eyebrow}>CREATE</span><h1>Idea Vault</h1><p>Catch the thought first. Organize it later. Nothing good should disappear because you were moving too fast.</p></section>

            <form className={styles.ideaCapture} onSubmit={(event) => void addIdea(event)}>
              <span>✦</span>
              <textarea value={ideaInput} onChange={(event) => setIdeaInput(event.target.value)} placeholder="Capture something before you lose it…" />
              <div><button type="button">Voice</button><button type="button">Image</button><button disabled={!ideaInput.trim()}>Save idea ↗</button></div>
            </form>

            <div className={styles.ideaFilters}><button className={styles.activeFilter}>All ideas</button><button>Content</button><button>Visuals</button><button>Music</button><button>Campaigns</button><button>Growth</button></div>

            <div className={styles.ideaMasonry}>
              {ideaItems.map((idea, index) => (
                <article className={styles.ideaCard} key={idea.id}>
                  <span className={styles.ideaType}>{index % 2 === 0 ? "CONTENT" : "VISUAL"}</span>
                  <p>{idea.caption || idea.title}</p>
                  <div><button onClick={() => { setContentTitle(idea.title); setSection("content"); }}>Turn into post</button><button onClick={() => { setAskInput("Expand this idea: " + (idea.caption || idea.title)); setSection("ai"); }}>Expand ✦</button></div>
                </article>
              ))}
              {!ideaItems.length && <article className={styles.ideaEmpty}><span>✦</span><h3>Your ideas do not need to be organized yet.</h3><p>Drop the thought here. Artist OS can turn it into content, a campaign, or a future release later.</p></article>}
            </div>
          </div>
        )}

        {section === "media" && (
          <div className={styles.page}>
            <section className={styles.pageIntroRow}>
              <div><span className={styles.eyebrow}>CREATE</span><h1>Media Vault</h1><p>Photos, video, artwork, audio, and campaign exports in one visual library.</p></div>
              <Link className={styles.topCreate} href="/dashboard">↑ Add media</Link>
            </section>

            <div className={styles.mediaFilters}><button className={styles.activeFilter}>All</button><button>Photos</button><button>Video</button><button>Artwork</button><button>Audio</button><button>Exports</button></div>
            <div className={styles.mediaGrid}>
              {assets.map((asset) => (
                <article className={styles.mediaCard} key={asset.id}>
                  <div className={styles.mediaThumb}><span>{asset.kind.toUpperCase()}</span></div>
                  <div><strong>{asset.label || asset.original_name}</strong><span>{asset.kind} · {formatDate(asset.created_at)}</span></div>
                  <button onClick={() => { setContentTitle(asset.label || asset.original_name); setSection("content"); }}>Use in content ↗</button>
                </article>
              ))}
              {!assets.length && <article className={styles.emptyStateWide}><span>▧</span><h3>Your creative library starts with the files you already have.</h3><p>Add artwork, audio, photos, or video through the connected Music OS library.</p><Link href="/dashboard">Open asset library →</Link></article>}
            </div>
          </div>
        )}

        {section === "audience" && (
          <div className={styles.page}>
            <section className={styles.pageIntro}><span className={styles.eyebrow}>GROW</span><h1>Audience, without ten dashboards.</h1><p>Platform integrations will summarize the audience signal first, then show the detail only when it changes a decision.</p></section>
            <div className={styles.channelGrid}>
              {["Instagram", "TikTok", "YouTube", "Spotify", "Apple Music", "Threads"].map((channel) => (
                <article className={styles.channelCard} key={channel}><div className={styles.channelIcon}>{channel.slice(0, 2).toUpperCase()}</div><div><h3>{channel}</h3><p>Not connected yet</p></div><button>Connect</button></article>
              ))}
            </div>
            <section className={styles.emptyAnalytics}><span>◉</span><h2>Connect one channel first.</h2><p>Artist OS will summarize connection health, recent performance, strongest format, growth trend, and the next move without turning this into another analytics dashboard.</p></section>
          </div>
        )}

        {section === "analytics" && (
          <div className={styles.page}>
            <section className={styles.pageIntro}><span className={styles.eyebrow}>GROW</span><h1>Decisions before charts.</h1><p>Analytics should tell you what is working, what changed, and what to do next.</p></section>

            <div className={styles.decisionGrid}>
              <article><span className={styles.eyebrow}>WHAT'S WORKING</span><h2>{pipelineItems.filter((item) => item.status === "published").length ? "Published content is building your first performance baseline." : "Publish enough content to establish a real baseline."}</h2><p>Artist OS will never invent performance data. Platform metrics appear here only after a real integration supplies them.</p></article>
              <article><span className={styles.eyebrow}>WHAT'S CHANGING</span><h2>{activity[0]?.summary || "There is not enough connected performance data yet."}</h2><p>{activity[0] ? "Latest recorded workspace activity." : "Connect social and link analytics to unlock trend detection."}</p></article>
              <article><span className={styles.eyebrow}>WHAT TO DO NEXT</span><h2>{recommendations[0]?.title}</h2><p>{recommendations[0]?.body}</p><button onClick={() => setSection(recommendations[0]?.section ?? "command")}>Take action →</button></article>
            </div>

            <section className={styles.analyticsFoundation}>
              <div className={styles.sectionHead}><div><span className={styles.eyebrow}>FOUNDATION</span><h2>What Artist OS can measure now</h2></div></div>
              <div className={styles.metricStrip}>
                <div><strong>{pipelineItems.length}</strong><span>Content records</span></div>
                <div><strong>{pipelineItems.filter((item) => item.status === "published").length}</strong><span>Published</span></div>
                <div><strong>{visibleLinks.length}</strong><span>Live hub links</span></div>
                <div><strong>{campaigns.length}</strong><span>Campaigns</span></div>
              </div>
            </section>
          </div>
        )}

        {section === "hub" && (
          <div className={styles.hubEditorPage}>
            <header className={styles.hubEditorTop}>
              <div><span className={styles.eyebrow}>PRESENCE</span><h1>Artist Hub</h1><p>Your public artist world should feel like a mini official site, not a list of buttons.</p></div>
              <div><Link href="/jocyn" target="_blank">Open live hub ↗</Link><button onClick={() => void saveBrand()}>Save changes</button></div>
            </header>

            <div className={styles.hubEditor}>
              <aside className={styles.hubSections}>
                <span className={styles.eyebrow}>SECTIONS</span>
                {["Hero", "Current Release", "Listen", "Watch", "Latest Content", "Music", "About", "Social / Email"].map((item, index) => <button className={index < 4 ? styles.hubSectionActive : ""} key={item}><span>⋮⋮</span>{item}<small>{index < 4 ? "Visible" : "Add"}</small></button>)}
              </aside>

              <section className={styles.hubCanvas}>
                <div className={styles.previewToolbar}><span>LIVE PREVIEW</span><div><button>Desktop</button><button className={styles.activeFilter}>Mobile</button></div></div>
                <div className={styles.phonePreview}>
                  <div className={styles.publicHero}><span>{brand?.stylized_name || "JO₵YN"}</span><small>ARTIST / NEW ORLEANS</small></div>
                  <div className={styles.publicRelease}><small>CURRENT RELEASE</small><strong>{activeTitle}</strong><span>{activeRelease?.release_date ? formatCompactDate(activeRelease.release_date) : "COMING SOON"}</span><button>LISTEN</button></div>
                  <div className={styles.publicLinks}>{visibleLinks.slice(0, 5).map((link) => <span key={link.id}>{link.label}<b>↗</b></span>)}</div>
                  <div className={styles.publicFooter}>{brand?.stylized_name || "JO₵YN"}</div>
                </div>
              </section>

              <aside className={styles.hubSettings}>
                <span className={styles.eyebrow}>SETTINGS</span>
                <label>Bio<textarea value={brandDraft.bio} onChange={(event) => setBrandDraft({ ...brandDraft, bio: event.target.value })} /></label>
                <label>Audience<textarea value={brandDraft.audience} onChange={(event) => setBrandDraft({ ...brandDraft, audience: event.target.value })} /></label>
                <label>Voice<textarea value={brandDraft.voice} onChange={(event) => setBrandDraft({ ...brandDraft, voice: event.target.value })} /></label>
                <label>Visual direction<textarea value={brandDraft.visual_direction} onChange={(event) => setBrandDraft({ ...brandDraft, visual_direction: event.target.value })} /></label>
                <form className={styles.hubLinkForm} onSubmit={(event) => void addLink(event)}>
                  <span>ADD LINK</span>
                  <input value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="LISTEN TO…" required />
                  <input type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://…" required />
                  <button>Add link</button>
                </form>
                <div className={styles.hubLinkList}>{links.map((link) => <button key={link.id} onClick={() => void toggleLink(link)}><span>{link.label}</span><small>{link.is_visible ? "Visible" : "Hidden"}</small></button>)}</div>
              </aside>
            </div>
          </div>
        )}

        {section === "ai" && (
          <div className={styles.aiPage}>
            <section className={styles.aiManagerHeader}>
              <span className={styles.aiOrb}>✦</span>
              <div><span className={styles.eyebrow}>INTELLIGENCE</span><h1>Artist OS Manager</h1><p>One contextual manager across releases, campaigns, content, tasks, and your public presence.</p></div>
            </section>

            <div className={styles.aiManagerGrid}>
              <section className={styles.aiBrief}>
                <span className={styles.eyebrow}>BRIEF ME</span>
                <h2>{activeTitle}</h2>
                <p>{activeCampaign?.goal || "No active campaign goal has been set yet."}</p>
                <div className={styles.briefFacts}><span><strong>{openTasks.length}</strong> open tasks</span><span><strong>{scheduledItems.length}</strong> scheduled</span><span><strong>{countdown ?? "—"}</strong> days to release</span></div>
                <button onClick={() => setAskInput("Brief me on what matters most right now.")}>Generate full brief</button>
              </section>

              <section className={styles.aiActionsPanel}>
                <span className={styles.eyebrow}>RECOMMENDED ACTIONS</span>
                {recommendations.map((recommendation) => <button key={recommendation.title} onClick={() => setSection(recommendation.section)}><span>✦</span><div><strong>{recommendation.title}</strong><small>{recommendation.body}</small></div><b>↗</b></button>)}
              </section>
            </div>

            <section className={styles.aiConversation}>
              <div className={styles.conversationFeed}>
                {!messages.length && <div className={styles.aiWelcome}><span>✦</span><h2>Talk normally.</h2><p>“What should I focus on this week?” “Build my rollout.” “I finished the master.” “Turn this idea into content.”</p></div>}
                {messages.slice(-24).map((message) => (
                  <article className={message.role === "user" ? styles.userBubble : styles.aiBubble} key={message.id}>
                    <span>{message.role === "user" ? "YOU" : "ARTIST OS"}</span>
                    <p>{message.body}</p>
                  </article>
                ))}
              </div>
              <form className={styles.aiComposer} onSubmit={(event) => void askArtistOs(event)}>
                <textarea value={askInput} onChange={(event) => setAskInput(event.target.value)} placeholder="What are you trying to create, promote, release, or figure out?" />
                <button disabled={busy || !askInput.trim()}>{busy ? "Working…" : "Send ↗"}</button>
              </form>
            </section>
          </div>
        )}
      </section>

      <nav className={styles.mobileNav}>
        <button className={section === "command" ? styles.mobileActive : ""} onClick={() => setSection("command")}><span>⌂</span>Today</button>
        <button onClick={() => setCreateOpen(true)}><span>＋</span>Create</button>
        <button className={section === "content" ? styles.mobileActive : ""} onClick={() => setSection("content")}><span>▣</span>Content</button>
        <button className={section === "ai" ? styles.mobileActive : ""} onClick={() => setSection("ai")}><span>✦</span>AI</button>
        <button onClick={() => setCommandOpen(true)}><span>•••</span>More</button>
      </nav>

      {createOpen && (
        <div className={styles.overlay} onClick={() => setCreateOpen(false)}>
          <section className={styles.createModal} onClick={(event) => event.stopPropagation()}>
            <header><div><span className={styles.eyebrow}>＋ CREATE</span><h2>What do you want to make?</h2></div><button onClick={() => setCreateOpen(false)}>×</button></header>
            <div className={styles.createGrid}>
              {QUICK_CREATE.map((action) => <button key={action.id} onClick={() => quickCreate(action.id)}><span>{action.icon}</span><div><strong>{action.label}</strong><small>{action.detail}</small></div><b>↗</b></button>)}
            </div>
            <button className={styles.startIdea} onClick={() => { setCreateOpen(false); setSection("ai"); }}>
              <span>✦</span>
              <div><strong>Start from my idea</strong><small>Describe anything. Artist OS will route it to the right workflow.</small></div>
              <b>→</b>
            </button>
          </section>
        </div>
      )}

      {commandOpen && (
        <div className={styles.overlay} onClick={() => setCommandOpen(false)}>
          <section className={styles.commandPalette} onClick={(event) => event.stopPropagation()}>
            <div className={styles.commandInput}><span>⌕</span><input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Create post, open release, find artwork, ask AI…" /><kbd>ESC</kbd></div>
            <div className={styles.commandResults}>
              {commandItems.map((item) => <button key={item.label} onClick={() => navigate(item.section)}><span>↗</span><strong>{item.label}</strong></button>)}
            </div>
          </section>
        </div>
      )}

      {assistantOpen && section !== "ai" && (
        <aside className={styles.assistantDrawer}>
          <header><div><span className={styles.eyebrow}>✦ ARTIST OS</span><h2>Your contextual manager</h2></div><button onClick={() => setAssistantOpen(false)}>×</button></header>
          <div className={styles.drawerFeed}>
            {!messages.length && <div className={styles.aiWelcome}><span>✦</span><h3>What are we doing next?</h3><p>Ask about the release, tasks, content, or what matters today.</p></div>}
            {messages.slice(-10).map((message) => <article className={message.role === "user" ? styles.userBubble : styles.aiBubble} key={message.id}><span>{message.role === "user" ? "YOU" : "ARTIST OS"}</span><p>{message.body}</p></article>)}
          </div>
          <form className={styles.drawerComposer} onSubmit={(event) => void askArtistOs(event)}><textarea value={askInput} onChange={(event) => setAskInput(event.target.value)} placeholder="Ask Artist OS…" /><button disabled={!askInput.trim() || busy}>↗</button></form>
        </aside>
      )}
    </main>
  );
}
