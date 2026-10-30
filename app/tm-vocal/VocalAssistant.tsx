"use client";
import { useState } from "react";
import Link from "next/link";
import { getSessionAccessToken } from "@/lib/persistence/supabase-rest";
import type { Chain } from "@/lib/tm-vocal/chain";
import type { Measurement } from "@/lib/tm-vocal/audio";
export function VocalAssistant({
  projectId,
  chain,
  measurement,
  dna,
}: {
  projectId: string;
  chain: Chain;
  measurement: Measurement | null;
  dna: string;
}) {
  const [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState(""),
    [busy, setBusy] = useState(false);
  async function ask() {
    if (!question.trim()) return;
    setBusy(true);
    try {
      const token = await getSessionAccessToken();
      if (!token)
        throw new Error(
          "Sign in to ask TM Assistant. Type-to-mix above works offline.",
        );
      const response = await fetch("/api/music-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          projectId: projectId || undefined,
          question:
            question +
            "\n\nCurrent TM Vocal device-session settings (user-provided context; no audio attached): " +
            JSON.stringify({
              chain,
              measurements: measurement
                ? {
                    peakDb: measurement.peakDb,
                    rmsDb: measurement.rmsDb,
                    duration: measurement.duration,
                    bands: measurement.bands,
                  }
                : null,
            }),
          dna: { vocalChain: dna },
          level: "beginner",
          mode: "technical",
        }),
      });
      const result = (await response.json()) as {
        answer?: string;
        error?: string;
        warning?: string;
      };
      if (!response.ok)
        throw new Error(result.error ?? "Assistant unavailable.");
      setAnswer(
        (result.answer ?? "No response returned.") +
          (result.warning ? "\n\n" + result.warning : ""),
      );
    } catch (e) {
      setAnswer(e instanceof Error ? e.message : "Assistant unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="tv-panel">
      <p className="tv-kicker">TM ASSISTANT</p>
      <h2>Understand the decision.</h2>
      <p>
        Ask about this chain and your measured take. Advice uses settings and
        measurements; it does not listen to uploaded audio or change knobs
        automatically.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={4000}
          rows={3}
          placeholder="Why does this chain sound too bright? What should I try first?"
        />
        <button disabled={busy || !question.trim()}>
          {busy ? "Thinking…" : "Ask about this chain"}
        </button>
      </form>
      {answer && (
        <p role="status" style={{ whiteSpace: "pre-wrap" }}>
          {answer}
        </p>
      )}
      <Link href="/login">Account sign-in →</Link>
    </section>
  );
}
