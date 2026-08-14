-- Music OS Phase 2: persistent projects, private libraries, versions, comments,
-- release records, tasks, comparisons, and private cloud assets.
-- Run this file in the Supabase SQL editor for the project used by Music OS.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.music_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  brief text not null default '',
  status text not null default 'draft' check (status in ('draft', 'in-progress', 'mixing', 'ready-for-release', 'released', 'archived')),
  bpm numeric(6,2),
  song_key text,
  readiness integer not null default 10 check (readiness between 0 and 100),
  active_section text not null default 'idea',
  artwork_path text,
  last_opened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists music_projects_user_updated_idx
  on public.music_projects(user_id, updated_at desc);

create table if not exists public.music_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.music_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null,
  label text not null,
  notes text not null default '',
  storage_path text,
  original_name text,
  mime_type text,
  byte_size bigint,
  duration_sec numeric(10,3),
  bpm numeric(6,2),
  song_key text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  unique(project_id, version_number)
);

create index if not exists music_versions_project_idx
  on public.music_versions(project_id, created_at desc);

create table if not exists public.music_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.music_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('artwork', 'stem', 'master', 'mix', 'reference', 'agreement', 'lyrics', 'other')),
  label text not null,
  storage_path text not null,
  original_name text not null,
  mime_type text,
  byte_size bigint,
  duration_sec numeric(10,3),
  created_at timestamptz not null default now()
);

create index if not exists music_assets_project_idx
  on public.music_assets(project_id, created_at desc);

create table if not exists public.music_waveform_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.music_projects(id) on delete cascade,
  version_id uuid references public.music_versions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp_ms integer not null check (timestamp_ms >= 0),
  body text not null,
  kind text not null default 'mix-note' check (kind in ('mix-note', 'arrangement', 'vocal', 'production', 'fix')),
  created_at timestamptz not null default now()
);

create index if not exists music_waveform_comments_version_idx
  on public.music_waveform_comments(version_id, timestamp_ms);

create table if not exists public.music_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.music_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists music_tasks_project_idx
  on public.music_tasks(project_id, status, created_at);

create table if not exists public.music_comparisons (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.music_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_a_id uuid not null references public.music_versions(id) on delete cascade,
  version_b_id uuid not null references public.music_versions(id) on delete cascade,
  drums_choice text check (drums_choice in ('a', 'b', 'tie')),
  atmosphere_choice text check (atmosphere_choice in ('a', 'b', 'tie')),
  vocal_space_choice text check (vocal_space_choice in ('a', 'b', 'tie')),
  low_end_choice text check (low_end_choice in ('a', 'b', 'tie')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.music_releases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.music_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  release_title text,
  artist_name text,
  release_date date,
  explicit boolean not null default false,
  isrc text,
  upc text,
  distributor text,
  master_ownership text,
  publishing_ownership text,
  splits jsonb not null default '[]'::jsonb,
  producer_agreements jsonb not null default '[]'::jsonb,
  ai_provenance jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  checklist jsonb not null default '{"splits":false,"producer_agreements":false,"master_ownership":false,"publishing":false,"samples":false,"artwork":false,"lyrics":false,"clean_version":false,"isrc":false,"upc":false,"distribution":false}'::jsonb,
  artwork_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.music_project_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.music_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists music_project_history_project_idx
  on public.music_project_history(project_id, created_at desc);

-- Keep timestamps current.
drop trigger if exists music_projects_updated_at on public.music_projects;
create trigger music_projects_updated_at before update on public.music_projects
for each row execute function public.set_updated_at();

drop trigger if exists music_tasks_updated_at on public.music_tasks;
create trigger music_tasks_updated_at before update on public.music_tasks
for each row execute function public.set_updated_at();

drop trigger if exists music_releases_updated_at on public.music_releases;
create trigger music_releases_updated_at before update on public.music_releases
for each row execute function public.set_updated_at();

-- Row-level security: every exposed row is private to its owner.
alter table public.music_projects enable row level security;
alter table public.music_versions enable row level security;
alter table public.music_assets enable row level security;
alter table public.music_waveform_comments enable row level security;
alter table public.music_tasks enable row level security;
alter table public.music_comparisons enable row level security;
alter table public.music_releases enable row level security;
alter table public.music_project_history enable row level security;

grant select, insert, update, delete on public.music_projects to authenticated;
grant select, insert, update, delete on public.music_versions to authenticated;
grant select, insert, update, delete on public.music_assets to authenticated;
grant select, insert, update, delete on public.music_waveform_comments to authenticated;
grant select, insert, update, delete on public.music_tasks to authenticated;
grant select, insert, update, delete on public.music_comparisons to authenticated;
grant select, insert, update, delete on public.music_releases to authenticated;
grant select, insert, update, delete on public.music_project_history to authenticated;

-- Drop/recreate policies so this script is safely re-runnable.
do $$
declare
  t text;
begin
  foreach t in array array['music_projects','music_versions','music_assets','music_waveform_comments','music_tasks','music_comparisons','music_releases','music_project_history'] loop
    execute format('drop policy if exists "owner_select" on public.%I', t);
    execute format('drop policy if exists "owner_insert" on public.%I', t);
    execute format('drop policy if exists "owner_update" on public.%I', t);
    execute format('drop policy if exists "owner_delete" on public.%I', t);
    execute format('create policy "owner_select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "owner_insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "owner_update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "owner_delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Private cloud storage bucket. The first folder MUST be the authenticated user's UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'music-assets',
  'music-assets',
  false,
  524288000,
  array['audio/wav','audio/x-wav','audio/mpeg','audio/mp4','audio/flac','audio/aiff','audio/x-aiff','image/jpeg','image/png','image/webp','application/pdf','text/plain']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "music_assets_read_own" on storage.objects;
drop policy if exists "music_assets_upload_own" on storage.objects;
drop policy if exists "music_assets_update_own" on storage.objects;
drop policy if exists "music_assets_delete_own" on storage.objects;

create policy "music_assets_read_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'music-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "music_assets_upload_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'music-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "music_assets_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'music-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'music-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "music_assets_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'music-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
