import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { JobResponse } from "../types/api";

const POLL_INTERVAL_MS = 1500;

export function useJob(projectId: string | null) {
  const [job, setJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startJob = useCallback(
    async (jobPromise: Promise<JobResponse>) => {
      setError(null);
      try {
        const initial = await jobPromise;
        setJob(initial);

        if (initial.status === "completed" || initial.status === "failed") return;
        if (!projectId) return;

        intervalRef.current = setInterval(async () => {
          try {
            const updated = await api.getJob(projectId, initial.job_id);
            setJob(updated);
            if (updated.status === "completed" || updated.status === "failed") {
              stopPolling();
            }
          } catch (e) {
            setError(String(e));
            stopPolling();
          }
        }, POLL_INTERVAL_MS);
      } catch (e) {
        setError(String(e));
      }
    },
    [projectId, stopPolling]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
    setError(null);
  }, [stopPolling]);

  return { job, error, startJob, reset };
}
