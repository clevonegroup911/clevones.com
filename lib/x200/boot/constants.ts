/** Fixed X200 boot / autostart constants — never accept caller-controlled unit names. */

export const CONTROL_CENTER_UNIT = "clevones-x200-control-center.service";
export const AUTOPILOT_UNIT = "clevones-x200-autopilot.service";
export const BOOT_WATCHDOG_UNIT = "clevones-x200-boot-watchdog.service";
export const BOOT_WATCHDOG_TIMER = "clevones-x200-boot-watchdog.timer";

export const X200_SYSTEMD_UNITS = [
  CONTROL_CENTER_UNIT,
  AUTOPILOT_UNIT,
  BOOT_WATCHDOG_UNIT,
  BOOT_WATCHDOG_TIMER,
] as const;

export type X200SystemdUnit = (typeof X200_SYSTEMD_UNITS)[number];

export const CONTROL_CENTER_HOST = "127.0.0.1";
export const CONTROL_CENTER_PORT = 3001;
export const CONTROL_CENTER_PATH = "/admin/x200";
export const CONTROL_CENTER_URL = `http://${CONTROL_CENTER_HOST}:${CONTROL_CENTER_PORT}${CONTROL_CENTER_PATH}`;

export const DB_CONTAINER_NAME = "clevones-x200-db";
export const DB_RESTART_POLICY_TARGET = "unless-stopped";

export const BROWSER_AUTOSTART_DESKTOP =
  "clevones-x200-open-control-center.desktop";

export const CONTROL_CENTER_ENV_MARKER = "X200_CONTROL_CENTER=1";

export const WATCHDOG_INTERVAL_MS = 60_000;
export const WATCHDOG_FAILURE_THRESHOLD = 3;
export const WATCHDOG_MAX_RECOVERIES = 5;
export const WATCHDOG_COOLDOWN_MS = 15 * 60_000;
