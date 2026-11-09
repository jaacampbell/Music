# Sync & Licensing Verification

Branch: `feature/sync-licensing-dashboard-20261109`

## Implemented

- [x] Song Dashboard exposes a **Sync** tab for every canonical `music_projects.id`.
- [x] Sync Track uses the existing Music OS project UUID.
- [x] One Sync row per owner/project is enforced in the production database.
- [x] Rights/control audit, one-stop validation, PRO/ISRC metadata and scene-use tags are editable.
- [x] Alternate deliverables include explicit, clean, instrumental, acapella, TV mix, stems, lyrics and 60/30/15-second cuts.
- [x] Music OS asset detection is advisory only and requires review before save.
- [x] Licensing opportunities/briefs can be stored with source, deadline, use case and budget notes.
- [x] Song submissions track status, follow-up, quoted/final fee, contract state, placement and PRO tracking.
- [x] Ask Music receives the verified song-level Sync record as project context.
- [x] Artist OS branch reuses the same Sync row by `music_project_id` instead of creating a duplicate.

## Database checks

- [x] RLS enabled on all three Sync tables.
- [x] Anonymous table access revoked.
- [x] Authenticated grants restricted to SELECT / INSERT / UPDATE / DELETE.
- [x] New Sync tables have no current Supabase security-advisor findings.
- [x] Sync Track foreign keys are covered by indexes.
- [x] Unique index protects `(user_id, music_project_id)`.

## Preview acceptance

1. Sign into the deploy preview with the Music OS catalog-owner account.
2. Open an existing song in `/dashboard`.
3. Confirm **Sync** appears in the song tabs and from the Overview action row.
4. Start a Sync Audit and confirm the created row uses the same project UUID.
5. Confirm stored stems and lyrics appear as detection hints.
6. Confirm one-stop cannot save below 100% master + 100% publishing control.
7. Save ISRC, rights owners, PRO, moods and use cases; refresh and confirm persistence.
8. Add a licensing opportunity with a deadline.
9. Log a submission and update follow-up, fee, contract state and PRO tracking.
10. Ask Music whether the song is sync-ready and confirm it references saved Sync data without inventing missing clearance.
11. Open the related Artist OS composition and confirm it reuses the same project-linked Sync record.
12. Confirm Versions, Files, Compare, Release and Ask Music still work normally.

## Deployment gate

Do not merge to `main` until the latest Netlify deploy preview is **ready** and the logged-in acceptance steps above are reviewed.
