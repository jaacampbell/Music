import { useState, useCallback, useEffect } from "react";
import { Scissors, ChevronLeft } from "lucide-react";
import { AudioUpload } from "./components/AudioUpload";
import { JobStatus } from "./components/JobStatus";
import { StemGrid } from "./components/StemGrid";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { ExportPanel } from "./components/ExportPanel";
import { api } from "./api/client";
import type { JobResponse, ProjectManifest, StemInfo } from "./types/api";
import "./styles.css";

type Stage =
  | "upload"
  | "preprocessing"
  | "separating"
  | "done";

export default function App() {
  const [stage, setStage] = useState<Stage>("upload");
  const [uploading, setUploading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [manifest, setManifest] = useState<ProjectManifest | null>(null);
  const [activeJob, setActiveJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Separation settings
  const [mode, setMode] = useState<"4stem" | "6stem" | "2stem">("4stem");

  const refreshManifest = useCallback(async (id: string) => {
    try {
      const m = await api.getProject(id);
      setManifest(m);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  // ── Upload & kick off preprocess ───────────────────────────────────────────
  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const { project_id } = await api.uploadProject(file);
        setProjectId(project_id);

        // Start preprocessing immediately
        const job = await api.startPreprocess(project_id);
        setActiveJob(job);
        setStage("preprocessing");
      } catch (e) {
        setError(String(e));
      } finally {
        setUploading(false);
      }
    },
    []
  );

  // ── Poll active job ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeJob || !projectId) return;
    if (activeJob.status === "completed" || activeJob.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.getJob(projectId, activeJob.job_id);
        setActiveJob(updated);

        if (updated.status === "completed") {
          await refreshManifest(projectId);
          if (stage === "preprocessing") {
            // Auto-kick separation
            setStage("separating");
            const sepJob = await api.startSeparation(projectId, { mode });
            setActiveJob(sepJob);
          } else if (stage === "separating") {
            await refreshManifest(projectId);
            setStage("done");
            setActiveJob(null);
          }
        } else if (updated.status === "failed") {
          setError(updated.error ?? "Job failed");
          setActiveJob(null);
        }
      } catch (e) {
        setError(String(e));
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJob, projectId, stage, mode, refreshManifest]);

  // ── Stem update callback ────────────────────────────────────────────────────
  const handleStemUpdate = useCallback((updated: StemInfo) => {
    setManifest((prev) =>
      prev
        ? {
            ...prev,
            stems: prev.stems.map((s) => (s.name === updated.name ? updated : s)),
          }
        : prev
    );
  }, []);

  const handleReset = () => {
    setStage("upload");
    setProjectId(null);
    setManifest(null);
    setActiveJob(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <Scissors size={24} />
            <span>Stem Extractor</span>
          </div>
          {stage !== "upload" && (
            <button className="btn btn--ghost" onClick={handleReset}>
              <ChevronLeft size={16} />
              New Project
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {stage === "upload" && (
          <div className="page-upload">
            <div className="page-upload__hero">
              <h1>Stem Extraction + DAW Export</h1>
              <p>
                Upload any audio file. We'll separate it into clean, aligned stems you can use in
                Ableton, FL Studio, Logic, REAPER, and any other DAW.
              </p>
            </div>

            <div className="upload-options">
              <label className="mode-label">Separation mode:</label>
              <div className="mode-buttons">
                {(["2stem", "4stem", "6stem"] as const).map((m) => (
                  <button
                    key={m}
                    className={`btn btn--mode ${mode === m ? "btn--mode-active" : ""}`}
                    onClick={() => setMode(m)}
                  >
                    {m === "2stem" && "2 Stems (Vocals / Instrumental)"}
                    {m === "4stem" && "4 Stems (Vocals / Drums / Bass / Other)"}
                    {m === "6stem" && "6 Stems (+ Guitar + Piano)"}
                  </button>
                ))}
              </div>
            </div>

            <AudioUpload onUpload={handleUpload} uploading={uploading} />
          </div>
        )}

        {(stage === "preprocessing" || stage === "separating") && activeJob && (
          <div className="page-processing">
            <h2>
              {stage === "preprocessing"
                ? "Analyzing audio..."
                : "Separating stems..."}
            </h2>
            <p className="processing-hint">
              {stage === "preprocessing"
                ? "Detecting BPM, key, and loudness."
                : `Running ${mode} separation with HTDemucs. This may take a few minutes.`}
            </p>
            <JobStatus job={activeJob} />
          </div>
        )}

        {stage === "done" && manifest && projectId && (
          <div className="page-results">
            <div className="results-header">
              <h2>{manifest.title}</h2>
            </div>

            <AnalysisPanel analysis={manifest.analysis} source={manifest.source} />

            <StemGrid
              stems={manifest.stems}
              projectId={projectId}
              onStemUpdate={handleStemUpdate}
            />

            <ExportPanel
              projectId={projectId}
              hasSeparation={manifest.stems.length > 0}
              exports={manifest.exports}
              onExportComplete={() => refreshManifest(projectId)}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Powered by Demucs · librosa · FFmpeg · FastAPI —{" "}
          <a href="/docs" target="_blank" rel="noreferrer">
            API docs
          </a>
        </p>
      </footer>
    </div>
  );
}
