-- Music OS Phase 12: cloud-first stem ingress and cross-node execution recovery.
-- Run after db/music-os-phase11.sql. Safe to re-run.

alter table public.music_stem_jobs
  add column if not exists orchestration_id uuid,
  add column if not exists source_storage_path text,
  add column if not exists source_original_name text,
  add column if not exists source_mime_type text,
  add column if not exists source_byte_size bigint,
  add column if not exists source_sha256 text,
  add column if not exists worker_lease_expires_at timestamptz,
  add column if not exists lease_version integer not null default 0,
  add column if not exists recovery_generation integer not null default 0,
  add column if not exists recovered_from_node text,
  add column if not exists last_recovery_at timestamptz;

update public.music_stem_jobs
set orchestration_id = id
where orchestration_id is null;

alter table public.music_stem_jobs
  alter column orchestration_id set default gen_random_uuid(),
  alter column orchestration_id set not null,
  alter column worker_job_id drop not null;

create unique index if not exists music_stem_jobs_orchestration_uidx
  on public.music_stem_jobs(orchestration_id);
create index if not exists music_stem_jobs_lease_idx
  on public.music_stem_jobs(worker_lease_expires_at, status)
  where worker_lease_expires_at is not null;

-- Phase 12 introduces explicit pre-compute and cross-node recovery states.
do $$
begin
  alter table public.music_stem_jobs drop constraint if exists music_stem_jobs_status_check;
  alter table public.music_stem_jobs add constraint music_stem_jobs_status_check
    check (status in ('staging','queued','running','recovering','cancelling','completed','failed','cancelled'));
exception when duplicate_object then null;
end $$;

-- Source paths must stay inside the same private user/project prefix that Storage RLS uses.
-- The Edge artifact broker re-validates this exact ownership relationship before signing URLs.
comment on column public.music_stem_jobs.orchestration_id is
  'Stable cloud job identity shared across replaceable worker execution attempts.';
comment on column public.music_stem_jobs.source_storage_path is
  'Private music-assets object used as the durable source for initial execution and cross-node recovery.';
comment on column public.music_stem_jobs.worker_lease_expires_at is
  'Short execution lease renewed by the active worker lifecycle mirror; another node may claim only after expiry.';
comment on column public.music_stem_jobs.recovery_generation is
  'Number of times this orchestration moved to a different worker execution attempt.';
