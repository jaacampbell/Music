# TM Music Studio Studio Brain

## Implemented

The existing Music OS song graph remains canonical. Studio Brain is mounted at
`/studio-brain` and linked from `/studio`. No new site or independent song IDs
are created.

- Creative, technical, and product-specification conversations.
- Beginner, intermediate, and advanced guidance.
- Fifteen editable personal DNA categories and a course-excerpt field.
- Explicit DNA opt-in. The JO₵YN starter is provisional and does not auto-enable.
- Signed-in account-scoped device DNA drafts, JSON export, and private versioned
  DNA snapshots stored as existing `music_assets` rows in `music-assets`.
- Manual restore of the selected song's latest DNA snapshot on another device.
- Existing RLS-backed project conversation history; general chat is session-only.
- Curated keyword retrieval over 24 educational knowledge cards, including
  official source links for U.S. collection organizations.
- Ten expandable tool specifications with guided chat starters, course mappings,
  interface descriptions, presets, proposed pricing, and implementation status.
- Server-verified bearer authentication, owner-filtered project reads under RLS,
  bounded input/output, request timeouts, and redacted provider failures.
- The old Dashboard Ask Music client now sends a bearer token and project ID.
  Its existing message-saving behavior is preserved.

## Runtime configuration

Reuse the existing server-only `OPENAI_API_KEY` and `OPENAI_MUSIC_MODEL`.
Do not expose these in public variables. Without a key, signed-in conversations
show explicitly labeled guided reference responses, not simulated live AI.
Supabase uses the existing public URL/key, verified user access tokens, project
tables, message table, and private bucket. No new migration is required.

## Boundaries and next phases

This release is an integrated assistant/knowledge/intake foundation. It is not
a native VST/AU processor, trained course model, automated industry policy
monitor, marketplace, billing implementation, or autonomous coding agent.
The actual course still needs to be supplied and reviewed.

The endpoint's per-instance request limiter is defense in depth, not a durable
cross-region quota. Before a public paid launch add persistent quotas,
entitlements, usage/cost accounting, source editorial review, privacy/retention
settings, and a formal evaluation set. Curated keyword retrieval should then
be upgraded to permission-filtered hybrid/vector retrieval.

Native processors require a separate audio/DSP implementation, validated
parameter adapters, signed installers, DAW compatibility tests, and a
documented license/offline policy. Pricing shown in specifications is a
hypothesis, not an active purchase offer.

## Verification

`node scripts/test-studio-brain.mjs`
`npm run lint`
`npm run build`
`python -m py_compile services/separator/app.py`

Browser checks should cover desktop/mobile overflow, all four panels,
starter approval, knowledge filtering, project context switching, signed-out
chat behavior, and exports. Live authenticated model calls require a real
user session and configured provider key; never substitute mocked success
for production validation.
