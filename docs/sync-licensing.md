# Music OS Sync & Licensing

Music OS now treats sync licensing as a song-level production concern instead of an after-release spreadsheet.

## Canonical identity

Every Sync Track references the existing `music_projects.id`. No second Music OS song ID is created. A unique owner/project index prevents duplicate Sync records for the same Music OS project.

## Dashboard workflow

Open any song in `/dashboard` and select **Sync**.

The panel covers:

- rights/control audit and one-stop status;
- master/publishing owner and PRO metadata;
- ISRC, BPM, key, moods and scene-use tags;
- explicit, clean, instrumental, acapella, TV mix, stems, lyrics and 60/30/15-second availability;
- detected Music OS stem/lyrics/filename hints;
- saved licensing briefs and deadlines;
- song-specific submissions and follow-ups;
- quoted and final license fees;
- contract status;
- placement state;
- PRO royalty tracking.

Music OS asset detection is a hint, not a clearance decision. The user must review the Sync checklist before saving.

## Shared Artist OS model

`artist_sync_tracks`, `artist_sync_opportunities`, and `artist_sync_submissions` are shared with JO₵YN Artist OS. Music OS is the production/song view; Artist OS is the catalog/executive view.

## Database

Apply `db/music-os-phase17.sql` after the existing Music OS schema phases. The production `music-os` Supabase project already has the Phase 17 schema as of November 9, 2026.
