import { useCallback, useRef, useState } from "react";
import { Upload, Music } from "lucide-react";

interface Props {
  onUpload: (file: File) => void;
  uploading: boolean;
}

const ACCEPTED = ".wav,.mp3,.flac,.aiff,.aif,.m4a,.ogg";

export function AudioUpload({ onUpload, uploading }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!uploading) onUpload(file);
    },
    [onUpload, uploading]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      className={`upload-zone ${dragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <div className="upload-icon">
        {uploading ? <Music size={48} /> : <Upload size={48} />}
      </div>
      <div className="upload-text">
        {uploading
          ? "Uploading..."
          : dragOver
          ? "Drop audio file here"
          : "Drop audio here or click to browse"}
      </div>
      <div className="upload-hint">WAV · MP3 · FLAC · AIFF · M4A · OGG — up to 500 MB</div>
    </div>
  );
}
