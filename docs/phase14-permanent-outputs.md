# Phase 14 — Permanent Private Stem Outputs

Phase 14 closes the GPU-lifetime boundary for completed Stem Director jobs.

## Production contract

The production flow is now:

1. Project source audio is staged in the private `music-assets` bucket before compute.
2. Phase 13 wake-on-demand / standby control makes approved GPU capacity available when needed.
3. Worker Mesh selects a fresh compatible node and gives it a short execution lease.
4. A worker may recover the orchestration from the same durable source after the previous lease expires.
5. The worker generates Core / Deep stem outputs locally.
6. Before reporting `completed`, the Phase 14 worker asks `stem-worker-artifacts` for short-lived signed TUS upload slots.
7. WAV stems, `manifest.json`, `agent-report.json`, and `Agentic_Stem_Pack.zip` upload directly to private Supabase Storage.
8. The artifact broker verifies every object through the Storage API and commits result metadata to `music_stem_jobs` and `music_assets`.
9. Only after the permanent result commit succeeds may the worker job finish successfully.

A GPU can therefore disappear after completion without deleting the committed result set.

## Security boundary

- Workers receive no Supabase service-role or permanent Storage credential.
- Worker-to-broker requests use the existing derived HMAC worker identity.
- Output uploads use short-lived signed upload tokens scoped to a single private object path.
- Result paths are forced under the authenticated user/project/orchestration prefix.
- The broker verifies the worker still owns a live execution lease before issuing upload slots or accepting a result commit.
- Browser access to completed private results remains authenticated and can use short-lived signed read URLs.

## Database migration

Run `db/music-os-phase14.sql` after Phase 13. It adds result-persistence state to `music_stem_jobs` and orchestration metadata to `music_assets`.

`result_status = 'complete'` means the broker verified the permanent Storage objects and committed their metadata. Worker-local files alone do not satisfy this state.

## Deployment gates

Production readiness, Production Smoke, and the RunPod worker-control workflow require:

- Worker Mesh discovery
- durable private source recovery
- Phase 14 permanent outputs
- `tus-resumable-signed-token` upload capability
- a worker-side completion barrier

Compute may remain safely in standby while the control plane is healthy.

## Failure semantics

If permanent output persistence fails, a cloud-orchestrated job must fail rather than falsely report completion. The durable source remains available for a later recovery execution.

Phase 14 is durable replay and durable completed artifacts. It is not partial neural-model checkpoint resume.
