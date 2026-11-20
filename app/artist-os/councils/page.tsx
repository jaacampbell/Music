"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser, getSessionAccessToken, isCloudConfigured, supabaseRest } from "@/lib/persistence/supabase-rest";
import styles from "./councils.module.css";

type Board = { id: string; name: string; description: string; advisors: Array<{ id: string; name: string }> };
type Perspective = { id: string; name: string; analysis: string; status: "completed" | "failed"; error?: string };
type Review = {
  id: string; board_id: string; question: string; context: string; project_id: string | null;
  status: "running" | "completed" | "incomplete";
  perspectives: Perspective[]; verdict: string | null; model: string; created_at: string;
  request_key: string;
};
type Project = { id: string; title: string; status?: string };
const fmt = (value: string) => new Date(value).toLocaleString(undefined, {
  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
});

export default function CouncilsPage(): React.JSX.Element {
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardId, setBoardId] = useState("music-ar");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selected, setSelected] = useState<Review | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Connecting your private workspace…");
  const [busy, setBusy] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const requestKey = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const token = await getSessionAccessToken();
    if (!token) throw new Error("Sign in to Music OS to access your councils.");
    const response = await fetch("/api/councils", {
      headers: { Authorization: "Bearer " + token }, cache: "no-store"
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not load council history.");
    setBoards(payload.boards || []);
    setReviews(payload.reviews || []);
    setModelReady(Boolean(payload.modelConfigured));
    setConnected(true);
    setStatus(payload.modelConfigured
      ? "Private councils connected · owner approval required"
      : "Council records connected · live model not configured");
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        if (!isCloudConfigured()) throw new Error("Music OS cloud configuration is required.");
        const user = await getCurrentUser();
        if (!user) throw new Error("Sign in to Music OS before opening your councils.");
        await refresh();
        const rows = await supabaseRest<Project[]>("music_projects", {
          query: "select=id,title,status&user_id=eq." + user.id + "&order=updated_at.desc&limit=50"
        }).catch(() => []);
        if (live) setProjects(rows);
      } catch (cause) {
        if (live) {
          setError(cause instanceof Error ? cause.message : "Council workspace unavailable.");
          setStatus("Setup required");
        }
      }
    })();
    return () => { live = false; };
  }, [refresh]);

  const onEdit = () => {
    requestKey.current = null;
    setError("");
  };

  const run = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !connected || !modelReady || question.trim().length < 12) return;
    setBusy(true); setError("");
    setStatus("Advisors are reviewing independently. No actions will be executed.");
    if (!requestKey.current) requestKey.current = crypto.randomUUID();
    try {
      const token = await getSessionAccessToken();
      if (!token) throw new Error("Your session expired. Sign in again.");
      const response = await fetch("/api/councils", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId, question: question.trim(), context: context.trim(),
          projectId: projectId || undefined, requestKey: requestKey.current
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Review could not be completed.");
      setSelected(payload.review as Review);
      requestKey.current = null;
      await refresh();
      setStatus(payload.review.status === "completed"
        ? "Review saved · recommendation awaiting your decision"
        : "Partial review saved · chairman verdict withheld");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review unavailable.");
      setStatus("Review needs attention");
    } finally { setBusy(false); }
  };

  const currentBoard = boards.find(board => board.id === boardId);
  const selectedBoard = selected && boards.find(board => board.id === selected.board_id);
  return (
    <main className={styles.shell}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/artist-os" className={styles.back}>← ARTIST OS</Link>
        <div className={styles.brand}>JO₵YN <span>/</span> INTELLIGENCE</div>
        <span className={styles.private}>PRIVATE ADVISORY WORKSPACE</span>
      </header>
      <div className={styles.content}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>INTELLIGENCE SYSTEM  /  01</p>
          <h1>Your councils.<br /><em>Different minds. Better decisions.</em></h1>
          <p className={styles.lede}>
            Five independent specialists critique your decision. A chair weighs their disagreements
            and recommends a next move. You retain final authority.
          </p>
          <div className={styles.status} role="status"><span className={styles.dot} /> {status}</div>
        </section>

        <section className={styles.layout} aria-label="Council review workspace">
          <div className={styles.left}>
            <div className={styles.sectionHeading}><span>01 / SELECT YOUR BOARD</span><small>8 specialized councils</small></div>
            <div className={styles.boards}>
              {boards.map((board) => (
                <button key={board.id} type="button"
                  className={boardId === board.id ? styles.boardActive : styles.board}
                  aria-pressed={boardId === board.id}
                  onClick={() => { setBoardId(board.id); onEdit(); }}>
                  <strong>{board.name}</strong><small>{board.description}</small>
                </button>
              ))}
              {!boards.length && <p className={styles.empty}>The private board catalog will load once the database is ready.</p>}
            </div>
            <div className={styles.memberStrip}>
              <p>SEATED ADVISORS</p>
              <div>{currentBoard?.advisors.map((advisor,i) => (
                <span key={advisor.id} title={advisor.name}>{String(i+1).padStart(2,"0")}. {advisor.name}</span>
              ))}</div>
              <small>Independent critiques → Chairman synthesis → Your final decision</small>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.sectionHeading}><span>02 / SUBMIT A DECISION</span><small>No automatic execution</small></div>
            <form className={styles.form} onSubmit={run}>
              <label htmlFor="council-question">WHAT SHOULD THE COUNCIL DECIDE?</label>
              <textarea id="council-question" rows={3} maxLength={2000}
                placeholder="Is BRING ANOTHER ONE ready to release, or what still needs work?"
                value={question} onChange={e => {setQuestion(e.target.value);onEdit();}} required />
              <label htmlFor="council-context">YOUR EVIDENCE, CONSTRAINTS & CURRENT THINKING</label>
              <textarea id="council-context" rows={5} maxLength={5500}
                placeholder="Share the current mix status, goals, budget, deadlines, audience and what you are leaning toward. Distinguish facts from assumptions."
                value={context} onChange={e => {setContext(e.target.value);onEdit();}} />
              <label htmlFor="council-project">LINK AN EXISTING MUSIC PROJECT (OPTIONAL)</label>
              <select id="council-project" value={projectId} onChange={e => {setProjectId(e.target.value);onEdit();}}>
                <option value="">No linked project · use my brief</option>
                {projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
              </select>
              <div className={styles.footnote}>Text and verified project metadata only. No listening or audio quality measurement occurs here. Each run makes up to six AI calls and is saved to your private history.</div>
              <button className={styles.runButton} disabled={busy || !connected || !modelReady || question.trim().length < 12} type="submit">
                {busy ? "COUNCIL IN SESSION…" : "CONVENE THE COUNCIL"} <span>↗</span>
              </button>
              {error && <div className={styles.error} role="alert">{error} <Link href="/login">Sign in</Link></div>}
            </form>
          </div>
        </section>

        <section className={styles.results} aria-label="Council findings">
          <div className={styles.sectionHeading}><span>03 / COUNCIL REPORT</span><small>{selected ? fmt(selected.created_at) : "Awaiting first review"}</small></div>
          {selected ? (
            <>
              <div className={styles.reportTitle}>
                <div><p className={styles.eyebrow}>{selectedBoard?.name || selected.board_id}</p><h2>{selected.question}</h2></div>
                <span className={styles.reportStatus}>{selected.status === "completed" ? "REVIEW COMPLETE" : "REVIEW INCOMPLETE"}</span>
              </div>
              <div className={styles.advisors}>
                {selected.perspectives.map((opinion,i) => (
                  <article className={styles.advisorCard} key={opinion.id}>
                    <span className={styles.ordinal}>{String(i+1).padStart(2,"0")}</span>
                    <div><h3>{opinion.name}</h3><p>{opinion.status === "completed" ? opinion.analysis : "Advisor unavailable. No opinion was invented."}</p></div>
                  </article>
                ))}
              </div>
              <article className={styles.chair}>
                <p className={styles.eyebrow}>THE CHAIRMAN / FINAL SYNTHESIS</p>
                <h3>{selected.status === "completed" ? "The recommendation." : "No final verdict issued."}</h3>
                <p>{selected.verdict || "One or more advisors failed or the chair was unavailable. This review cannot be treated as a completed council recommendation. You can start a fresh review after checking the issue."}</p>
                <div className={styles.footnote}>Advisory only. No ticket, post, release, payment or code change is approved or executed by this report.</div>
              </article>
            </>
          ) : (
            <div className={styles.emptyReport}>
              <span>◇</span><p>Independent perspectives and the chairman’s verdict will appear here.</p>
            </div>
          )}
        </section>

        <section className={styles.history}>
          <div className={styles.sectionHeading}><span>04 / DECISION ARCHIVE</span><small>{reviews.length} saved reviews</small></div>
          <div className={styles.historyGrid}>
            {reviews.map((review) => (
              <button key={review.id} type="button" className={selected?.id === review.id ? styles.historyActive : styles.historyItem}
                onClick={() => { setSelected(review); window.scrollTo({ top: 690, behavior: "smooth" }); }}>
                <small>{fmt(review.created_at)} · {review.board_id}</small>
                <strong>{review.question}</strong>
                <span>{review.status === "completed" ? "COMPLETE" : review.status === "running" ? "RUNNING / VERIFY" : "INCOMPLETE"} ↗</span>
              </button>
            ))}
            {!reviews.length && <p className={styles.empty}>Your completed and incomplete council reviews will be kept here once saved.</p>}
          </div>
        </section>
      </div>
      <footer className={styles.footer}>JO₵YN ARTIST OS · PRIVATE PRODUCTION INTELLIGENCE · ALL RELEASE & FINANCIAL DECISIONS REQUIRE OWNER APPROVAL</footer>
    </main>
  );
}