#!/bin/zsh
set -euo pipefail

ROOT="${HOME}/.local/share/jocyn-daw-bridge"
BIN="${HOME}/.local/bin"
LAUNCH_AGENTS="${HOME}/Library/LaunchAgents"

mkdir -p "${ROOT}" "${BIN}" "${LAUNCH_AGENTS}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "${SCRIPT_DIR}/jocyn_daw_bridge.py" "${ROOT}/jocyn_daw_bridge.py"
chmod +x "${ROOT}/jocyn_daw_bridge.py"

PLIST="${LAUNCH_AGENTS}/com.jocyn.daw-bridge.plist"
sed   -e "s|__SCRIPT_PATH__|${ROOT}/jocyn_daw_bridge.py|g"   -e "s|__LOG_PATH__|${ROOT}/bridge.log|g"   -e "s|__ERR_PATH__|${ROOT}/bridge.err.log|g"   "${SCRIPT_DIR}/com.jocyn.daw-bridge.plist" > "${PLIST}"

cat > "${BIN}/jocyn-daw-bridge" <<EOF
#!/bin/zsh
exec /usr/bin/python3 "${ROOT}/jocyn_daw_bridge.py"
EOF
chmod +x "${BIN}/jocyn-daw-bridge"

launchctl bootout "gui/$(id -u)" "${PLIST}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "${PLIST}"

echo "JO₵YN DAW Bridge installed."
echo "Watching: ~/Downloads/*.jocynhandoff"
echo "Projects: ~/Music/JOcYN/Ableton Projects/"
