import type { JobResponse } from "../types/api";
import { CheckCircle, XCircle, Loader } from "lucide-react";

interface Props {
  job: JobResponse;
}

export function JobStatus({ job }: Props) {
  const { status, progress_percent, message } = job;

  const icon =
    status === "completed" ? (
      <CheckCircle size={20} className="icon-success" />
    ) : status === "failed" ? (
      <XCircle size={20} className="icon-error" />
    ) : (
      <Loader size={20} className="icon-spin" />
    );

  return (
    <div className={`job-status job-status--${status}`}>
      <div className="job-status__header">
        {icon}
        <span className="job-status__message">{message || status}</span>
        <span className="job-status__pct">{progress_percent}%</span>
      </div>
      <div className="job-status__bar">
        <div
          className="job-status__fill"
          style={{ width: `${progress_percent}%` }}
        />
      </div>
      {job.error && (
        <div className="job-status__error">Error: {job.error}</div>
      )}
    </div>
  );
}
