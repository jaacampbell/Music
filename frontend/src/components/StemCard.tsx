import { Volume2, VolumeX, Download } from "lucide-react";
import type { StemInfo } from "../types/api";
import { api } from "../api/client";

interface Props {
  stem: StemInfo;
  projectId: string;
  onUpdate: (updated: StemInfo) => void;
}

const STEM_COLORS: Record<string, string> = {
  vocals: "#a78bfa",
  drums: "#f87171",
  bass: "#34d399",
  guitar: "#fbbf24",
  piano: "#60a5fa",
  other: "#94a3b8",
  no_vocals: "#e2e8f0",
};

export function StemCard({ stem, projectId, onUpdate }: Props) {
  const color = STEM_COLORS[stem.name] ?? "#94a3b8";

  const toggleMute = async () => {
    const updated = await api.updateStem(projectId, stem.name, {
      is_muted: !stem.is_muted,
    });
    onUpdate(updated);
  };

  const downloadUrl = api.stemFileUrl(projectId, stem.name);

  return (
    <div className={`stem-card ${stem.is_muted ? "stem-card--muted" : ""}`}>
      <div className="stem-card__color-bar" style={{ backgroundColor: color }} />
      <div className="stem-card__body">
        <div className="stem-card__header">
          <span className="stem-card__label">{stem.label}</span>
          <div className="stem-card__actions">
            <button
              className={`btn-icon ${stem.is_muted ? "btn-icon--muted" : ""}`}
              onClick={toggleMute}
              title={stem.is_muted ? "Unmute" : "Mute"}
            >
              {stem.is_muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <a href={downloadUrl} download={`${stem.name}.wav`} className="btn-icon" title="Download">
              <Download size={16} />
            </a>
          </div>
        </div>

        <div className="stem-card__meta">
          {stem.duration_seconds > 0 && (
            <span>{stem.duration_seconds.toFixed(1)}s</span>
          )}
          {stem.lufs_integrated != null && (
            <span>{stem.lufs_integrated.toFixed(1)} LUFS</span>
          )}
          {stem.confidence != null && (
            <span className={`confidence confidence--${confidenceLevel(stem.confidence)}`}>
              {Math.round(stem.confidence * 100)}% conf
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function confidenceLevel(c: number): "high" | "medium" | "low" {
  if (c >= 0.8) return "high";
  if (c >= 0.5) return "medium";
  return "low";
}
