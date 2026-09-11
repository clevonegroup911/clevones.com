#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
UNIT_PATH="$UNIT_DIR/clevones-x200-autopilot.service"
LOG_DIR="$ROOT/.x200/logs"

mkdir -p "$UNIT_DIR" "$LOG_DIR"

if ! command -v cursor-agent >/dev/null 2>&1 && ! command -v agent >/dev/null 2>&1; then
  echo "Cursor CLI introuvable. Installez-le puis authentifiez-le avant d'activer le service." >&2
  exit 2
fi

if command -v cursor-agent >/dev/null 2>&1; then
  AGENT_BIN="$(command -v cursor-agent)"
else
  AGENT_BIN="$(command -v agent)"
fi

cat > "$UNIT_PATH" <<EOF
[Unit]
Description=CLEVONES X200 FAST-LANE Fedora Local Autopilot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$ROOT
Environment=X200_AGENT_BIN=$AGENT_BIN
Environment=X200_AUTOPILOT_POLL_MS=60000
Environment=X200_AGENT_TIMEOUT_MS=3300000
ExecStart=$(command -v npm) run x200:autopilot:daemon
Restart=on-failure
RestartSec=15
TimeoutStopSec=30
StandardOutput=append:$LOG_DIR/autopilot.log
StandardError=append:$LOG_DIR/autopilot.err.log

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now clevones-x200-autopilot.service

echo "X200 autopilot installé et démarré."
echo "Status : systemctl --user status clevones-x200-autopilot.service"
echo "Logs   : tail -f $LOG_DIR/autopilot.log"
echo "Gate   : $ROOT/.x200/HUMAN_GATE.json"
