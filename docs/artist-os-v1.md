# JO₵YN Artist OS V1

Artist OS extends Music OS from song production into artist management.

## V1 surfaces

- `/artist-os` — private command center.
- `/api/artist-assistant` — verified, project-aware artist-management assistant.
- `/jocyn` — public JO₵YN link hub driven by Artist OS.
- `db/music-os-phase16.sql` — workspace, brand, campaign, task, content, link, assistant, and activity tables.

## V1 behavior

The first visit bootstraps one workspace and one JO₵YN brand record for the signed-in owner. The model remains multi-brand: later brands use the same tables and workspace.

Tasks are persistent records. Completing a task changes its status to `done` and sets `completed_at`; it is not deleted. The command center hides completed work from the active queue while retaining it in completed history and the activity log.

The assistant may safely mutate tasks only when the user's message is explicit enough to identify a task action:

- `we need to finish the cover` creates a task.
- `add a task to edit Reel 2` creates a task.
- `I completed the final master` completes one clearly matching open task.
- ambiguous completion messages do not change multiple tasks.

All assistant reads and writes are owner-scoped after verifying the bearer session.

## Database

Run migrations through Phase 15 first, then:

```text
db/music-os-phase16.sql
```

Phase 16 uses the existing Supabase Auth + RLS model. Artist management tables keep `user_id` for owner scoping. Public access is restricted to public brand profile fields and visible link-hub records.

## Next build

The next slice should add richer release-to-campaign linking, reusable campaign templates, social-account connections, direct publishing adapters, link click analytics, and campaign-performance recommendations.
