# TM Stem Director local bridge — alpha

Run `python tools/tm-stem-director/bridge_server.py` after installing the dependencies documented in README.md. It binds to **127.0.0.1 only**; never expose this port to the public internet. Local processes can still access it, so do not treat it as a multi-user security boundary.

## HTTP contract

- `GET /health` — readiness.
- `POST /jobs` — JSON `{"audio":"/absolute/path/to/song.mp3"}`, returns HTTP 202 and job ID.
- `GET /jobs/{id}` — queued/processing/completed/failed and output directory on success.

Example:

```bash
curl -s http://127.0.0.1:8766/health
curl -s -H 'Content-Type: application/json' -d '{"audio":"/Users/YOU/Downloads/Baggage Claim.mp3"}' http://127.0.0.1:8766/jobs
```

The existing VST3 is **not connected yet**. Its UI must explicitly select the source file and call this API from a background thread, not its real-time audio callback. This bridge has no upload endpoint and only accepts an existing local file path. Jobs live in memory; restarting the service loses job history. It has no authentication, cancellation, concurrency limit, or streaming progress and is not production-hardened.

Run `cd tools/tm-stem-director && python -m unittest test_bridge.py` for contract smoke tests. End-to-end Demucs and Ableton tests still need a configured Mac.
