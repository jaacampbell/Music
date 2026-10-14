#!/bin/bash
# Double-clickable macOS launcher. Requires dependencies installed in .venv-tm.
set -e
cd "$(dirname "$0")/../.."
if [ ! -x .venv-tm/bin/python ]; then
  echo "Missing .venv-tm. See tools/tm-stem-director/README.md"
  read -r -p "Press Return to close..." _
  exit 1
fi
exec .venv-tm/bin/python tools/tm-stem-director/bridge_server.py
