-- Music OS Phase 16: JO₵YN Artist OS foundation.
-- Adds a scalable workspace/brand layer, artist campaigns, cross-project tasks,
-- content planning, public link hub records, assistant history, and activity logs.
-- Run after db/music-os-phase15.sql. Safe to re-run.

create table if not exists public.artist_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.artist_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  stylized_name text not null default '',
  slug text not null unique,
  brand_type text not null default 'artist',
  bio text not null default '',
  audience text not null default '',
  voice text not null default '',
  visual_direction text not null default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, display_name)
);

create table if not exists public.artist_campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.artist_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  music_project_id uuid references public.music_projects(id) on delete set null,
  title text not null,
  goal text not null default '',
  phase text not null default 'planning' check (phase in ('planning','pre-release','release','post-release','evergreen')),
  status text not null default 'draft' check (status in ('draft','active','paused','complete')),
  primary_cta text not null default '',
  start_at date,
  end_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_tasks (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.artist_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.artist_campaigns(id) on delete set null,
  music_project_id uuid references public.music_projects(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo','doing','blocked','done','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  due_at timestamptz,
  source text not null default 'manual',
  created_by text not null default 'user' check (created_by in ('user','assistant','automation')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_content_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.artist_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.artist_campaigns(id) on delete set null,
  music_project_id uuid references public.music_projects(id) on delete set null,
  platform text not null default 'instagram',
  format text not null default 'post',
  title text not null,
  caption text not null default '',
  status text not null default 'idea' check (status in ('idea','draft','approved','scheduled','published','archived')),
  scheduled_for timestamptz,
  published_at timestamptz,
  performance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_links (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.artist_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.artist_campaigns(id) on delete set null,
  label text not null,
  url text not null,
  kind text not null default 'link',
  position integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_agent_messages (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.artist_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  body text not null,
  model text,
  action_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.artist_activity (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.artist_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists artist_workspaces_owner_idx on public.artist_workspaces(owner_id, updated_at desc);
create index if not exists artist_brands_user_idx on public.artist_brands(user_id, updated_at desc);
create index if not exists artist_campaigns_brand_idx on public.artist_campaigns(brand_id, status, updated_at desc);
create index if not exists artist_tasks_brand_idx on public.artist_tasks(brand_id, status, due_at, created_at desc);
create index if not exists artist_content_brand_idx on public.artist_content_items(brand_id, status, scheduled_for);
create index if not exists artist_links_brand_idx on public.artist_links(brand_id, position);
create index if not exists artist_agent_messages_brand_idx on public.artist_agent_messages(brand_id, created_at desc);
create index if not exists artist_activity_brand_idx on public.artist_activity(brand_id, created_at desc);
create index if not exists artist_activity_user_idx on public.artist_activity(user_id);
create index if not exists artist_agent_messages_user_idx on public.artist_agent_messages(user_id);
create index if not exists artist_campaigns_user_idx on public.artist_campaigns(user_id);
create index if not exists artist_campaigns_music_project_idx on public.artist_campaigns(music_project_id);
create index if not exists artist_content_user_idx on public.artist_content_items(user_id);
create index if not exists artist_content_campaign_idx on public.artist_content_items(campaign_id);
create index if not exists artist_content_music_project_idx on public.artist_content_items(music_project_id);
create index if not exists artist_links_user_idx on public.artist_links(user_id);
create index if not exists artist_links_campaign_idx on public.artist_links(campaign_id);
create index if not exists artist_tasks_user_idx on public.artist_tasks(user_id);
create index if not exists artist_tasks_campaign_idx on public.artist_tasks(campaign_id);
create index if not exists artist_tasks_music_project_idx on public.artist_tasks(music_project_id);

drop trigger if exists artist_workspaces_updated_at on public.artist_workspaces;
create trigger artist_workspaces_updated_at before update on public.artist_workspaces
for each row execute function public.set_updated_at();

drop trigger if exists artist_brands_updated_at on public.artist_brands;
create trigger artist_brands_updated_at before update on public.artist_brands
for each row execute function public.set_updated_at();

drop trigger if exists artist_campaigns_updated_at on public.artist_campaigns;
create trigger artist_campaigns_updated_at before update on public.artist_campaigns
for each row execute function public.set_updated_at();

drop trigger if exists artist_tasks_updated_at on public.artist_tasks;
create trigger artist_tasks_updated_at before update on public.artist_tasks
for each row execute function public.set_updated_at();

drop trigger if exists artist_content_items_updated_at on public.artist_content_items;
create trigger artist_content_items_updated_at before update on public.artist_content_items
for each row execute function public.set_updated_at();

drop trigger if exists artist_links_updated_at on public.artist_links;
create trigger artist_links_updated_at before update on public.artist_links
for each row execute function public.set_updated_at();

alter table public.artist_workspaces enable row level security;
alter table public.artist_brands enable row level security;
alter table public.artist_campaigns enable row level security;
alter table public.artist_tasks enable row level security;
alter table public.artist_content_items enable row level security;
alter table public.artist_links enable row level security;
alter table public.artist_agent_messages enable row level security;
alter table public.artist_activity enable row level security;

grant select, insert, update, delete on public.artist_workspaces to authenticated;
grant select, insert, update, delete on public.artist_brands to authenticated;
grant select, insert, update, delete on public.artist_campaigns to authenticated;
grant select, insert, update, delete on public.artist_tasks to authenticated;
grant select, insert, update, delete on public.artist_content_items to authenticated;
grant select, insert, update, delete on public.artist_links to authenticated;
grant select, insert, update, delete on public.artist_agent_messages to authenticated;
grant select, insert, update, delete on public.artist_activity to authenticated;

grant select on public.artist_brands to anon;
grant select on public.artist_links to anon;

do $$
declare
  t text;
begin
  foreach t in array array[
    'artist_brands','artist_campaigns','artist_tasks','artist_content_items',
    'artist_links','artist_agent_messages','artist_activity'
  ] loop
    execute format('drop policy if exists "artist_owner_select" on public.%I', t);
    execute format('drop policy if exists "artist_owner_insert" on public.%I', t);
    execute format('drop policy if exists "artist_owner_update" on public.%I', t);
    execute format('drop policy if exists "artist_owner_delete" on public.%I', t);
    execute format('create policy "artist_owner_select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "artist_owner_insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "artist_owner_update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "artist_owner_delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

drop policy if exists "artist_workspace_owner_select" on public.artist_workspaces;
drop policy if exists "artist_workspace_owner_insert" on public.artist_workspaces;
drop policy if exists "artist_workspace_owner_update" on public.artist_workspaces;
drop policy if exists "artist_workspace_owner_delete" on public.artist_workspaces;

create policy "artist_workspace_owner_select" on public.artist_workspaces
for select to authenticated using ((select auth.uid()) = owner_id);
create policy "artist_workspace_owner_insert" on public.artist_workspaces
for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "artist_workspace_owner_update" on public.artist_workspaces
for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "artist_workspace_owner_delete" on public.artist_workspaces
for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "artist_public_brand_select" on public.artist_brands;
create policy "artist_public_brand_select" on public.artist_brands
for select to anon using (is_public = true);

drop policy if exists "artist_public_link_select" on public.artist_links;
create policy "artist_public_link_select" on public.artist_links
for select to anon using (
  is_visible = true
  and exists (
    select 1 from public.artist_brands b
    where b.id = brand_id and b.is_public = true
  )
);

comment on table public.artist_brands is
  'Brand identity records for Artist OS. V1 uses JO₵YN; future brands can share the same workspace.';
comment on table public.artist_tasks is
  'Persistent artist-management tasks. Completed work remains in history instead of being deleted.';
comment on table public.artist_activity is
  'Append-only style audit trail for assistant/user task and campaign actions.';
