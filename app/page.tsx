"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ProducerDnaPanel } from "@/app/components/ProducerDnaPanel";
import type { Project } from "@/lib/types";

type AppMode = "guided" | "studio";
type TabName =
  | "Song Brief"
  | "Song DNA"
  | "Producer DNA"
  | "Prompt Pack"
  | "Generations"
  | "Stem Library"
  | "Beat Breakdown"
  | "Scorecards"
  | "Mix Notes"
  | "Revision Loop"
  | "Final Export";

const TABS: Array<{ id: TabName; label: string; description: string }> = [
  { id: "Song Brief", label: "Song Idea", description: "What you want to make and how it should feel." },
  { id: "Song DNA", label: "Sound Profile", description: "Tempo, key, mood, structure, and sonic ingredients." },
  { id: "Prompt Pack", label: "Production Directions", description: "Different ways to build the sound you described." },
  { id: "Generations", label: "Versions", description: "Compare different production directions." },
  { id: "Stem Library", label: "Song Parts / Stems", description: "Vocals, drums, bass, instruments, and other separated parts." },
  { id: "Beat Breakdown", label: "Song Structure", description: "Sections, bars, chords, and arrangement markers." },
  { id: "Scorecards", label: "Song Review", description: "A simple read on what is working and what needs attention." },
  { id: "Mix Notes", label: "Mix Feedback", description: "Notes for balance, clarity, vocals, low end, and space." },
  { id: "Revision Loop", label: "Improve This Version", description: "Turn your feedback into the next revision." },
  { id: "Final Export", label: "Download & Send to DAW", description: "Package files for your next production step." }
];

const STUDIO_TABS: Array<{ id: TabName; label: string; description: string }> = [
  ...TABS.slice(0, 2),
  { id: "Producer DNA", label: "Producer & Sound Library", description: "Research broad production traits and creative directions." },
  ...TABS.slice(2)
];

const GLOSSARY = [
  ["BPM", "Beats per minute. It tells you how fast the song is."],
  ["Key", "The musical note and scale the song is centered around. If you do not know it, Music OS can analyze it."],
  ["Stem", "One isolated part of a song, such as vocals, drums, bass, piano, or guitar."],
  ["Song DNA", "The technical name for your Sound Profile: tempo, key, mood, structure, vocal space, and palette."],
  ["Producer DNA", "A research profile of broad production traits, scenes, techniques, and creative directions."],
  ["LUFS", "A loudness measurement mainly used during mixing and mastering."],
  ["Prompt Pack", "A set of production directions generated from your song idea."],
  ["Revision Loop", "Review a version, identify changes, and create the next version."],
  ["DAW", "Digital Audio Workstation, such as Logic Pro, Ableton Live, FL Studio, Pro Tools, or REAPER."]
] as const;

const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
};

function progressForProject(project: Project | null): number {
  if (!project) return 0;
  let completed = 1;
  if (project.songDna.bpm || project.songDna.key) completed += 1;
  if (project.generations.length > 0 || project.promptPack.length > 0) completed += 1;
  if (project.stems.length > 0) completed += 1;
  if (project.scorecards.length > 0) completed += 1;
  if (project.mixNotes.trim()) completed += 1;
  if (project.manifest.exports.length > 0) completed += 1;
  return completed;
}

function recommendedStep(project: Project | null): { title: string; detail: string; tab: TabName } {
  if (!project) return { title: "Create your first song project", detail: "Start with a title and describe the sound in normal language. Music theory is optional.", tab: "Song Brief" };
  if (project.promptPack.length === 0 && project.generations.length === 0) return { title: "Build your sound profile", detail: "Turn your idea into a usable production plan and a few creative directions.", tab: "Song DNA" };
  if (project.stems.length === 0) return { title: "Work with the song parts", detail: "Separate stems when you want vocals, drums, bass, and instruments on their own.", tab: "Stem Library" };
  if (project.scorecards.length === 0) return { title: "Review the current version", detail: "See what is working, what is crowded, and what should change next.", tab: "Scorecards" };
  if (!project.mixNotes.trim()) return { title: "Add mix feedback", detail: "Write what you hear in plain language: vocals too quiet, bass too heavy, hook needs more space.", tab: "Mix Notes" };
  if (project.manifest.exports.length === 0) return { title: "Prepare your export", detail: "Package the current version for your DAW or engineer.", tab: "Final Export" };
  return { title: "Choose the next creative move", detail: "Revise again, compare another version, or move this project toward release preparation.", tab: "Revision Loop" };
}

export default function HomePage(): React.JSX.Element {
  const [mode, setMode] = useState<AppMode>("guided");
  const [helpOpen, setHelpOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("Song Brief");
  const [titleInput, setTitleInput] = useState("Location Drop");
  const [briefInput, setBriefInput] = useState("Dark melodic rap at 98 BPM with trap-soul bounce, smooth 808s, and hotel hallway tension.");
  const [commandInput, setCommandInput] = useState("Analyze this song direction and build the next production steps");
  const [mixNotesInput, setMixNotesInput] = useState("");
  const [revisionInput, setRevisionInput] = useState("");
  const [exportPlanInput, setExportPlanInput] = useState("");
  const [statusText, setStatusText] = useState("Ready");
  const [cacheEntries, setCacheEntries] = useState(0);
  const [busy, setBusy] = useState(false);

  const selectedProject = useMemo(() => projects.find((project) => project.id === activeProjectId) ?? null, [projects, activeProjectId]);
  const progress = progressForProject(selectedProject);
  const nextStep = recommendedStep(selectedProject);

  const loadProjects = async (): Promise<void> => {
    const data = await api<{ projects: Project[] }>("/api/projects");
    setProjects(data.projects);
    if (!activeProjectId && data.projects.length > 0) setActiveProjectId(data.projects[0].id);
  };

  const loadCacheStats = async (): Promise<void> => {
    const data = await api<{ cache: { entries: number } }>("/api/cache/stats");
    setCacheEntries(data.cache.entries);
  };

  useEffect(() => { void Promise.all([loadProjects(), loadCacheStats()]); }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setBriefInput(selectedProject.brief);
    setMixNotesInput(selectedProject.mixNotes);
    setRevisionInput(selectedProject.revisionPrompt);
    setExportPlanInput(selectedProject.exportPlan);
  }, [selectedProject?.id]);

  const withBusy = async (task: () => Promise<void>): Promise<void> => {
    setBusy(true);
    try {
      await task();
      await Promise.all([loadProjects(), loadCacheStats()]);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const createProject = async (): Promise<void> => withBusy(async () => {
    if (!titleInput.trim() || !briefInput.trim()) {
      setStatusText("Add a song title and a short description first.");
      return;
    }
    const data = await api<{ project: Project }>("/api/projects", { method: "POST", body: JSON.stringify({ title: titleInput.trim(), brief: briefInput.trim() }) });
    setActiveProjectId(data.project.id);
    setActiveTab("Song Brief");
    setStatusText(`Created ${data.project.title}. Your next step is to build the sound profile.`);
  });

  const runAgentLoop = async (): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      const data = await api<{ result: { decision: { stemMode: number; modelProfile: string }; jobIds: string[] } }>("/api/agent/run", { method: "POST", body: JSON.stringify({ projectId: selectedProject.id, command: commandInput }) });
      setStatusText(`Production analysis finished. ${data.result.jobIds.length} task${data.result.jobIds.length === 1 ? "" : "s"} completed.`);
    });
  };

  const runMultitask = async (): Promise<void> => {
    if (!selectedProject) return;
    const commands = commandInput.split("\n").map((value) => value.trim()).filter(Boolean);
    if (commands.length === 0) { setStatusText("Add one command per line to run several tasks."); return; }
    await withBusy(async () => {
      const data = await api<{ result: { totalCommands: number; totalJobs: number } }>("/api/agent/multitask", { method: "POST", body: JSON.stringify({ projectId: selectedProject.id, commands }) });
      setStatusText(`Finished ${data.result.totalCommands} commands across ${data.result.totalJobs} jobs.`);
    });
  };

  const runExtraction = async (stemMode: 2 | 4 | 6 | 10): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      await api<{ job: { id: string } }>(`/api/projects/${selectedProject.id}/extract`, { method: "POST", body: JSON.stringify({ mode: stemMode }) });
      setActiveTab("Stem Library");
      setStatusText(`Created a ${stemMode}-stem planning package. Use Stem Studio for real audio separation.`);
    });
  };

  const runAnalysis = async (): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      await api<{ job: { id: string } }>(`/api/projects/${selectedProject.id}/analyze`, { method: "POST", body: JSON.stringify({}) });
      setActiveTab("Song DNA");
      setStatusText("Sound profile analysis refreshed.");
    });
  };

  const runExport = async (type: string): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      await api<{ job: { id: string } }>(`/api/projects/${selectedProject.id}/export`, { method: "POST", body: JSON.stringify({ type }) });
      setActiveTab("Final Export");
      setStatusText("Export plan created. Use Stem Studio for downloadable real stem audio.");
    });
  };

  const saveState = async (): Promise<void> => {
    if (!selectedProject) return;
    await withBusy(async () => {
      await api<{ project: Project }>(`/api/projects/${selectedProject.id}/state`, { method: "PATCH", body: JSON.stringify({ brief: briefInput, mixNotes: mixNotesInput, revisionPrompt: revisionInput, exportPlan: exportPlanInput }) });
      setStatusText("Saved your project changes for this app session.");
    });
  };

  const renderTabContent = (): React.JSX.Element => {
    if (activeTab === "Producer DNA") return <ProducerDnaPanel />;
    if (!selectedProject) return <div className="emptyState"><div className="emptyIcon">♪</div><h2>Create a song project to begin</h2><p>You can describe your idea in normal language. You do not need to know BPM, key, mixing terms, or music theory.</p></div>;

    switch (activeTab) {
      case "Song Brief":
        return <div className="contentGrid"><section className="card"><div className="eyebrow">Song idea</div><h2>{selectedProject.title}</h2><p>{selectedProject.brief}</p><div className="helpText">This is the creative brief: feeling, tempo, references, story, energy, and anything you want to protect.</div></section><section className="card"><div className="eyebrow">Current status</div><h3>{selectedProject.status === "ready-for-export" ? "Ready to export" : selectedProject.status === "in-progress" ? "In production" : "Getting started"}</h3><p className="meta">Last updated {new Date(selectedProject.updatedAt).toLocaleString()}</p></section></div>;
      case "Song DNA":
        return <div className="contentGrid"><section className="card"><div className="eyebrow">Sound profile</div><h2>What the song sounds like</h2><div className="metricGrid"><div className="metric"><span>BPM</span><strong>{selectedProject.songDna.bpm ?? "Not set"}</strong><small>How fast the song is</small></div><div className="metric"><span>Key</span><strong>{selectedProject.songDna.key ?? "Not set"}</strong><small>The musical center</small></div><div className="metric"><span>Vocal space</span><strong>{selectedProject.songDna.vocalSpace}</strong><small>Room left for vocals</small></div></div></section><section className="card"><div className="eyebrow">Mood & ingredients</div><div className="pillRow">{selectedProject.songDna.mood.map((value) => <span className="pill" key={value}>{value}</span>)}</div><ul className="plainList">{selectedProject.songDna.palette.map((item) => <li key={item}>{item}</li>)}</ul><button className="secondaryButton" onClick={() => void runAnalysis()} disabled={busy}>Refresh analysis</button></section></div>;
      case "Prompt Pack":
        return <section className="card"><div className="eyebrow">Production directions</div><h2>Different ways to build this sound</h2>{selectedProject.promptPack.length === 0 ? <p className="meta">No directions yet. Run “Build my sound” to create them.</p> : <div className="stackList">{selectedProject.promptPack.map((prompt, index) => <div className="listCard" key={prompt}><strong>Direction {index + 1}</strong><p>{prompt}</p></div>)}</div>}</section>;
      case "Generations":
        return <section className="card"><div className="eyebrow">Versions</div><h2>Compare creative directions</h2>{selectedProject.generations.length === 0 ? <p className="meta">No modeled versions yet. Run the production analysis.</p> : <div className="contentGrid">{selectedProject.generations.map((generation) => <article className="listCard" key={generation.id}><h3>{generation.name} {generation.selected ? "✓" : ""}</h3><p>{generation.strategy}</p><div className="scoreLine"><span>Score</span><strong>{generation.score}</strong></div><p className="meta">Strong: {generation.strengths.join(", ")}</p><p className="meta">Needs work: {generation.weaknesses.join(", ")}</p></article>)}</div>}</section>;
      case "Stem Library":
        return <section className="card"><div className="sectionHeader"><div><div className="eyebrow">Song parts / stems</div><h2>Work with parts of the song separately</h2><p className="meta">A stem is one isolated part, such as vocals, drums, bass, or guitar.</p></div><Link className="textLink" href="/stem-studio">Open real Stem Studio →</Link></div>{selectedProject.stems.length === 0 ? <div className="emptyInline"><p>No planning stems yet.</p><div className="actionRow"><button className="secondaryButton" onClick={() => void runExtraction(4)} disabled={busy}>Model a 4-stem plan</button><Link className="primaryButton linkButton" href="/stem-studio">Separate real audio</Link></div></div> : <div className="stemGrid">{selectedProject.stems.map((stem) => <div className="stemCard" key={stem.id}><strong>{stem.name.replaceAll("_", " ")}</strong><span>{stem.durationSec.toFixed(0)} sec</span><small>Advanced: {stem.lufs.toFixed(1)} LUFS · {(stem.confidence * 100).toFixed(0)}% confidence</small></div>)}</div>}</section>;
      case "Beat Breakdown":
        return <div className="contentGrid"><section className="card"><div className="eyebrow">Song structure</div><h2>Sections</h2><ul className="plainList">{selectedProject.manifest.markers.map((marker) => <li key={`${marker.bar}-${marker.label}`}>Bar {marker.bar}: <strong>{marker.label}</strong></li>)}</ul></section><section className="card"><div className="eyebrow">Harmony</div><h2>Chord map</h2><ul className="plainList">{selectedProject.manifest.chords.map((chord) => <li key={`${chord.bar}-${chord.chord}`}>Bar {chord.bar}: <strong>{chord.chord}</strong></li>)}</ul></section></div>;
      case "Scorecards":
        return <section className="card"><div className="eyebrow">Song review</div><h2>What is working?</h2>{selectedProject.scorecards.length === 0 ? <p className="meta">No review scores yet. Run the production analysis first.</p> : <div className="contentGrid">{selectedProject.scorecards.map((score) => <div className="listCard" key={score.id}><h3>{score.summary}</h3><div className="scoreRows"><span>Emotion <strong>{score.emotionalAlignment}/10</strong></span><span>Originality <strong>{score.originality}/10</strong></span><span>Vocal space <strong>{score.vocalSpace}/10</strong></span><span>Release readiness <strong>{score.releaseReadiness}/10</strong></span></div></div>)}</div>}</section>;
      case "Mix Notes":
        return <section className="card"><div className="eyebrow">Mix feedback</div><h2>Write what you hear</h2><p className="meta">Plain language is fine: “vocals too quiet,” “808 is swallowing the kick,” “hook needs more space.”</p><textarea className="largeInput" value={mixNotesInput} onChange={(event) => setMixNotesInput(event.target.value)} placeholder="What should change in the mix?"/><button className="primaryButton" onClick={() => void saveState()} disabled={busy || !mixNotesInput.trim()}>Save mix feedback</button></section>;
      case "Revision Loop":
        return <section className="card"><div className="eyebrow">Improve this version</div><h2>Turn feedback into the next revision</h2><p className="meta">Describe the change you want. The advanced system translates this into production instructions.</p><textarea className="largeInput" value={revisionInput} onChange={(event) => setRevisionInput(event.target.value)} placeholder="Example: Keep the drums, make the verse less crowded, and leave more space for a low male vocal."/><button className="primaryButton" onClick={() => void saveState()} disabled={busy}>Save revision direction</button></section>;
      case "Final Export":
        return <section className="card"><div className="eyebrow">Download & send to DAW</div><h2>Choose where the project goes next</h2><p className="meta">A DAW is the music software where you record, arrange, mix, and finish songs. The command center export is currently a modeled handoff plan; real stem downloads come from Stem Studio.</p><div className="actionRow"><button className="primaryButton" onClick={() => void runExport("wav-zip")} disabled={busy}>Plan universal WAV package</button><button className="secondaryButton" onClick={() => void runExport("reaper-rpp")} disabled={busy}>Plan REAPER package</button><Link className="secondaryButton linkButton" href="/stem-studio">Open real audio exports</Link></div><textarea className="largeInput" value={exportPlanInput} onChange={(event) => setExportPlanInput(event.target.value)} placeholder="Optional notes for the export or engineer"/><button className="secondaryButton" onClick={() => void saveState()} disabled={busy}>Save export notes</button>{selectedProject.manifest.exports.length > 0 && <div className="stackList">{selectedProject.manifest.exports.map((artifact) => <div className="listCard" key={artifact.id}><strong>{artifact.type}</strong><p className="meta">{artifact.files.length} planned files · {artifact.status}</p></div>)}</div>}</section>;
      default:
        return <div />;
    }
  };

  return (
    <main className="musicOs">
      <header className="topbar">
        <div><div className="brandRow"><span className="brandMark">M</span><strong>Music OS</strong><span className="betaPill">guided beta</span></div><p className="brandSub">Create → Produce → Analyze → Improve → Mix → Export</p></div>
        <div className="topActions"><div className="modeSwitch" aria-label="Interface mode"><button className={mode === "guided" ? "active" : ""} onClick={() => setMode("guided")}>Guided</button><button className={mode === "studio" ? "active" : ""} onClick={() => setMode("studio")}>Studio</button></div><Link href="/guide" className="topLink">Guide</Link><button className="helpButton" onClick={() => setHelpOpen(true)} aria-label="Open help">?</button></div>
      </header>

      {mode === "guided" ? <>
        <section className="welcomePanel"><div><div className="eyebrow">Start here</div><h1>What do you want to do today?</h1><p>You can use normal language. Music OS keeps technical controls available only when you need them.</p></div><div className="quickActions"><button onClick={() => { setActiveTab("Song Brief"); document.getElementById("project-builder")?.scrollIntoView({ behavior: "smooth" }); }}><span>＋</span><strong>Start a new song</strong><small>Create a project from an idea</small></button><Link href="/stem-studio"><span>≋</span><strong>Separate stems</strong><small>Split vocals, drums, bass & more</small></Link><button onClick={() => setActiveTab("Song DNA")}><span>⌁</span><strong>Analyze my song</strong><small>Understand tempo, key & sound</small></button><button onClick={() => setActiveTab("Revision Loop")}><span>↻</span><strong>Improve a version</strong><small>Turn feedback into revisions</small></button><button onClick={() => setActiveTab("Generations")}><span>◫</span><strong>Compare versions</strong><small>See strengths and weaknesses</small></button><button onClick={() => setActiveTab("Producer DNA")}><span>⌕</span><strong>Research a sound</strong><small>Explore producer traits safely</small></button></div></section>

        <section className="projectStrip"><div className="projectPicker"><label htmlFor="project-select">Current project</label><select id="project-select" value={activeProjectId ?? ""} onChange={(event) => setActiveProjectId(event.target.value || null)}><option value="">No project selected</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></div><div className="progressWrap"><div className="progressLabels"><span>Project progress</span><strong>{progress}/7</strong></div><div className="progressTrack"><div className="progressFill" style={{ width: `${(progress / 7) * 100}%` }} /></div><div className="progressSteps"><span>Idea</span><span>Sound</span><span>Versions</span><span>Stems</span><span>Review</span><span>Mix</span><span>Export</span></div></div></section>

        <section className="nextStepCard"><div><div className="eyebrow">Recommended next step</div><h2>{nextStep.title}</h2><p>{nextStep.detail}</p></div><button className="primaryButton" onClick={() => setActiveTab(nextStep.tab)}>Go to {STUDIO_TABS.find((tab) => tab.id === nextStep.tab)?.label} →</button></section>

        <section id="project-builder" className="guidedBuilder"><div className="builderSidebar"><div className="sidebarTitle">Project steps</div>{TABS.map((tab, index) => <button key={tab.id} className={`guidedTab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}><span className="tabNumber">{index + 1}</span><span><strong>{tab.label}</strong><small>{tab.description}</small></span></button>)}<button className={`guidedTab optional ${activeTab === "Producer DNA" ? "active" : ""}`} onClick={() => setActiveTab("Producer DNA")}><span className="tabNumber">⌕</span><span><strong>Producer & Sound Library</strong><small>Optional research tool</small></span></button></div><div className="builderMain">{!selectedProject ? <section className="newProjectCard"><div className="eyebrow">Step 1</div><h2>Tell us about your song</h2><p>No music theory required. Describe the sound the way you would explain it to a producer.</p><label>Song title<input value={titleInput} onChange={(event) => setTitleInput(event.target.value)} placeholder="Untitled song" /></label><label>What should it sound and feel like?<textarea value={briefInput} onChange={(event) => setBriefInput(event.target.value)} placeholder="Example: dark late-night rap, smooth 808s, simple melody, lots of room for vocals..." /></label><button className="primaryButton large" onClick={() => void createProject()} disabled={busy}>{busy ? "Creating…" : "Create song project →"}</button></section> : renderTabContent()}</div></section>
      </> : <section className="studioModeLayout"><aside className="studioSidebar"><div className="eyebrow">Studio mode</div><select value={activeProjectId ?? ""} onChange={(event) => setActiveProjectId(event.target.value || null)}><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select><div className="tab-list">{STUDIO_TABS.map((tab) => <button key={tab.id} className={`tab-item ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}><strong>{tab.label}</strong><small>{tab.id}</small></button>)}</div></aside><div className="studioMain"><section className="advancedControls"><div className="sectionHeader"><div><div className="eyebrow">Advanced controls</div><h2>Production command center</h2></div><div className="advancedLinks"><Link href="/stem-studio">Stem Studio</Link><Link href="/guide">Guide</Link></div></div><div className="advancedGrid"><label>Song brief<textarea value={briefInput} onChange={(event) => setBriefInput(event.target.value)} /></label><label>Agent command<textarea value={commandInput} onChange={(event) => setCommandInput(event.target.value)} /></label><label>Mix notes<textarea value={mixNotesInput} onChange={(event) => setMixNotesInput(event.target.value)} /></label><label>Revision prompt<textarea value={revisionInput} onChange={(event) => setRevisionInput(event.target.value)} /></label></div><div className="actionRow wrap"><button className="primaryButton" onClick={() => void runAgentLoop()} disabled={busy || !selectedProject}>Run production analysis</button><button className="secondaryButton" onClick={() => void runMultitask()} disabled={busy || !selectedProject}>Run several tasks</button><button className="secondaryButton" onClick={() => void runExtraction(4)} disabled={busy || !selectedProject}>Model 4 stems</button><button className="secondaryButton" onClick={() => void runAnalysis()} disabled={busy || !selectedProject}>Analyze profile</button><button className="secondaryButton" onClick={() => void saveState()} disabled={busy || !selectedProject}>Save state</button></div><details className="technicalDetails"><summary>Technical details</summary><p>Prompt cache entries: {cacheEntries}. The command center agent/scoring layer is currently a deterministic planning MVP. Real audio separation remains in Stem Studio.</p></details></section>{renderTabContent()}</div></section>}

      <div className="statusBar" role="status" aria-live="polite"><span className={busy ? "statusDot busy" : "statusDot"} />{busy ? "Working…" : statusText}</div>

      {helpOpen && <div className="helpOverlay" role="presentation" onClick={() => setHelpOpen(false)}><aside className="helpDrawer" role="dialog" aria-modal="true" aria-label="Music OS help" onClick={(event) => event.stopPropagation()}><div className="helpHeader"><div><div className="eyebrow">Help & learning</div><h2>What does this mean?</h2></div><button onClick={() => setHelpOpen(false)} aria-label="Close help">×</button></div><p className="meta">Use this glossary while you work. The full walkthrough is available in the Guide.</p><div className="glossaryList">{GLOSSARY.map(([term, definition]) => <div className="glossaryItem" key={term}><strong>{term}</strong><p>{definition}</p></div>)}</div><Link className="primaryButton linkButton" href="/guide">Open full guide →</Link></aside></div>}
    </main>
  );
}
