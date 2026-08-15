-- Music OS Phase 4: Agentic Stem System job persistence.
-- Run after db/music-os-phase3.sql. Safe to re-run.

create table if not exists public.music_stem_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.music_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  worker_job_id text not null,
  parent_worker_job_id text,
  status text not null default 'queued' check (status in ('queued','running','cancelling','completed','failed','cancelled')),
  stage text not null default 'queued',
  progress integer not null default 0 check (progress between 0 and 100),
  mode text not null default 'deep' check (mode in ('core','deep')),
  strategy text not null default 'auto',
  instruction text not null default '',
  requested_targets jsonb not null default '[]'::jsonb,
  plan jsonb,
  quality_summary jsonb,
  agent_report jsonb,
  manifest jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, worker_job_id)
);

create index if not exists music_stem_jobs_project_idx on public.music_stem_jobs(project_id, created_at desc);
create index if not exists music_stem_jobs_user_status_idx on public.music_stem_jobs(user_id, status, updated_at desc);
create index if not exists music_stem_jobs_project_fk_idx on public.music_stem_jobs(project_id);
create index if not exists music_stem_jobs_user_fk_idx on public.music_stem_jobs(user_id);

drop trigger if exists music_stem_jobs_updated_at on public.music_stem_jobs;
create trigger music_stem_jobs_updated_at before update on public.music_stem_jobs
for each row execute function public.set_updated_at();

alter table public.music_stem_jobs enable row level security;
grant select, insert, update, delete on public.music_stem_jobs to authenticated;

drop policy if exists "owner_select" on public.music_stem_jobs;
drop policy if exists "owner_insert" on public.music_stem_jobs;
drop policy if exists "owner_update" on public.music_stem_jobs;
drop policy if exists "owner_delete" on public.music_stem_jobs;

create policy "owner_select" on public.music_stem_jobs for select to authenticated
using ((select auth.uid()) = user_id and exists (select 1 from public.music_projects p where p.id = music_stem_jobs.project_id and p.user_id = (select auth.uid())));

create policy "owner_insert" on public.music_stem_jobs for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.music_projects p where p.id = music_stem_jobs.project_id and p.user_id = (select auth.uid())));

create policy "owner_update" on public.music_stem_jobs for update to authenticated
using ((select auth.uid()) = user_id and exists (select 1 from public.music_projects p where p.id = music_stem_jobs.project_id and p.user_id = (select auth.uid())))
with check ((select auth.uid()) = user_id and exists (select 1 from public.music_projects p where p.id = music_stem_jobs.project_id and p.user_id = (select auth.uid())));

create policy "owner_delete" on public.music_stem_jobs for delete to authenticated
using ((select auth.uid()) = user_id and exists (select 1 from public.music_projects p where p.id = music_stem_jobs.project_id and p.user_id = (select auth.uid())));
