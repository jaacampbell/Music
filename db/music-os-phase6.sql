-- Music OS Phase 6: least-privilege worker lifecycle mirror.
-- Run after db/music-os-phase5.sql. Safe to re-run.
--
-- The GPU worker signs a compact JSON payload with SEPARATOR_GATEWAY_SECRET.
-- This security-definer RPC verifies the signature against the encrypted Vault copy,
-- verifies timestamp freshness, validates project/user ownership, then upserts only
-- the worker's music_stem_jobs row. The worker therefore does not need a Supabase
-- secret/service-role API key for lifecycle mirroring.

create or replace function public.music_stem_worker_mirror(
  payload_text text,
  signature_hex text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  gateway_secret text;
  expected_signature text;
  payload jsonb;
  sent_at bigint;
  now_epoch bigint := extract(epoch from now())::bigint;
  v_project_id uuid;
  v_user_id uuid;
  v_worker_job_id text;
  v_status text;
  v_stage text;
  v_progress integer;
begin
  select decrypted_secret
    into gateway_secret
    from vault.decrypted_secrets
   where name = 'music_os_separator_gateway_secret'
   limit 1;

  if gateway_secret is null or length(gateway_secret) < 32 then
    raise exception 'Stem worker gateway secret is not configured.' using errcode = '42501';
  end if;

  expected_signature := encode(
    extensions.hmac(convert_to(payload_text, 'UTF8'), convert_to(gateway_secret, 'UTF8'), 'sha256'),
    'hex'
  );

  if signature_hex is null
     or length(signature_hex) <> 64
     or expected_signature <> lower(signature_hex) then
    raise exception 'Invalid stem worker signature.' using errcode = '42501';
  end if;

  begin
    payload := payload_text::jsonb;
    sent_at := (payload ->> 'sentAt')::bigint;
    v_project_id := (payload ->> 'project_id')::uuid;
    v_user_id := (payload ->> 'user_id')::uuid;
  exception when others then
    raise exception 'Invalid stem worker payload.' using errcode = '22023';
  end;

  if abs(now_epoch - sent_at) > 300 then
    raise exception 'Expired stem worker payload.' using errcode = '42501';
  end if;

  v_worker_job_id := nullif(payload ->> 'worker_job_id', '');
  v_status := coalesce(nullif(payload ->> 'status', ''), 'queued');
  v_stage := coalesce(nullif(payload ->> 'stage', ''), 'queued');
  v_progress := greatest(0, least(100, coalesce((payload ->> 'progress')::integer, 0)));

  if v_worker_job_id is null or v_worker_job_id !~ '^[a-f0-9]{12}$' then
    raise exception 'Invalid worker job id.' using errcode = '22023';
  end if;

  if v_status not in ('queued','running','cancelling','completed','failed','cancelled') then
    raise exception 'Invalid stem worker status.' using errcode = '22023';
  end if;

  if not exists (
    select 1
      from public.music_projects p
     where p.id = v_project_id
       and p.user_id = v_user_id
  ) then
    raise exception 'Stem worker project ownership mismatch.' using errcode = '42501';
  end if;

  insert into public.music_stem_jobs (
    project_id,
    user_id,
    worker_job_id,
    parent_worker_job_id,
    status,
    stage,
    progress,
    mode,
    strategy,
    instruction,
    requested_targets,
    plan,
    quality_summary,
    agent_report,
    manifest,
    error,
    started_at,
    completed_at,
    events,
    source_profile,
    routing_summary,
    current_target,
    source_lane,
    resume_count,
    worker_version
  ) values (
    v_project_id,
    v_user_id,
    v_worker_job_id,
    nullif(payload ->> 'parent_worker_job_id', ''),
    v_status,
    v_stage,
    v_progress,
    case when payload ->> 'mode' in ('core','deep') then payload ->> 'mode' else 'deep' end,
    coalesce(nullif(payload ->> 'strategy', ''), 'auto'),
    coalesce(payload ->> 'instruction', ''),
    coalesce(payload -> 'requested_targets', '[]'::jsonb),
    payload -> 'plan',
    payload -> 'quality_summary',
    payload -> 'agent_report',
    payload -> 'manifest',
    nullif(payload ->> 'error', ''),
    case when nullif(payload ->> 'started_at', '') is null then null else (payload ->> 'started_at')::timestamptz end,
    case when nullif(payload ->> 'completed_at', '') is null then null else (payload ->> 'completed_at')::timestamptz end,
    coalesce(payload -> 'events', '[]'::jsonb),
    payload -> 'source_profile',
    coalesce(payload -> 'routing_summary', '[]'::jsonb),
    nullif(payload ->> 'current_target', ''),
    nullif(payload ->> 'source_lane', ''),
    greatest(0, coalesce((payload ->> 'resume_count')::integer, 0)),
    nullif(payload ->> 'worker_version', '')
  )
  on conflict (user_id, worker_job_id) do update set
    project_id = excluded.project_id,
    parent_worker_job_id = excluded.parent_worker_job_id,
    status = excluded.status,
    stage = excluded.stage,
    progress = excluded.progress,
    mode = excluded.mode,
    strategy = excluded.strategy,
    instruction = excluded.instruction,
    requested_targets = excluded.requested_targets,
    plan = excluded.plan,
    quality_summary = excluded.quality_summary,
    agent_report = excluded.agent_report,
    manifest = excluded.manifest,
    error = excluded.error,
    started_at = coalesce(excluded.started_at, public.music_stem_jobs.started_at),
    completed_at = excluded.completed_at,
    events = excluded.events,
    source_profile = excluded.source_profile,
    routing_summary = excluded.routing_summary,
    current_target = excluded.current_target,
    source_lane = excluded.source_lane,
    resume_count = excluded.resume_count,
    worker_version = excluded.worker_version,
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'workerJobId', v_worker_job_id,
    'status', v_status,
    'progress', v_progress
  );
end;
$$;

revoke all on function public.music_stem_worker_mirror(text, text) from public;
grant execute on function public.music_stem_worker_mirror(text, text) to anon, authenticated;

comment on function public.music_stem_worker_mirror(text, text) is
  'HMAC-authenticated least-privilege lifecycle mirror for the Agentic Stem GPU worker. Uses the encrypted music_os_separator_gateway_secret in Supabase Vault.';
