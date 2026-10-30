# TM Vocal web workspace

TM Vocal is a personal, user-supported production tool. It has no pricing, subscriptions, checkout, payment gates, or marketplace. Future business integrations require an explicit user request.

Open `/tm-vocal` from `/studio`, or open a saved song via `/tm-vocal?projectId=<music_projects.id>`. `/tm-sessions` reviews private cloud handoffs and song-level notes.

## Working processing

- Web Audio EQ (low cut, 220 Hz body, 3 kHz presence, 9 kHz air), compression, soft saturation with 2× oversampling, convolution reverb, feedback delay, short stereo-delay widening, and fast peak containment.
- Ordered rack with add/remove/reorder, simple macros and advanced parameters, bounded local phrase commands, undo/redo, named signature chains, and editable genre/role starting presets.
- Decoded waveform, peak/RMS, near-full-scale sample flags, and filtered band-energy analysis. Analysis suggestions are hypotheses for audition, not a quality score or measured noise classification.
- Tonal reference suggestions compare relative body/presence/air energy in the first 20 seconds. Use an isolated vocal from Stem Director or a private saved stem. No original chain, dynamics, or space reconstruction is claimed.
- Instrumental audition level, a broad 3 kHz pocket cut, vocal-envelope ducking, and estimated beat key. Preview ducking uses the dry vocal envelope; combined export uses the rendered vocal. Key estimates have confidence and require listening confirmation.
- Dry, processed, and combined-mix 16-bit PCM WAV downloads. Processed/mix export blocks near-full-scale rendered peaks instead of silently clipping them. Export includes a 3-second vocal FX tail. RMS is not labeled LUFS; peak containment is not advertised as a true-peak limiter.
- TM Assistant receives chain settings, measured metadata and explicit session DNA, not audio. It uses the existing authenticated server endpoint and never changes knobs automatically. Local type-to-mix works without a model or sign-in.

## Session handoff and privacy

Device settings use `tm-vocal:v1:<canonical-project-id>`; unlinked work uses `device`. Audio buffers are in memory and must be exported or saved before leaving.

The cloud handoff reuses existing `music_projects`, `music_assets`, `music_waveform_comments` and private `music-assets` Storage. It verifies project ownership before upload. Dry/wet WAVs and an optional instrumental are registered first; the settings manifest is registered last and read back for verification. Failed saves attempt to remove partial assets and objects, reporting incomplete cleanup.

The JSON manifest is uploaded with `text/plain` MIME to work with the existing bucket allowlist. Its label is `TM Vocal session`. The Session Desk reads only data allowed by current RLS, restores chains onto the current device, reviews source/processed audio, and adds timestamped song-level vocal notes. It does not expand permissions, notify engineers, or create paid jobs. Separate engineer accounts and collaboration roles need a deliberate access design.

## Not shipped

AU/VST3/AAX native builds, real-time tuning, dynamic de-essing, AI denoise/de-reverb, formants/harmonies, automatic comping, section automation, full reference-chain estimation, cross-account engineer access, LUFS/true-peak/mono release checks, and social video generation.

## Validation

`node scripts/test-tm-vocal.mjs` validates parameter boundaries, preset variants, phrase mapping, WAV interleaving/clamping, project ownership, manifest verification and failed-upload cleanup. Run the existing Studio Brain tests, lint, production build, separator syntax and production-invariant checks as well. Cloud upload success still requires an authenticated account and its deployed RLS/bucket configuration; unauthenticated review never bypasses it.
