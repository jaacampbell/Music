"use client";

import { useMemo, useState } from "react";

type DawStem = {
  name: string;
  label?: string;
  family?: string;
  downloadName?: string;
  url: string;
};

type DawManifest = {
  jobId: string;
  source: { filename: string };
  stems: DawStem[];
  zipUrl: string;
};

type Props = {
  manifest: DawManifest;
  resultOrigin: string | null;
  projectId: string | null;
  projectTitle?: string | null;
};

const slugifyProject = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "UNTITLED_PROJECT";

export function DawHandoff({ manifest, resultOrigin, projectId, projectTitle }: Props): React.JSX.Element {
  const [message, setMessage] = useState("Creates a handoff ticket for the optional Mac bridge.");

  const projectFolderName = useMemo(
    () => slugifyProject(projectTitle || manifest.source.filename.replace(/\.[^.]+$/, "")),
    [projectTitle, manifest.source.filename]
  );

  const createHandoff = (): void => {
    if (!resultOrigin) {
      setMessage("The worker result URL is unavailable. Re-run or recover the stem job first.");
      return;
    }

    const stemZipUrl = manifest.zipUrl.startsWith("http")
      ? manifest.zipUrl
      : `${resultOrigin}${manifest.zipUrl}`;

    const handoff = {
      schema: "jocyn-daw-handoff/v1",
      createdAt: new Date().toISOString(),
      action: "stage-stems-for-ableton",
      projectId,
      projectTitle: projectTitle || projectFolderName,
      projectFolderName,
      sourceFilename: manifest.source.filename,
      stemJobId: manifest.jobId,
      stemZipUrl,
      destination: {
        projectRoot: "~/Music/JOcYN/Ableton Projects",
        abletonSetsFolder: "01_Ableton_Sets",
        stemsFolder: "05_Stems",
        archiveFolder: "12_Archive/DAW_Handoffs"
      },
      stems: manifest.stems.map((stem) => ({
        name: stem.name,
        label: stem.label ?? stem.name,
        family: stem.family ?? null,
        filename: stem.downloadName ?? `${stem.name}.wav`
      }))
    };

    const blob = new Blob([JSON.stringify(handoff, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${projectFolderName}_${manifest.jobId}.jocynhandoff`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setMessage(
      `Handoff created for ${projectFolderName}. With JO₵YN DAW Bridge running, stems will land in 05_Stems automatically.`
    );
  };

  return (
    <section className="dawHandoff">
      <div>
        <p className="eyebrow">DAW handoff</p>
        <h3>Send to Ableton</h3>
        <p className="dawHandoffCopy">
          Uses your existing project structure: <strong>01_Ableton_Sets</strong> + <strong>05_Stems</strong>.
          The browser creates the handoff ticket; the optional Mac bridge handles the local filesystem.
        </p>
        <p className="dawHandoffStatus">{message}</p>
      </div>
      <div className="dawHandoffActions">
        <button className="primary" onClick={createHandoff} disabled={!resultOrigin}>Send to Ableton</button>
        {resultOrigin && (
          <a
            className="ghost download"
            href={manifest.zipUrl.startsWith("http") ? manifest.zipUrl : `${resultOrigin}${manifest.zipUrl}`}
          >
            Download stem pack
          </a>
        )}
      </div>
    </section>
  );
}
