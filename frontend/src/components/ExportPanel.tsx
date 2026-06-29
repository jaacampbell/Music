import { useState } from "react";
import { Download, Package, Music2 } from "lucide-react";
import type { ExportRecord, ExportRequest, JobResponse } from "../types/api";
import { api } from "../api/client";
import { JobStatus } from "./JobStatus";

interface Props {
  projectId: string;
  hasSeparation: boolean;
  exports: ExportRecord[];
  onExportComplete: () => void;
}

export function ExportPanel({ projectId, hasSeparation, exports, onExportComplete }: Props) {
  const [job, setJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeMidi, setIncludeMidi] = useState(false);

  const startExport = async (type: "wav_zip" | "reaper_rpp") => {
    setError(null);
    try {
      const body: ExportRequest = {
        type,
        include_midi: includeMidi,
        include_manifest: true,
        include_readme: true,
      };
      const j = await api.createExport(projectId, body);
      setJob(j);
      pollJob(j.job_id);
    } catch (e) {
      setError(String(e));
    }
  };

  const pollJob = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const updated = await api.getJob(projectId, jobId);
        setJob(updated);
        if (updated.status === "completed" || updated.status === "failed") {
          clearInterval(interval);
          if (updated.status === "completed") onExportComplete();
        }
      } catch {
        clearInterval(interval);
      }
    }, 1500);
  };

  return (
    <div className="export-panel">
      <h3 className="section-title">Export</h3>

      {!hasSeparation && (
        <p className="export-panel__hint">Run stem separation first to enable exports.</p>
      )}

      <div className="export-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={includeMidi}
            onChange={(e) => setIncludeMidi(e.target.checked)}
            disabled={!hasSeparation}
          />
          Include MIDI sidecars (when available)
        </label>
      </div>

      <div className="export-buttons">
        <button
          className="btn btn--primary"
          disabled={!hasSeparation || job?.status === "running" || job?.status === "queued"}
          onClick={() => startExport("wav_zip")}
        >
          <Package size={16} />
          Export WAV ZIP
        </button>
        <button
          className="btn btn--secondary"
          disabled={!hasSeparation || job?.status === "running" || job?.status === "queued"}
          onClick={() => startExport("reaper_rpp")}
        >
          <Music2 size={16} />
          REAPER Project (.rpp)
        </button>
      </div>

      {job && <JobStatus job={job} />}
      {error && <div className="error-message">{error}</div>}

      {exports.length > 0 && (
        <div className="export-list">
          <h4>Downloads</h4>
          {exports.map((exp) => (
            <div key={exp.id} className="export-item">
              <Download size={14} />
              <span className="export-item__type">{exp.type}</span>
              <span className="export-item__size">
                {(exp.size_bytes / 1024 / 1024).toFixed(1)} MB
              </span>
              <a
                href={api.exportDownloadUrl(projectId, exp.id)}
                download
                className="btn btn--small"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
