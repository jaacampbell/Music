# TM Stem Director loopback client

This directory is a C++17 background client for the local stem bridge. It submits a source path to `127.0.0.1`, polls status, cancels, and asks the bridge to reveal a finished folder.

It is not a JUCE plugin and it does not build, sign, notarize, or install `TM Stem Director.vst3`. The installed Ableton plugin's source is not in this repository. Call `BridgeClient` only from a background thread; its methods block on sockets.

```bash
cmake -S native/tm-stem-director -B native/tm-stem-director/build
cmake --build native/tm-stem-director/build
ctest --test-dir native/tm-stem-director/build --output-on-failure
./native/tm-stem-director/build/tm_stem_client --token "$TM_STEM_BRIDGE_TOKEN" health
```

The bridge itself is `tools/tm-stem-director/bridge_server.py`. A refused host exits 2 and does not open a socket to that host.
