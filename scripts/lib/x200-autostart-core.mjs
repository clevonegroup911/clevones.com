#!/usr/bin/env node
/**
 * Pure / CI-safe helpers for X200 autostart installer.
 * Never touches live systemd when X200_AUTOSTART_DRY_RUN=1 or fixtures provided.
 */

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const CONTROL_CENTER_UNIT = "clevones-x200-control-center.service";
export const AUTOPILOT_UNIT = "clevones-x200-autopilot.service";
export const BOOT_WATCHDOG_UNIT = "clevones-x200-boot-watchdog.service";
export const BOOT_WATCHDOG_TIMER = "clevones-x200-boot-watchdog.timer";
export const DB_CONTAINER = "clevones-x200-db";
export const CONTROL_CENTER_URL = "http://127.0.0.1:3001/admin/x200";
export const BROWSER_DESKTOP = "clevones-x200-open-control-center.desktop";

export const ALLOWLISTED_UNITS = [
  CONTROL_CENTER_UNIT,
  AUTOPILOT_UNIT,
  BOOT_WATCHDOG_UNIT,
  BOOT_WATCHDOG_TIMER,
];

export function assertAllowlistedUnit(unit) {
  if (!ALLOWLISTED_UNITS.includes(unit)) {
    throw new Error(`UNIT_NOT_ALLOWLISTED:${unit}`);
  }
  return unit;
}

export function renderControlCenterUnit({
  root,
  nodeBin,
  serveScript,
}) {
  return `[Unit]
Description=CLEVONE X200 Control Center (127.0.0.1:3001)
Documentation=file://${root}/docs/X200_BOOT_AUTOSTART.md
After=network-online.target docker.service
Wants=network-online.target
StartLimitIntervalSec=120
StartLimitBurst=5

[Service]
Type=simple
WorkingDirectory=${root}
Environment=X200_CONTROL_CENTER=1
Environment=HOST=127.0.0.1
Environment=PORT=3001
ExecStart=${nodeBin} ${serveScript}
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
KillSignal=SIGTERM
SendSIGKILL=yes
StandardOutput=journal
StandardError=journal
SyslogIdentifier=clevones-x200-control-center
# No EnvironmentFile=.env — no GitHub tokens — no arbitrary shell.

[Install]
WantedBy=default.target
`;
}

export function renderAutopilotUnit({ root, npmBin, agentBin }) {
  const agentLine = agentBin
    ? `Environment=X200_AGENT_BIN=${agentBin}\n`
    : "";
  return `[Unit]
Description=CLEVONES X200 FAST-LANE Fedora Local Autopilot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${root}
${agentLine}Environment=X200_AUTOPILOT_POLL_MS=60000
Environment=X200_AGENT_TIMEOUT_MS=3300000
ExecStart=${npmBin} run x200:autopilot:daemon
Restart=on-failure
RestartSec=15
TimeoutStopSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
`;
}

export function renderWatchdogUnit({ root, nodeBin, watchdogScript }) {
  return `[Unit]
Description=CLEVONE X200 boot health watchdog (bounded recovery)
Documentation=file://${root}/docs/X200_BOOT_AUTOSTART.md

[Service]
Type=oneshot
WorkingDirectory=${root}
Environment=X200_BOOT_WATCHDOG=1
ExecStart=${nodeBin} ${watchdogScript}
Nice=10
StandardOutput=journal
StandardError=journal
`;
}

export function renderWatchdogTimer() {
  return `[Unit]
Description=CLEVONE X200 boot watchdog timer (~60s)

[Timer]
OnBootSec=90
OnUnitActiveSec=60
AccuracySec=15
Persistent=false
Unit=${BOOT_WATCHDOG_UNIT}

[Install]
WantedBy=timers.target
`;
}

export function renderBrowserDesktop({ root, nodeBin, browserScript }) {
  return `[Desktop Entry]
Type=Application
Version=1.0
Name=CLEVONE X200 Control Center
Comment=Open Control Center once after desktop login
Exec=${nodeBin} ${browserScript}
Icon=web-browser
Terminal=false
Categories=Network;
X-GNOME-Autostart-enabled=true
StartupNotify=false
`;
}

export function unitContentHash(content) {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Idempotent write: skip rewrite when content hash matches.
 * Returns { written: boolean, path, hash }
 */
export async function writeFileIdempotent(filePath, content, { mode = 0o644 } = {}) {
  const hash = unitContentHash(content);
  try {
    const existing = await fs.readFile(filePath, "utf8");
    if (unitContentHash(existing) === hash) {
      return { written: false, path: filePath, hash, reason: "UNCHANGED" };
    }
  } catch {
    // missing
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, { mode });
  return { written: true, path: filePath, hash, reason: "UPDATED" };
}

export function summarizeAutostartStatus(input) {
  const {
    controlCenterEnabled,
    controlCenterActive,
    controlCenterHttpOk,
    portOwnerX200,
    autopilotEnabled,
    autopilotActive,
    databaseAutostart,
    browserAutostart,
    linger,
    portState,
  } = input;

  const controlCenterEffectivelyUp =
    controlCenterActive ||
    controlCenterHttpOk === true ||
    portOwnerX200 === true ||
    portState === "ALREADY_RUNNING" ||
    portState === "LISTENING";

  let overall = "READY";
  if (portState === "PORT_3001_CONFLICT") overall = "CONFLICT";
  else if (linger === "NO") overall = "LINGER_REQUIRED";
  else if (
    !controlCenterEnabled ||
    !autopilotEnabled ||
    !databaseAutostart ||
    !browserAutostart
  ) {
    overall = "DEGRADED";
  } else if (!controlCenterEffectivelyUp || !autopilotActive) {
    overall = "DEGRADED";
  }

  return {
    CONTROL_CENTER_AUTOSTART: controlCenterEnabled ? "YES" : "NO",
    AUTOPILOT_AUTOSTART: autopilotEnabled ? "YES" : "NO",
    DATABASE_AUTOSTART: databaseAutostart ? "YES" : "NO",
    BROWSER_AUTOSTART: browserAutostart ? "YES" : "NO",
    LINGER: linger ?? "UNKNOWN",
    PORT: portState ?? "UNKNOWN",
    OVERALL: overall,
  };
}
