-- Music OS Phase 13: worker-to-cloud permanent result persistence.
-- Run after db/music-os-phase12.sql. Safe to re-run.

alter table public.music_stem_jobs
  add column if not exists result_status text not null default 'pending',
  add column if not exists result_storage_prefix text,
  add column if not exists result_manifest_path text,
  add column if not exists result_report_path text,
  add column if not exists result_zip_path text,
  add column if not exists result_artifacts jsonb not null default '[]'::jsonb,
  add column if not exists result_artifact_count integer not null default 0,
  add column if not exists result_bytes bigint not null default 0,
  add column if not exists results_persisted_at timestamptz,
  add column if not exists result_error text;

do $$
begin
  alter table public.music_stem_jobs drop constraint if exists music_stem_jobs_result_status_check;
  alter table public.music_stem_jobs add constraint music_stem_jobs_result_status_check
    check (result_status in ('pending','persisting','complete','failed'));
exception when duplicate_object then null;
end $$;

alter table public.music_assets
  add column if not exists orchestration_id uuid,
  add column if not exists worker_job_id text,
  add column if not exists sha256 text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists music_assets_orchestration_path_uidx
  on public.music_assets(orchestration_id, storage_path)
  where orchestration_id is not null;

create index if not exists music_stem_jobs_result_status_idx
  on public.music_stem_jobs(result_status, updated_at desc);

comment on column public.music_stem_jobs.result_status is
  'Permanent-output persistence state. complete means all committed artifacts were verified through the Storage API.';
comment on column public.music_stem_jobs.result_artifacts is
  'Verified private Storage objects for this orchestration generation, including stems, manifest, report and organized ZIP.';
comment on column public.music_assets.orchestration_id is
  'Stable stem orchestration that produced this permanent project asset.';
