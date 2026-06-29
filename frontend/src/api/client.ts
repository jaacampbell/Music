import type {
  ExportRecord,
  ExportRequest,
  JobResponse,
  ProjectManifest,
  ProjectSummary,
  SeparationRequest,
  StemInfo,
} from "../types/api";

const BASE = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export const api = {
  // ── Projects ─────────────────────────────────────────────────────────────
  uploadProject(file: File): Promise<{ project_id: string; title: string; created_at: string }> {
    const form = new FormData();
    form.append("file", file);
    return request("/projects", { method: "POST", body: form });
  },

  listProjects(): Promise<ProjectSummary[]> {
    return request("/projects");
  },

  getProject(id: string): Promise<ProjectManifest> {
    return request(`/projects/${id}`);
  },

  deleteProject(id: string): Promise<void> {
    return request(`/projects/${id}`, { method: "DELETE" });
  },

  // ── Jobs ─────────────────────────────────────────────────────────────────
  startPreprocess(projectId: string): Promise<JobResponse> {
    return request(`/projects/${projectId}/jobs/preprocess`, { method: "POST" });
  },

  startSeparation(projectId: string, body: SeparationRequest): Promise<JobResponse> {
    return request(`/projects/${projectId}/jobs/separate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  getJob(projectId: string, jobId: string): Promise<JobResponse> {
    return request(`/projects/${projectId}/jobs/${jobId}`);
  },

  // ── Stems ─────────────────────────────────────────────────────────────────
  listStems(projectId: string): Promise<StemInfo[]> {
    return request(`/projects/${projectId}/stems`);
  },

  updateStem(
    projectId: string,
    stemName: string,
    update: { is_muted?: boolean; volume_db?: number; pan?: number }
  ): Promise<StemInfo> {
    return request(`/projects/${projectId}/stems/${stemName}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
  },

  stemFileUrl(projectId: string, stemName: string): string {
    return `${BASE}/projects/${projectId}/stems/${stemName}/file`;
  },

  // ── Exports ───────────────────────────────────────────────────────────────
  createExport(projectId: string, body: ExportRequest): Promise<JobResponse> {
    return request(`/projects/${projectId}/exports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  listExports(projectId: string): Promise<ExportRecord[]> {
    return request(`/projects/${projectId}/exports`);
  },

  exportDownloadUrl(projectId: string, exportId: string): string {
    return `${BASE}/projects/${projectId}/exports/${exportId}/download`;
  },
};
