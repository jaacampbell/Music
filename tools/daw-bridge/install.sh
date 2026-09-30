#!/bin/zsh
set -euo pipefail

ROOT="${HOME}/.local/share/jocyn-daw-bridge"
BIN="${HOME}/.local/bin"
LAUNCH_AGENTS="${HOME}/Library/LaunchAgents"
ABLETON_USER_LIBRARY="${HOME}/Music/Ableton/User Library"
REMOTE_SCRIPTS="${ABLETON_USER_LIBRARY}/Remote Scripts"
REMOTE_DEST="${REMOTE_SCRIPTS}/JOcYNStemImporter"

mkdir -p "${ROOT}" "${ROOT}/ableton_inbox" "${ROOT}/ableton_processed" "${ROOT}/ableton_failed" "${BIN}" "${LAUNCH_AGENTS}" "${REMOTE_DEST}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cp "${SCRIPT_DIR}/jocyn_daw_bridge.py" "${ROOT}/jocyn_daw_bridge.py"
chmod +x "${ROOT}/jocyn_daw_bridge.py"

cp "${SCRIPT_DIR}/remote-script/__init__.py" "${REMOTE_DEST}/__init__.py"
cp "${SCRIPT_DIR}/remote-script/jocyn_stem_importer.py" "${REMOTE_DEST}/jocyn_stem_importer.py"

PLIST="${LAUNCH_AGENTS}/com.jocyn.daw-bridge.plist"
sed   -e "s|__SCRIPT_PATH__|${ROOT}/jocyn_daw_bridge.py|g"   -e "s|__LOG_PATH__|${ROOT}/bridge.log|g"   -e "s|__ERR_PATH__|${ROOT}/bridge.err.log|g"   "${SCRIPT_DIR}/com.jocyn.daw-bridge.plist" > "${PLIST}"

cat > "${BIN}/jocyn-daw-bridge" <<EOF
#!/bin/zsh
exec /usr/bin/python3 "${ROOT}/jocyn_daw_bridge.py"
EOF
chmod +x "${BIN}/jocyn-daw-bridge"

launchctl bootout "gui/$(id -u)" "${PLIST}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "${PLIST}"

echo ""
echo "JO₵YN DAW Bridge 2.0 installed."
echo "Remote Script: ${REMOTE_DEST}"
echo "Handoff watcher: ~/Downloads/*.jocynhandoff"
echo "Ableton command inbox: ${ROOT}/ableton_inbox"
echo ""
echo "ONE-TIME ABLETON STEP:"
echo "1. Restart Ableton Live."
echo "2. Live > Settings/Preferences > MIDI."
echo "3. Choose 'JOcYNStemImporter' in a Control Surface slot."
echo "4. Input and Output can remain None."
echo ""
echo "After that, Stem Director > Send to Ableton will create and populate tracks automatically."
