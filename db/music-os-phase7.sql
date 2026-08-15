-- Music OS Phase 7: Edge Function worker mirror gateway.
-- Run after db/music-os-phase6.sql. Safe to re-run.
--
-- The GPU worker never receives a Supabase admin key. It derives an HMAC key from
-- SEPARATOR_GATEWAY_SECRET and sends signed lifecycle payloads to the
-- stem-worker-mirror Edge Function. The Edge Function verifies the HMAC and uses
-- its built-in Supabase server credential for the narrow music_stem_jobs upsert.

create table if not exists public.music_worker_config (
  key text primary key,
  value_hash text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists music_worker_config_updated_at on public.music_worker_config;
create trigger music_worker_config_updated_at before update on public.music_worker_config
for each row execute function public.set_updated_at();

alter table public.music_worker_config enable row level security;
revoke all on public.music_worker_config from anon, authenticated;
grant select on public.music_worker_config to service_role;

drop policy if exists "deny_browser_access" on public.music_worker_config;
create policy "deny_browser_access" on public.music_worker_config
for all to anon, authenticated
using (false)
with check (false);

insert into public.music_worker_config (key, value_hash, description)
select
  'separator_gateway_hmac_key',
  encode(extensions.digest(convert_to(decrypted_secret, 'UTF8'), 'sha256'), 'hex'),
  'SHA-256 derived HMAC key for the Stem Worker Edge gateway. The original gateway secret remains encrypted in Vault.'
from vault.decrypted_secrets
where name = 'music_os_separator_gateway_secret'
limit 1
on conflict (key) do update set
  value_hash = excluded.value_hash,
  description = excluded.description,
  updated_at = now();

-- Phase 6 kept this RPC callable by anon/authenticated because it performed its
-- own HMAC verification. Phase 7 moves custom authentication to an Edge Function,
-- so remove API callers while retaining the function only as an emergency admin
-- rollback path.
revoke execute on function public.music_stem_worker_mirror(text, text) from anon, authenticated;

comment on table public.music_worker_config is
  'Server-only configuration for Music OS workers. Browser roles are explicitly denied and have no table privileges.';
