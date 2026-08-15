-- Music OS Phase 11: dynamic Stem Worker Mesh registry and job routing metadata.
-- Run after db/music-os-phase7.sql. Safe to re-run.

create table if not exists public.music_worker_nodes (
  node_id text primary key,
  provider text not null default 'custom',
  provider_node_id text,
  origin text not null,
  status text not null default 'ready' check (status in ('ready','busy','draining','degraded','offline')),
  worker_version text,
  region text,
  gpu_name text,
  cuda_version text,
  sam_audio boolean not null default false,
  deep_ready boolean not null default false,
  hierarchical_routing boolean not null default false,
  restart_recovery boolean not null default false,
  cloud_mirror boolean not null default false,
  current_jobs integer not null default 0 check (current_jobs >= 0),
  capacity integer not null default 1 check (capacity > 0),
  cost_per_hr numeric(10,4),
  capabilities jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists music_worker_nodes_routing_idx
  on public.music_worker_nodes(status, deep_ready, current_jobs, last_seen desc);
create index if not exists music_worker_nodes_provider_idx
  on public.music_worker_nodes(provider, provider_node_id)
  where provider_node_id is not null;

drop trigger if exists music_worker_nodes_updated_at on public.music_worker_nodes;
create trigger music_worker_nodes_updated_at before update on public.music_worker_nodes
for each row execute function public.set_updated_at();

alter table public.music_worker_nodes enable row level security;
revoke all on public.music_worker_nodes from anon, authenticated;
grant select on public.music_worker_nodes to authenticated;
grant select, insert, update, delete on public.music_worker_nodes to service_role;

drop policy if exists "authenticated_read_worker_mesh" on public.music_worker_nodes;
create policy "authenticated_read_worker_mesh" on public.music_worker_nodes
for select to authenticated using (true);

alter table public.music_stem_jobs
  add column if not exists worker_node_id text,
  add column if not exists worker_origin text;

create index if not exists music_stem_jobs_worker_node_idx
  on public.music_stem_jobs(worker_node_id, updated_at desc)
  where worker_node_id is not null;

comment on table public.music_worker_nodes is
  'Safe routing metadata for authenticated Music OS users. Worker registration writes are restricted to service-role Edge gateways.';
comment on column public.music_worker_nodes.origin is
  'Public HTTPS origin used by the authenticated browser after the server gateway chooses this worker.';
comment on column public.music_stem_jobs.worker_node_id is
  'Worker Mesh node that executed the job, enabling support, routing analysis and future failover.';
