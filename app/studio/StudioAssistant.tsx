"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { loadActiveProjectId, loadStoredProjects } from "@/lib/browser-project-storage";
import { getSessionAccessToken, getValidSession, isCloudConfigured } from "@/lib/persistence/supabase-rest";
import type { Project } from "@/lib/types";

type Message = { role: "user" | "assistant"; text: string };
type AssistantResponse = { answer?: string; model?: string; warning?: string; error?: string };

const QUICK_PROMPTS = [
  "What should I work on next?",
  "How can I make this song hit harder?",
  "Review the hook and replay value.",
  "What should I fix before release?"
];

function buildContext(project: Project, userId: string): Record<string, unknown> {
  return {
    project: {
      user_id: userId,
      id: project.id,
      title: project.title,
      brief: project.brief,
      status: project.status,
      songDna: project.songDna,
      liveAnalysis: project.liveAnalysis ?? null,
      sourceAudio: project.sourceAudio ?? null,
      mixNotes: project.mixNotes,
      revisionPrompt: project.revisionPrompt,
      exportPlan: project.exportPlan
    },
    versions: project.generations,
    stems: project.stems,
    scorecards: project.scorecards,
    history: project.history.slice(-20),
    promptPack: project.promptPack,
    strategyMap: project.strategyMap
  };
}

export function StudioAssistant(): React.JSX.Element {
  const [project, setProject] = useState<Project | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState<string | null>(null);
  const [status, setStatus] = useState("Choose or create a song project to give TM Assistant full context.");

  useEffect(() => {
    const activeId = loadActiveProjectId();
    const projects = loadStoredProjects();
    setProject((activeId ? projects.find((item) => item.id === activeId) : projects[0]) ?? null);

    if (!isCloudConfigured()) {
      setStatus("Cloud sign-in is not configured on this deployment.");
      return;
    }

    void getValidSession()
      .then((session) => {
        setUserId(session?.user.id ?? null);
        setStatus(session ? "Project-aware assistant ready." : "Sign in to use the project-aware TM Assistant.");
      })
      .catch(() => setStatus("Sign in to use the project-aware TM Assistant."));
  }, []);

  const ready = Boolean(project && userId && !busy);
  const projectLabel = useMemo(() => project?.title ?? "No active project", [project]);

  const ask = async (prompt?: string): Promise<void> => {
    const text = (prompt ?? question).trim();
    if (!text || !project || !userId) return;

    setQuestion("");
    setBusy(true);
    setMessages((current) => [...current, { role: "user", text }]);

    try {
      const token = await getSessionAccessToken();
      const response = await fetch("/api/music-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ question: text, context: buildContext(project, userId) })
      });
      const payload = await response.json().catch(() => ({})) as AssistantResponse;
      if (!response.ok) throw new Error(payload.error ?? `TM Assistant request failed (${response.status}).`);
      setMessages((current) => [...current, { role: "assistant", text: payload.answer ?? "No answer returned." }]);
      setModel(payload.model ?? null);
      setStatus(payload.warning ? `Fallback used: ${payload.warning}` : "TM Assistant used the current project context.");
    } catch (error) {
      setMessages((current) => [...current, {
        role: "assistant",
        text: error instanceof Error ? error.message : "TM Assistant could not complete that request."
      }]);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void ask();
  };

  return (
    <section className="tmAssistant" id="tm-assistant">
      <div className="tmAssistantHead">
        <div>
          <p className="musicStudioKicker">TM ASSISTANT</p>
          <h2>Your development room is built into the studio.</h2>
          <p>Ask about songwriting, arrangement, vocal production, mix priorities, stems, release prep, branding, publishing workflow, or the next move for the current record.</p>
        </div>
        <div className="tmAssistantProject">
          <span>ACTIVE PROJECT</span>
          <strong>{projectLabel}</strong>
          {project ? <Link href={`/?projectId=${project.id}`}>Open song workspace →</Link> : <Link href="/">Create song project →</Link>}
        </div>
      </div>

      <div className="tmAssistantGrid">
        <div className="tmAssistantChat">
          <div className="tmAssistantMessages">
            {messages.length === 0 ? (
              <div className="tmAssistantEmpty">
                <strong>Ask TM what the record needs.</strong>
                <p>{status}</p>
              </div>
            ) : messages.map((message, index) => (
              <article className={`tmMessage ${message.role}`} key={`${message.role}-${index}`}>
                <span>{message.role === "assistant" ? "TM" : "YOU"}</span>
                <p>{message.text}</p>
              </article>
            ))}
          </div>
          <form className="tmAssistantComposer" onSubmit={submit}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              placeholder="Example: What should I change before I record the final vocal?"
              disabled={!project || !userId || busy}
            />
            <div>
              <small>{model ? `Model: ${model}` : status}</small>
              <button type="submit" disabled={!ready || !question.trim()}>{busy ? "Thinking…" : "Ask TM"}</button>
            </div>
          </form>
        </div>

        <aside className="tmAssistantQuick">
          <p className="musicStudioKicker">QUICK DIRECTIONS</p>
          {QUICK_PROMPTS.map((prompt) => (
            <button key={prompt} disabled={!ready} onClick={() => void ask(prompt)}>{prompt}</button>
          ))}
          <Link href="/producer-dna">Open Producer DNA →</Link>
          <Link href="/studio-brain">Open full Studio Brain and personal DNA →</Link>
          <Link href="/stem-agent">Open Stem Director →</Link>
        </aside>
      </div>
    </section>
  );
}
