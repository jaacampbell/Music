"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  getCurrentUser,
  supabaseRest,
  downloadPrivateFile,
} from "@/lib/persistence/supabase-rest";
import type {
  CloudUser,
  MusicProjectRow,
  MusicAssetRow,
  WaveformCommentRow,
} from "@/lib/persistence/types";
import { HANDOFF_LABEL } from "@/lib/tm-vocal/handoff";
import { sanitizeChain } from "@/lib/tm-vocal/chain";
import "../tm-vocal/vocal.css";
export default function SessionDesk() {
  const [user, setUser] = useState<CloudUser | null>(null),
    [projects, setProjects] = useState<MusicProjectRow[]>([]),
    [sessions, setSessions] = useState<MusicAssetRow[]>([]);
  const [active, setActive] = useState<MusicAssetRow | null>(null),
    [assets, setAssets] = useState<MusicAssetRow[]>([]),
    [comments, setComments] = useState<WaveformCommentRow[]>([]);
  const [notice, setNotice] = useState("Loading your private session library…"),
    [busy, setBusy] = useState(false),
    [body, setBody] = useState(""),
    [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(""),
    [settings, setSettings] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null),
    objectUrl = useRef(""),
    generation = useRef(0);
  useEffect(() => {
    let cancelled = false;
    void getCurrentUser()
      .then(async (u) => {
        if (cancelled) return;
        setUser(u);
        if (!u) {
          setNotice("Sign in to review private TM sessions.");
          return;
        }
        const [p, s] = await Promise.all([
          supabaseRest<MusicProjectRow[]>("music_projects", {
            query: "select=*&order=updated_at.desc&limit=100",
          }),
          supabaseRest<MusicAssetRow[]>("music_assets", {
            query:
              "select=*&label=eq." +
              encodeURIComponent(HANDOFF_LABEL) +
              "&order=created_at.desc&limit=100",
          }),
        ]);
        if (cancelled) return;
        setProjects(p);
        setSessions(s);
        setNotice(
          s.length
            ? "Choose a saved session to review its audio, settings and timestamped notes."
            : "No saved TM Vocal sessions yet. Open a song in TM Vocal, load your take, then save to the TM session library.",
        );
      })
      .catch((e) => {
        if (!cancelled)
          setNotice(
            e instanceof Error ? e.message : "Cloud library unavailable.",
          );
      });
    return () => {
      cancelled = true;
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);
  async function open(session: MusicAssetRow) {
    setBusy(true);
    const request = ++generation.current;
    setActive(session);
    setAssets([]);
    setComments([]);
    setSettings("");
    setAudioUrl("");
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = "";
    }
    try {
      const blob = await downloadPrivateFile(session.storage_path);
      const raw = JSON.parse(await blob.text()) as {
        schema?: string;
        projectId?: string;
        assets?: Array<{ id: string }>;
      };
      if (
        raw.schema !== "tm-vocal-session/v1" ||
        raw.projectId !== session.project_id
      )
        throw new Error("Unsupported or mismatched TM session.");
      setSettings(JSON.stringify(raw, null, 2));
      const [a, c] = await Promise.all([
        supabaseRest<MusicAssetRow[]>("music_assets", {
          query: `select=*&project_id=eq.${session.project_id}&order=created_at.desc&limit=500`,
        }),
        supabaseRest<WaveformCommentRow[]>("music_waveform_comments", {
          query: `select=*&project_id=eq.${session.project_id}&order=timestamp_ms.asc&limit=200`,
        }),
      ]);
      if (request !== generation.current) return;
      setAssets(
        a.filter((row) => raw.assets?.some((item) => item.id === row.id)),
      );
      setComments(c);
      setNotice(
        "Session loaded. Files and comments use your existing private song library.",
      );
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Could not load this session.",
      );
    } finally {
      if (request === generation.current) setBusy(false);
    }
  }
  async function play(asset: MusicAssetRow) {
    setBusy(true);
    try {
      const blob = await downloadPrivateFile(asset.storage_path);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);
      setAudioUrl(objectUrl.current);
      setSeconds(0);
      setNotice(asset.label + " loaded. Use the player to review.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not load audio.");
    } finally {
      setBusy(false);
    }
  }
  async function comment() {
    if (
      !active ||
      !user ||
      !body.trim() ||
      !Number.isFinite(seconds) ||
      seconds < 0
    )
      return;
    setBusy(true);
    try {
      const rows = await supabaseRest<WaveformCommentRow[]>(
        "music_waveform_comments",
        {
          method: "POST",
          body: {
            project_id: active.project_id,
            version_id: null,
            user_id: user.id,
            timestamp_ms: Math.round(seconds * 1000),
            kind: "vocal",
            body: body.trim().slice(0, 4000),
          },
        },
      );
      setComments((v) =>
        [...v, ...rows].sort((a, b) => a.timestamp_ms - b.timestamp_ms),
      );
      setBody("");
      setNotice("Timestamped vocal note saved to this song.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Note saving failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="tv">
      <header className="tv-top">
        <Link href="/studio">TM MUSIC STUDIO</Link>
        <nav>
          <Link href="/tm-vocal">TM Vocal</Link>
          <Link href="/dashboard">Song Dashboard</Link>
          <Link href="/login">Account</Link>
        </nav>
      </header>
      <section className="tv-hero">
        <div>
          <p className="tv-kicker">PRIVATE SESSION DESK</p>
          <h1>
            The handoff.
            <br />
            <em>Kept together.</em>
          </h1>
          <p>
            Review your takes, exact processing settings, and song-level
            timestamped notes.
          </p>
        </div>
        <aside>
          <h3>One song. One session record.</h3>
          <p>
            Access follows your current account permissions. This desk does not
            grant another engineer access or notify anyone.
          </p>
        </aside>
      </section>
      <div className="tv-notice" role="status">
        {notice}
      </div>
      <section className="tv-grid">
        <aside className="tv-panel">
          <p className="tv-kicker">SAVED SESSIONS</p>
          {sessions.map((s) => (
            <button
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                marginBottom: 12,
              }}
              disabled={busy}
              key={s.id}
              onClick={() => void open(s)}
            >
              {projects.find((p) => p.id === s.project_id)?.title ?? "Song"}
              <small>{new Date(s.created_at).toLocaleString()}</small>
            </button>
          ))}
          {!sessions.length && <Link href="/tm-vocal">Open TM Vocal →</Link>}
        </aside>
        <div className="tv-panel">
          {active ? (
            <>
              <h2>
                {projects.find((p) => p.id === active.project_id)?.title ??
                  "Song session"}
              </h2>
              <Link href={"/tm-vocal?projectId=" + active.project_id}>
                Continue processing this song →
              </Link>
              <button
                disabled={busy || !settings}
                onClick={() => {
                  try {
                    const raw = JSON.parse(settings);
                    localStorage.setItem(
                      "tm-vocal:v1:" + active.project_id,
                      JSON.stringify({
                        chain: sanitizeChain(raw.chain),
                        notes: typeof raw.notes === "string" ? raw.notes : "",
                        dna:
                          typeof raw.producerDna === "string"
                            ? raw.producerDna
                            : "",
                        beatLevel: raw.beatMix?.levelDb,
                        pocket: raw.beatMix?.pocketCutDb,
                        duck: raw.beatMix?.duckDb,
                      }),
                    );
                    window.location.assign(
                      "/tm-vocal?projectId=" + active.project_id,
                    );
                  } catch {
                    setNotice(
                      "Could not restore this session on this device. Export or review the settings below.",
                    );
                  }
                }}
              >
                Restore this chain in TM Vocal
              </button>
              <div className="tv-controls">
                {assets.map((a) => (
                  <button
                    key={a.id}
                    disabled={busy}
                    onClick={() => void play(a)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              {audioUrl && (
                <audio
                  ref={audio}
                  src={audioUrl}
                  controls
                  style={{ width: "100%", marginTop: 20 }}
                  onTimeUpdate={(e) => setSeconds(e.currentTarget.currentTime)}
                />
              )}
              <form
                className="tv-command"
                onSubmit={(e) => {
                  e.preventDefault();
                  void comment();
                }}
              >
                <label>
                  Timestamp (seconds)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={seconds.toFixed(1)}
                    onChange={(e) => setSeconds(Number(e.target.value))}
                  />
                </label>
                <label>
                  Vocal note
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={4000}
                    rows={3}
                    placeholder="What should change at this moment?"
                  />
                </label>
                <button disabled={busy || !body.trim()}>
                  Save timestamped note
                </button>
              </form>
              {comments.map((c) => (
                <p key={c.id}>
                  <button
                    onClick={() => {
                      if (audio.current)
                        audio.current.currentTime = c.timestamp_ms / 1000;
                      setSeconds(c.timestamp_ms / 1000);
                    }}
                  >
                    {(c.timestamp_ms / 1000).toFixed(1)}s
                  </button>{" "}
                  {c.body}
                </p>
              ))}
              <details>
                <summary>Exact session settings</summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    fontSize: 11,
                  }}
                >
                  {settings}
                </pre>
              </details>
            </>
          ) : (
            <p>Select a session to start reviewing.</p>
          )}
        </div>
      </section>
    </main>
  );
}
