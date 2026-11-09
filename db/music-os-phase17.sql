-- Music OS Phase 17: song-level Sync & Licensing
-- Safe/idempotent companion schema for the Music OS / Artist OS shared licensing workflow.

create table if not exists public.artist_sync_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid references public.artist_brands(id) on delete set null,
  composition_id uuid references public.songwriting_compositions(id) on delete set null,
  release_schedule_id uuid references public.artist_release_schedule(id) on delete set null,
  music_project_id uuid references public.music_projects(id) on delete set null,
  title text not null,
  status text not null default 'audit'
    check (status in ('audit','prep','ready','pitched','placed','hold')),
  one_stop boolean not null default false,
  master_control_pct numeric(5,2) not null default 0 check (master_control_pct between 0 and 100),
  publishing_control_pct numeric(5,2) not null default 0 check (publishing_control_pct between 0 and 100),
  master_owner text not null default '',
  publishing_owner text not null default '',
  pro_affiliation text not null default '',
  isrc text not null default '',
  bpm numeric,
  song_key text not null default '',
  explicit_available boolean not null default false,
  clean_available boolean not null default false,
  instrumental_available boolean not null default false,
  acapella_available boolean not null default false,
  tv_mix_available boolean not null default false,
  cut_60_available boolean not null default false,
  cut_30_available boolean not null default false,
  cut_15_available boolean not null default false,
  stems_available boolean not null default false,
  lyrics_available boolean not null default false,
  moods text not null default '',
  use_cases text not null default '',
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_sync_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  company text not null default '',
  source text not null default '',
  url text not null default '',
  deadline date,
  use_case text not null default '',
  budget_text text not null default '',
  status text not null default 'saved'
    check (status in ('saved','researching','pitching','submitted','closed','won','lost')),
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_sync_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.artist_sync_tracks(id) on delete cascade,
  opportunity_id uuid references public.artist_sync_opportunities(id) on delete set null,
  status text not null default 'prepared'
    check (status in ('prepared','submitted','follow_up','shortlisted','declined','placed','licensed','paid')),
  submitted_at timestamptz,
  follow_up_on date,
  quoted_fee numeric(12,2),
  license_fee numeric(12,2),
  contract_status text not null default 'not_started'
    check (contract_status in ('not_started','review','signature','fully_executed')),
  pro_tracking boolean not null default false,
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists artist_sync_tracks_user_composition_uidx
  on public.artist_sync_tracks(user_id, composition_id) where composition_id is not null;
create unique index if not exists artist_sync_tracks_user_music_project_uidx
  on public.artist_sync_tracks(user_id, music_project_id) where music_project_id is not null;
create index if not exists artist_sync_tracks_user_status_idx
  on public.artist_sync_tracks(user_id, status, updated_at desc);
create index if not exists artist_sync_tracks_brand_idx
  on public.artist_sync_tracks(brand_id) where brand_id is not null;
create index if not exists artist_sync_tracks_composition_idx
  on public.artist_sync_tracks(composition_id) where composition_id is not null;
create index if not exists artist_sync_tracks_release_idx
  on public.artist_sync_tracks(release_schedule_id) where release_schedule_id is not null;
create index if not exists artist_sync_tracks_music_project_idx
  on public.artist_sync_tracks(music_project_id) where music_project_id is not null;
create index if not exists artist_sync_opportunities_user_deadline_idx
  on public.artist_sync_opportunities(user_id, deadline, status);
create index if not exists artist_sync_submissions_user_status_idx
  on public.artist_sync_submissions(user_id, status, follow_up_on);
create index if not exists artist_sync_submissions_track_idx
  on public.artist_sync_submissions(track_id);
create index if not exists artist_sync_submissions_opportunity_idx
  on public.artist_sync_submissions(opportunity_id) where opportunity_id is not null;

alter table public.artist_sync_tracks enable row level security;
alter table public.artist_sync_opportunities enable row level security;
alter table public.artist_sync_submissions enable row level security;

drop policy if exists artist_sync_tracks_owner_all on public.artist_sync_tracks;
create policy artist_sync_tracks_owner_all on public.artist_sync_tracks
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists artist_sync_opportunities_owner_all on public.artist_sync_opportunities;
create policy artist_sync_opportunities_owner_all on public.artist_sync_opportunities
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists artist_sync_submissions_owner_all on public.artist_sync_submissions;
create policy artist_sync_submissions_owner_all on public.artist_sync_submissions
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on table public.artist_sync_tracks from anon, authenticated;
revoke all on table public.artist_sync_opportunities from anon, authenticated;
revoke all on table public.artist_sync_submissions from anon, authenticated;

grant select, insert, update, delete on table public.artist_sync_tracks to authenticated;
grant select, insert, update, delete on table public.artist_sync_opportunities to authenticated;
grant select, insert, update, delete on table public.artist_sync_submissions to authenticated;
