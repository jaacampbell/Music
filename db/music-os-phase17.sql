-- Music OS Phase 17: private, auditable AI Council decisions.
-- Intended for the music-os Supabase project; apply only after Phase 16.
-- No cross-tenant reads, no anon access, no public approvals, no automatic execution.
create table if not exists public.music_council_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key uuid not null,
  board_id text not null check (char_length(board_id) between 2 and 80),
  question text not null check (char_length(question) between 12 and 2000),
  context text not null default '' check (char_length(context) <= 5500),
  project_id uuid references public.music_projects(id) on delete set null,
  status text not null default 'running' check (status in ('running','completed','incomplete')),
  perspectives jsonb not null default '[]'::jsonb check (jsonb_typeof(perspectives) = 'array'),
  verdict text,
  model text not null default '',
  owner_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, request_key)
);
create index if not exists music_council_reviews_owner_recent_idx
  on public.music_council_reviews (user_id, created_at desc);
create index if not exists music_council_reviews_owner_project_idx
  on public.music_council_reviews (user_id, project_id, created_at desc);
alter table public.music_council_reviews enable row level security;
revoke all on table public.music_council_reviews from anon, authenticated;
grant select, insert, update on table public.music_council_reviews to authenticated;
drop policy if exists music_council_reviews_owner_select on public.music_council_reviews;
drop policy if exists music_council_reviews_owner_insert on public.music_council_reviews;
drop policy if exists music_council_reviews_owner_update on public.music_council_reviews;
create policy music_council_reviews_owner_select
  on public.music_council_reviews for select to authenticated
  using ((select auth.uid()) = user_id);
create policy music_council_reviews_owner_insert
  on public.music_council_reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy music_council_reviews_owner_update
  on public.music_council_reviews for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
