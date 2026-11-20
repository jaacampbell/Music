# Music OS · Council Engine V1 (November 20, 2026)

## What exists
- A private, authenticated Council workspace at \`/artist-os/councils\`, linked from Artist OS sidebar.
- Eight reusable boards: Decision, Music A&R, Music Production, Music Release, JO₵YN Brand/PR, Creative, Executive, and Engineering.
- Five independent role-constrained reviews per board, followed by a chairman synthesis *only if every advisor completes*. Individual opinions are preserved in order.
- Owner-scoped Supabase decision archive, protected by RLS, with explicit \`running\`, \`completed\`, or \`incomplete\` state.
- Verified project metadata is attached only for a music project owned by the logged-in user.
- No auto-posting, auto-release, code modification, record approval, outreach, payments, or credits except AI provider usage for a review.

## Setup / activation
1. Deploy \`db/music-os-phase17.sql\` to the verified **music-os** Supabase database (after phase16), then inspect policies and grants.
2. Ensure deployment has \`NEXT_PUBLIC_SUPABASE_URL\`, \`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\` (or legacy anon) and server-only \`OPENAI_API_KEY\`. Optional \`OPENAI_COUNCIL_MODEL\` otherwise uses configured Artist/Music model. Never expose the API key with \`NEXT_PUBLIC_\`.
3. Deploy the Next.js branch after CI and owner review.
4. Log into Artist OS, open **Councils**, confirm GET loads with no archived data leakage.
5. Submit a synthetic review, verify five independent critiques and a chair verdict, reload and check persisted history; repeat under a different user and confirm no cross-user reads.
6. Simulate provider failure and verify status **incomplete** with no invented verdict. Test idempotency using the same \`requestKey\`, and check 429 budget limit after four new reviews in one hour.

## Runtime contract and cost
- A full review uses up to six **separate** model requests (five advisor prompts, one chair prompt). Incomplete reviews stop before the chair. No hidden retries.
- Advisor execution is capped at 2 simultaneous requests in the API (engine hard limit 3). Provider timeout is 30 seconds per request. Outputs are bounded.
- Backend limits new runs to four per user per hour **per runtime instance**; use an upstream durable limiter if horizontally scaled. Database uniqueness on \`(user_id, request_key)\` prevents double billing on the same client request key across instances.
- Save the request key and \`running\` record *before* any billable call. If a process crashes, the record remains \`running\` and must be inspected manually; do not blindly retry or reset it.
- Only request body and verified owner-scoped project metadata are sent to the model. No audio content is uploaded or analyzed.
- The archive is editable by its owner using authenticated Data API grants. It is owner-private, **not cryptographically immutable**; rely on provider logs and additional server attestations for formal audits.
- Model-generated decisions are opinions, not actual independent providers. They are not legal advice, clearance confirmation or completed actions.

## Remaining connections
- The standalone JO₵YN site, OTC Brain OS and GeauxFotos do not yet call this API. Cross-product authentication and tenancy must be explicitly designed rather than sharing JWTs or service keys.
- The existing Producer DNA \`ar-agent\` remains a defined agent for its creative pipeline; it is **not** silently dispatched by Council V1. The Council A&R critic is an independent role.
- There is no audio playback/evaluation in the council API. Reviewed WAV measurements must come from an explicitly integrated audio analysis tool.
- Rate limiting is in-memory in this release, and model budget accounting is request-count rather than exact token billing. Add durable quotas and provider usage telemetry before scaling.
- The 15-seat GeauxFotos executive report remains a separate advisory artifact, not an automatic 15-call panel.
