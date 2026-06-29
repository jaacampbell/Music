import type { StemInfo } from "../types/api";
import { StemCard } from "./StemCard";

interface Props {
  stems: StemInfo[];
  projectId: string;
  onStemUpdate: (updated: StemInfo) => void;
}

export function StemGrid({ stems, projectId, onStemUpdate }: Props) {
  if (stems.length === 0) return null;

  return (
    <div className="stem-grid">
      <h3 className="section-title">Stems</h3>
      <div className="stem-grid__cards">
        {stems.map((stem) => (
          <StemCard
            key={stem.name}
            stem={stem}
            projectId={projectId}
            onUpdate={onStemUpdate}
          />
        ))}
      </div>
    </div>
  );
}
