"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { getCurrentUser, isCloudConfigured, signIn, signUp } from "@/lib/persistence/supabase-rest";
import styles from "./login.module.css";

export default function LoginPage(): React.JSX.Element {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const configured = isCloudConfigured();

  useEffect(() => {
    void getCurrentUser().then((user) => {
      if (user) window.location.replace("/dashboard");
    }).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
        window.location.assign("/dashboard");
        return;
      }
      const result = await signUp(email.trim(), password);
      setMessage(result.message);
      if (result.session) window.location.assign("/dashboard");
      else setMode("signin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete authentication.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.shell}>
      <div className={styles.backdrop} />
      <section className={styles.card}>
        <Link className={styles.backLink} href="/">← Music OS</Link>
        <div className={styles.brand}><span>M</span><div><strong>Music OS</strong><small>Private artist workspace</small></div></div>
        <h1>{mode === "signin" ? "Welcome back" : "Create your music workspace"}</h1>
        <p className={styles.lede}>Your projects, versions, artwork, stems, release records, and notes stay inside your private library.</p>

        {!configured ? (
          <div className={styles.setupBox}>
            <strong>Cloud persistence needs to be connected.</strong>
            <p>Run <code>db/music-os-phase2.sql</code> in Supabase, then add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to the deployment environment.</p>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)}>
            <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
            <button type="submit" disabled={busy}>{busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}</button>
          </form>
        )}

        {message && <div className={styles.message} role="status">{message}</div>}
        {configured && <button className={styles.switchButton} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}</button>}
        <p className={styles.footnote}>Music OS uses Supabase Auth for accounts and row-level security to keep project records private to the signed-in user.</p>
      </section>
    </main>
  );
}
