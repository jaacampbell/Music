import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  question: z.string().trim().min(1).max(4000),
  brandId: z.string().uuid(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    body: z.string().max(8000)
  })).max(12).default([])
});

type Row = Record<string, unknown>;
type ActionLog = { type: string; summary: string; entityId?: string };

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function taskScore(target: string, title: string): number {
  const a = normalize(target);
  const b = normalize(title);
  if (!a || !b) return 0;
  if (a.includes(b) || b.includes(a)) return 1;
  const targetWords = new Set(a.split(" ").filter((word) => word.length > 2));
  const titleWords = b.split(" ").filter((word) => word.length > 2);
  if (!titleWords.length) return 0;
  const hits = titleWords.filter((word) => targetWords.has(word)).length;
  return hits / titleWords.length;
}

function completionTarget(question: string): string | null {
  const patterns = [
    /^(?:mark|set)\s+(.+?)\s+(?:as\s+)?(?:done|complete|completed)$/i,
    /^(?:i|we)\s+(?:finished|completed|did|wrapped|handled)\s+(.+)$/i,
    /^(.+?)\s+is\s+(?:done|complete|completed)$/i
  ];
  for (const pattern of patterns) {
    const match = question.trim().match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function createTaskTarget(question: string): string | null {
  const patterns = [
    /^(?:add|create|make)\s+(?:a\s+)?task(?:\s+to)?\s+(.+)$/i,
    /^remind\s+me\s+to\s+(.+)$/i,
    /^(?:i|we)\s+need\s+to\s+(.+)$/i
  ];
  for (const pattern of patterns) {
    const match = question.trim().match(pattern);
    if (match?.[1]) return match[1].trim().replace(/[.!]+$/, "");
  }
  return null;
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    mode: "artist-management",
    canMutateTasks: true
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: "Sign in to use Artist OS." }, { status: 401 });

  const headers = {
    apikey: key,
    Authorization: "Bearer " + token,
    "Content-Type": "application/json"
  };

  const verified = await fetch(url + "/auth/v1/user", {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  }).catch(() => null);

  if (!verified?.ok) return NextResponse.json({ error: "Your session could not be verified. Sign in again." }, { status: 401 });
  const user = await verified.json() as { id: string };

  const raw = await request.text();
  if (raw.length > 60000) return NextResponse.json({ error: "Assistant request is too large." }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid assistant request." }, { status: 400 });

  const { question, brandId, history } = parsed.data;

  const read = async (table: string, query: string): Promise<Row[]> => {
    const response = await fetch(url + "/rest/v1/" + table + "?" + query, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error("Artist OS context unavailable.");
    return await response.json() as Row[];
  };

  const write = async (table: string, method: "POST" | "PATCH", query: string, value: unknown): Promise<Row[]> => {
    const response = await fetch(url + "/rest/v1/" + table + (query ? "?" + query : ""), {
      method,
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify(value),
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(detail || "Artist OS update failed.");
    }
    const text = await response.text();
    return text ? JSON.parse(text) as Row[] : [];
  };

  try {
    const brands = await read("artist_brands", "id=eq." + brandId + "&user_id=eq." + user.id + "&select=*&limit=1");
    if (!brands.length) return NextResponse.json({ error: "Brand unavailable or not owned by you." }, { status: 403 });

    let [tasks, campaigns, content, links, projects, releases] = await Promise.all([
      read("artist_tasks", "brand_id=eq." + brandId + "&user_id=eq." + user.id + "&select=*&order=created_at.desc&limit=80"),
      read("artist_campaigns", "brand_id=eq." + brandId + "&user_id=eq." + user.id + "&select=*&order=updated_at.desc&limit=30"),
      read("artist_content_items", "brand_id=eq." + brandId + "&user_id=eq." + user.id + "&select=*&order=scheduled_for.asc.nullslast&limit=50"),
      read("artist_links", "brand_id=eq." + brandId + "&user_id=eq." + user.id + "&select=*&order=position.asc&limit=30"),
      read("music_projects", "user_id=eq." + user.id + "&select=id,title,status,readiness,updated_at&order=updated_at.desc&limit=40"),
      read("music_releases", "user_id=eq." + user.id + "&select=project_id,release_title,artist_name,release_date,distributor,checklist,updated_at&order=release_date.asc.nullslast&limit=40")
    ]);

    const actions: ActionLog[] = [];
    const completion = completionTarget(question);

    if (completion) {
      const openTasks = tasks.filter((task) => task.status !== "done" && task.status !== "archived");
      const ranked = openTasks
        .map((task) => ({ task, score: taskScore(completion, String(task.title ?? "")) }))
        .filter((item) => item.score >= 0.55)
        .sort((a, b) => b.score - a.score);

      if (ranked.length && (ranked[0].score === 1 || ranked.length === 1 || ranked[0].score - ranked[1].score >= 0.2)) {
        const match = ranked[0].task;
        const rows = await write(
          "artist_tasks",
          "PATCH",
          "id=eq." + match.id + "&user_id=eq." + user.id,
          { status: "done", completed_at: new Date().toISOString() }
        );
        const updated = rows[0] ?? match;
        actions.push({ type: "task_completed", summary: "Completed: " + String(updated.title), entityId: String(updated.id) });
        await write("artist_activity", "POST", "", {
          brand_id: brandId,
          user_id: user.id,
          entity_type: "task",
          entity_id: updated.id,
          action: "completed",
          summary: "Completed " + String(updated.title),
          metadata: { source: "assistant-chat" }
        });
        tasks = tasks.map((task) => task.id === updated.id ? updated : task);
      } else if (ranked.length > 1) {
        actions.push({ type: "needs_clarification", summary: "I found more than one task that could match that completion." });
      } else {
        actions.push({ type: "needs_clarification", summary: "I could not find a matching open task to complete." });
      }
    }

    const createTarget = createTaskTarget(question);
    if (!completion && createTarget) {
      const duplicate = tasks.find((task) =>
        task.status !== "done" &&
        task.status !== "archived" &&
        normalize(String(task.title ?? "")) === normalize(createTarget)
      );
      if (duplicate) {
        actions.push({ type: "task_exists", summary: "Already on the list: " + String(duplicate.title), entityId: String(duplicate.id) });
      } else {
        const rows = await write("artist_tasks", "POST", "", {
          brand_id: brandId,
          user_id: user.id,
          title: createTarget.slice(0, 220),
          description: "",
          status: "todo",
          priority: "normal",
          source: "assistant-chat",
          created_by: "assistant"
        });
        const created = rows[0];
        if (created) {
          tasks = [created, ...tasks];
          actions.push({ type: "task_created", summary: "Added task: " + String(created.title), entityId: String(created.id) });
          await write("artist_activity", "POST", "", {
            brand_id: brandId,
            user_id: user.id,
            entity_type: "task",
            entity_id: created.id,
            action: "created",
            summary: "Created " + String(created.title),
            metadata: { source: "assistant-chat" }
          });
        }
      }
    }

    await write("artist_agent_messages", "POST", "", {
      brand_id: brandId,
      user_id: user.id,
      role: "user",
      body: question,
      action_log: []
    });

    const activeTasks = tasks
      .filter((task) => task.status !== "done" && task.status !== "archived")
      .sort((a, b) => {
        const priority = { urgent: 0, high: 1, normal: 2, low: 3 };
        const aKey = priority[String(a.priority) as keyof typeof priority] ?? 9;
        const bKey = priority[String(b.priority) as keyof typeof priority] ?? 9;
        if (aKey !== bKey) return aKey - bKey;
        const aDue = a.due_at ? new Date(String(a.due_at)).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.due_at ? new Date(String(b.due_at)).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      });

    const actionText = actions.map((action) => action.summary).join(" ");
    const fallback = () => {
      const next = activeTasks.slice(0, 3).map((task, index) => (index + 1) + ". " + String(task.title)).join("\n");
      const prefix = actionText ? actionText + "\n\n" : "";
      if (next) return prefix + "Next up:\n" + next;
      return prefix + "You do not have any open Artist OS tasks yet. Tell me what needs to happen next and I can add it.";
    };

    let answer = fallback();
    let model = "artist-os-guided";

    if (process.env.OPENAI_API_KEY) {
      const instructions = [
        "You are Artist OS, the private management assistant for a recording artist and creative brand.",
        "Act as an executive producer, release manager, A&R coordinator, content strategist, and task manager.",
        "Use only the verified workspace context supplied by the server. Never claim a task, release, post, file, booking, or platform action happened unless the context or action log proves it.",
        "The application may already have created or completed a task before you answer. Acknowledge those action-log changes plainly.",
        "When asked what to do next, prioritize blockers, urgent/high-priority work, release deadlines, current campaigns, and scheduled content.",
        "Keep answers concise and operational. Prefer a short recommendation plus the next 1-3 actions.",
        "Do not overwhelm the user with a long checklist unless they ask for one.",
        "Do not invent social metrics, streaming numbers, rights facts, clearances, dates, or external-platform status.",
        "JO₵YN is pronounced Joe-sin. Preserve the stylized artist name exactly when it appears in context."
      ].join("\n");

      try {
        const ai = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + process.env.OPENAI_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: process.env.OPENAI_ARTIST_MODEL || process.env.OPENAI_MUSIC_MODEL || "gpt-5-mini",
            store: false,
            max_output_tokens: 1200,
            instructions,
            input: JSON.stringify({
              question,
              brand: brands[0],
              actions,
              tasks: activeTasks.slice(0, 30),
              campaigns,
              content,
              links,
              projects,
              releases,
              conversation: history
            })
          }),
          signal: AbortSignal.timeout(25000)
        });

        const payload = await ai.json() as {
          output_text?: string;
          output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
        };
        const output = payload.output_text ?? payload.output
          ?.flatMap((item) => item.content ?? [])
          .filter((item) => item.type === "output_text")
          .map((item) => item.text ?? "")
          .join("\n");
        if (ai.ok && output?.trim()) {
          answer = output.trim();
          model = process.env.OPENAI_ARTIST_MODEL || process.env.OPENAI_MUSIC_MODEL || "gpt-5-mini";
        }
      } catch {
        answer = fallback();
      }
    }

    await write("artist_agent_messages", "POST", "", {
      brand_id: brandId,
      user_id: user.id,
      role: "assistant",
      body: answer,
      model,
      action_log: actions
    });

    return NextResponse.json({ answer, model, actions });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Artist OS could not load the workspace."
    }, { status: 503 });
  }
}
