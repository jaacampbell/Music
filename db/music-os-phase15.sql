-- Music OS Phase 15: generalized wake-on-demand compute requests for vocal correction.
-- Run after db/music-os-phase14.sql. Safe to re-run.

create table if not exists public.music_compute_requests (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.music_projects(id) on delete cascade,
  kind text not null check (kind in ('vocal-correction')),
  mode text not null default 'deep' check (mode in ('core','deep')),
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  last_error text,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists music_compute_requests_demand_idx
  on public.music_compute_requests(status, expires_at, created_at desc);

drop trigger if exists music_compute_requests_updated_at on public.music_compute_requests;
create trigger music_compute_requests_updated_at before update on public.music_compute_requests
for each row execute function public.set_updated_at();

alter table public.music_compute_requests enable row level security;
revoke all on public.music_compute_requests from anon, authenticated;
grant select, insert, update on public.music_compute_requests to authenticated;
grant select, insert, update, delete on public.music_compute_requests to service_role;

drop policy if exists "users_read_own_compute_requests" on public.music_compute_requests;
create policy "users_read_own_compute_requests" on public.music_compute_requests
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users_create_own_compute_requests" on public.music_compute_requests;
create policy "users_create_own_compute_requests" on public.music_compute_requests
for insert to authenticated with check (
  auth.uid() = user_id
  and (project_id is null or exists (
    select 1 from public.music_projects p where p.id = project_id and p.user_id = auth.uid()
  ))
);

drop policy if exists "users_update_own_compute_requests" on public.music_compute_requests;
create policy "users_update_own_compute_requests" on public.music_compute_requests
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.music_compute_requests is
  'Short-lived authenticated demand signals for non-stem GPU tasks such as TM Vocal pitch/timing correction. The controller may wake only the already-approved RunPod Pod and only when paid auto-start is separately enabled.';
