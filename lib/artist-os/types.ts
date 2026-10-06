export type ArtistTaskStatus = "todo" | "doing" | "blocked" | "done" | "archived";
export type ArtistTaskPriority = "low" | "normal" | "high" | "urgent";

export interface ArtistWorkspaceRow {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ArtistBrandRow {
  id: string;
  workspace_id: string;
  user_id: string;
  display_name: string;
  stylized_name: string;
  slug: string;
  brand_type: string;
  bio: string;
  audience: string;
  voice: string;
  visual_direction: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArtistCampaignRow {
  id: string;
  brand_id: string;
  user_id: string;
  music_project_id: string | null;
  title: string;
  goal: string;
  phase: "planning" | "pre-release" | "release" | "post-release" | "evergreen";
  status: "draft" | "active" | "paused" | "complete";
  primary_cta: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtistTaskRow {
  id: string;
  brand_id: string;
  user_id: string;
  campaign_id: string | null;
  music_project_id: string | null;
  title: string;
  description: string;
  status: ArtistTaskStatus;
  priority: ArtistTaskPriority;
  due_at: string | null;
  source: string;
  created_by: "user" | "assistant" | "automation";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtistContentRow {
  id: string;
  brand_id: string;
  user_id: string;
  campaign_id: string | null;
  music_project_id: string | null;
  platform: string;
  format: string;
  title: string;
  caption: string;
  status: "idea" | "draft" | "approved" | "scheduled" | "published" | "archived";
  scheduled_for: string | null;
  published_at: string | null;
  performance: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ArtistLinkRow {
  id: string;
  brand_id: string;
  user_id: string;
  campaign_id: string | null;
  label: string;
  url: string;
  kind: string;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArtistAgentMessageRow {
  id: string;
  brand_id: string;
  user_id: string;
  role: "user" | "assistant";
  body: string;
  model: string | null;
  action_log: Array<Record<string, unknown>>;
  created_at: string;
}

export interface ArtistActivityRow {
  id: string;
  brand_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
