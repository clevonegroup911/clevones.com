#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_NAME="clevones-x200-autopilot.service"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
UNIT_PATH="$UNIT_DIR/$UNIT_NAME"
LOG_DIR="$ROOT/.x200/logs"
LOCK_PATH="$ROOT/.x200/autopilot.lock"

mkdir -p "$UNIT_DIR" "$LOG_DIR"

resolve_agent() {
  local candidate
  if [[ -n "${X200_AGENT_BIN:-}" ]]; then
    candidate="$X200_AGENT_BIN"
  elif command -v cursor-agent >/dev/null 2>&1; then
    candidate="$(command -v cursor-agent)"
  elif command -v agent >/dev/null 2>&1; then
    candidate="$(command -v agent)"
  else
    echo "Cursor CLI introuvable. Installez cursor-agent ou agent, puis authentifiez-le avant d'activer le service." >&2
    exit 2
  fi

  if [[ ! -x "$candidate" ]]; then
    echo "Cursor CLI trouvé mais non exécutable: $candidate" >&2
    exit 2
  fi
  printf '%s\n' "$candidate"
}

AGENT_BIN="$(resolve_agent)"
NPM_BIN="$(command -v npm)"
if [[ -z "$NPM_BIN" || ! -x "$NPM_BIN" ]]; then
  echo "npm introuvable ou non exécutable." >&2
  exit 2
fi

echo "Arrêt contrôlé de toute ancienne instance ($UNIT_NAME)..."
if systemctl --user list-unit-files "$UNIT_NAME" >/dev/null 2>&1; then
  systemctl --user stop "$UNIT_NAME" >/dev/null 2>&1 || true
  # Wait for cgroup to settle; never pkill globally.
  for _ in $(seq 1 20); do
    state="$(systemctl --user show "$UNIT_NAME" -p ActiveState --value 2>/dev/null || echo unknown)"
    if [[ "$state" == "inactive" || "$state" == "failed" || "$state" == "dead" ]]; then
      break
    fi
    sleep 0.25
  done
  leftover="$(systemctl --user show "$UNIT_NAME" -p MainPID --value 2>/dev/null || echo 0)"
  if [[ -n "$leftover" && "$leftover" != "0" ]]; then
    echo "Processus résiduel du service détecté (PID $leftover) — kill ciblé du service uniquement."
    systemctl --user kill --kill-who=all "$UNIT_NAME" || true
    sleep 1
  fi
fi

# Never blindly delete a live lock. Only note status for the operator.
if [[ -f "$LOCK_PATH" ]]; then
  echo "Lock présent: $LOCK_PATH (non supprimé automatiquement)."
  echo "Le daemon auto-répare uniquement un lock STALE (PID mort, même host)."
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
ExecStart=$NPM_BIN run x200:autopilot:daemon
Restart=on-failure
RestartSec=15
TimeoutStopSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now "$UNIT_NAME"

sleep 1
ACTIVE="$(systemctl --user show "$UNIT_NAME" -p ActiveState --value)"
MAIN_PID="$(systemctl --user show "$UNIT_NAME" -p MainPID --value)"
WORKDIR="$(systemctl --user show "$UNIT_NAME" -p WorkingDirectory --value)"
EXEC="$(systemctl --user show "$UNIT_NAME" -p ExecStart --value)"

echo "X200 autopilot installé — une seule instance ($UNIT_NAME)."
echo "AGENT_BIN=$AGENT_BIN"
echo "SERVICE_ACTIVE=$ACTIVE"
echo "SERVICE_PID=$MAIN_PID"
echo "SERVICE_WORKING_DIRECTORY=$WORKDIR"
echo "SERVICE_EXEC=$EXEC"
echo "Status : systemctl --user status $UNIT_NAME"
echo "Logs   : journalctl --user -u $UNIT_NAME -f"
echo "Gate   : $ROOT/.x200/HUMAN_GATE.json"
echo "Lock   : $LOCK_PATH (auto-réparé seulement si STALE)"
