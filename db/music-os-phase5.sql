-- Music OS Phase 5: hierarchical Stem Director telemetry and worker-side lifecycle persistence.
-- Run after db/music-os-phase4.sql. Safe to re-run.

alter table public.music_stem_jobs
  add column if not exists events jsonb not null default '[]'::jsonb,
  add column if not exists source_profile jsonb,
  add column if not exists routing_summary jsonb not null default '[]'::jsonb,
  add column if not exists current_target text,
  add column if not exists source_lane text,
  add column if not exists resume_count integer not null default 0 check (resume_count >= 0),
  add column if not exists worker_version text;

create index if not exists music_stem_jobs_parent_worker_idx
  on public.music_stem_jobs(user_id, parent_worker_job_id)
  where parent_worker_job_id is not null;

comment on column public.music_stem_jobs.events is
  'Bounded worker agent timeline mirrored from the persistent GPU job state.';
comment on column public.music_stem_jobs.source_profile is
  'Measured source technical profile used by the Stem Director planner; not a claim that an LLM heard the audio.';
comment on column public.music_stem_jobs.routing_summary is
  'Target-by-target hierarchical routing decisions such as Lead Vocals from Core Vocals or Kick from Core Drums.';
comment on column public.music_stem_jobs.resume_count is
  'Number of automatic restart-recovery attempts for this worker job.';
comment on column public.music_stem_jobs.worker_version is
  'Agentic Stem worker version that last mirrored this job.';
