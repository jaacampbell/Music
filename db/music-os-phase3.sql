-- Music OS Phase 3: unify Guided/Studio, persistent Dashboard, and Stem Studio
-- around the same Supabase project UUID.
-- Run after db/music-os-phase2.sql. Safe to re-run.

alter table public.music_projects
  add column if not exists planning_state jsonb,
  add column if not exists source_audio_path text,
  add column if not exists live_analysis jsonb,
  add column if not exists last_synced_at timestamptz;

comment on column public.music_projects.planning_state is
  'Serialized command-center Project state. Uses the same UUID as music_projects.id.';
comment on column public.music_projects.source_audio_path is
  'Private Storage path for the canonical source audio attached from Studio/Stem Studio.';
comment on column public.music_projects.live_analysis is
  'Latest measured browser/worker audio analysis. Null means no measured analysis has run.';

-- The Phase 2 bucket was intentionally restrictive, but the product now stores
-- agreements, lyrics, archives, DAW handoff files, and generated stems. Keep it
-- private and size-limited while allowing the project library to accept those
-- real-world file types.
update storage.buckets
set file_size_limit = 524288000,
    allowed_mime_types = null,
    public = false
where id = 'music-assets';

create table if not exists public.music_agent_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.music_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  body text not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists music_agent_messages_project_idx
  on public.music_agent_messages(project_id, created_at desc);

alter table public.music_agent_messages enable row level security;
grant select, insert, update, delete on public.music_agent_messages to authenticated;

drop policy if exists "owner_select" on public.music_agent_messages;
drop policy if exists "owner_insert" on public.music_agent_messages;
drop policy if exists "owner_update" on public.music_agent_messages;
drop policy if exists "owner_delete" on public.music_agent_messages;

create policy "owner_select" on public.music_agent_messages
for select to authenticated using ((select auth.uid()) = user_id);
create policy "owner_insert" on public.music_agent_messages
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owner_update" on public.music_agent_messages
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "owner_delete" on public.music_agent_messages
for delete to authenticated using ((select auth.uid()) = user_id);
