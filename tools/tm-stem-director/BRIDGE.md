# TM Stem Director local bridge

Run `python tools/tm-stem-director/bridge_server.py` after the Mac dependencies in `README.md` are installed. It binds to **127.0.0.1 only**. `BridgeServer` raises if the host is anything else. Do not publish this port. The token is a local courtesy, not a multi-user security boundary.

`GET /health`, `GET /`, and `GET /console` are unauthenticated. Every `/jobs` route requires `Authorization: Bearer <token>` or `access_token` in the query string. The console stores `?access_token=` in `sessionStorage` and removes it from the address bar. Request logs replace the token with `[redacted]`.

## Routes

- `GET /health` — `{"service":"tm-stem-bridge","status":"ready","engine":"htdemucs_6s"}`.
- `GET /` and `GET /console` — the local mixer. Waveforms come from `decodeAudioData`. A failed decode stays empty.
- `POST /jobs` — JSON `{"audio":"/absolute/path/to/song.wav"}`. HTTP 202 with `id` and `status`, or 429 when active plus queued jobs are already at the limit.
- `GET /jobs/{id}` — `queued`, `processing`, `completed`, `failed`, or `cancelled`, plus progress, stage, and error.
- `POST /jobs/{id}/cancel` — HTTP 202. A queued job is cancelled before a worker starts. A running worker is terminated.
- `POST /jobs/{id}/reveal` — HTTP 200 only after `completed`. The bridge may ask the OS to show the export folder.
- `GET /jobs/{id}/stems/{name}` — WAV bytes for `vocals`, `drums`, `bass`, `guitar`, `piano`, or `other` after alignment has passed.

Example, after you copy the token from the bridge terminal:

```bash
curl -s http://127.0.0.1:8766/health
curl -s -H "Authorization: Bearer $TM_STEM_BRIDGE_TOKEN" -H "Content-Type: application/json" \
  -d '{"audio":"/absolute/path/to/song.wav"}' http://127.0.0.1:8766/jobs
```

There is no upload route. The bridge reads a path that already exists on this computer.

## Completion rule

The worker is invoked as:

```text
python separate_local.py AUDIO --output ROOT --device cpu|cuda|mps --progress-file PATH
```

A job becomes `completed` only when the process exits 0, the progress file says `completed`, six expected WAV names exist, and `alignment_report` agrees on frame count and sample rate. Duration and sample rate stored on the job come from that WAV check. A worker that exits 0 and claims success with mismatched files is recorded as `failed`.

Job JSON is written under `$TM_STEM_BRIDGE_STATE/jobs/`. On startup, rows still marked `queued` or `processing` become `failed` / `interrupted` with the error `Bridge restarted before this job finished.`

## Clients

`submit_job.py` and `native/tm-stem-director/tm_stem_client` speak this API and refuse any host other than `127.0.0.1`. The C++ client is the background-thread contract. It is not the installed VST3, and this repository does not contain that plugin's source.

```bash
cd tools/tm-stem-director && python -m unittest discover -s . -t .
```

Use the repository-root form in `README.md` as well. End-to-end Demucs and Ableton listening still have to happen on your Mac.
