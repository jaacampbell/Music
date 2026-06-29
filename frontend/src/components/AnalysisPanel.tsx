import type { AnalysisResult, SourceInfo } from "../types/api";
import { Music, Clock, Activity, BarChart2 } from "lucide-react";

interface Props {
  analysis: AnalysisResult;
  source: SourceInfo | null;
}

export function AnalysisPanel({ analysis, source }: Props) {
  const hasData = analysis.bpm != null || analysis.key != null;
  if (!hasData) return null;

  const duration = source?.duration_seconds ?? 0;
  const mm = Math.floor(duration / 60);
  const ss = Math.round(duration % 60);

  return (
    <div className="analysis-panel">
      <h3 className="section-title">Analysis</h3>
      <div className="analysis-grid">
        {analysis.bpm != null && (
          <div className="analysis-card">
            <Activity size={20} />
            <span className="analysis-card__value">{analysis.bpm}</span>
            <span className="analysis-card__label">BPM</span>
            {analysis.bpm_confidence != null && (
              <span className="analysis-card__conf">
                {Math.round(analysis.bpm_confidence * 100)}% conf
              </span>
            )}
          </div>
        )}
        {analysis.key && (
          <div className="analysis-card">
            <Music size={20} />
            <span className="analysis-card__value">{analysis.key}</span>
            <span className="analysis-card__label">Key</span>
            {analysis.key_confidence != null && (
              <span className="analysis-card__conf">
                {Math.round(analysis.key_confidence * 100)}% conf
              </span>
            )}
          </div>
        )}
        {duration > 0 && (
          <div className="analysis-card">
            <Clock size={20} />
            <span className="analysis-card__value">
              {mm}:{String(ss).padStart(2, "0")}
            </span>
            <span className="analysis-card__label">Duration</span>
          </div>
        )}
        {analysis.lufs_integrated != null && (
          <div className="analysis-card">
            <BarChart2 size={20} />
            <span className="analysis-card__value">
              {analysis.lufs_integrated.toFixed(1)}
            </span>
            <span className="analysis-card__label">LUFS</span>
          </div>
        )}
      </div>
    </div>
  );
}
