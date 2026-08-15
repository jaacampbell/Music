-- Music OS Phase 13: always-on compute controller state.
-- Run after db/music-os-phase12.sql. Safe to re-run.

create table if not exists public.music_compute_state (
  key text primary key,
  provider text not null default 'runpod',
  provider_node_id text,
  state text not null default 'standby'
    check (state in ('disabled','standby','demand','waking','ready','busy','cooldown','stopping','error')),
  auto_start_enabled boolean not null default false,
  auto_stop_enabled boolean not null default false,
  idle_timeout_seconds integer not null default 600 check (idle_timeout_seconds between 60 and 86400),
  pending_jobs integer not null default 0 check (pending_jobs >= 0),
  active_jobs integer not null default 0 check (active_jobs >= 0),
  ready_workers integer not null default 0 check (ready_workers >= 0),
  deep_ready_workers integer not null default 0 check (deep_ready_workers >= 0),
  last_demand_at timestamptz,
  last_action_at timestamptz,
  last_seen timestamptz not null default now(),
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists music_compute_state_updated_at on public.music_compute_state;
create trigger music_compute_state_updated_at before update on public.music_compute_state
for each row execute function public.set_updated_at();

alter table public.music_compute_state enable row level security;
revoke all on public.music_compute_state from anon, authenticated;
grant select on public.music_compute_state to authenticated;
grant select, insert, update, delete on public.music_compute_state to service_role;

drop policy if exists "authenticated_read_compute_state" on public.music_compute_state;
create policy "authenticated_read_compute_state" on public.music_compute_state
for select to authenticated using (true);

comment on table public.music_compute_state is
  'Safe operational state published by the trusted always-on Stem Compute Controller. Provider credentials never enter this table.';
comment on column public.music_compute_state.auto_start_enabled is
  'True only when the trusted controller is explicitly authorized to start paid GPU compute.';
comment on column public.music_compute_state.provider_node_id is
  'Approved provider node managed by the controller. The controller never auto-creates a billable node.';
