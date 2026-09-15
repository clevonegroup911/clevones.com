import {
  AUTOPILOT_UNIT,
  BOOT_WATCHDOG_TIMER,
  BOOT_WATCHDOG_UNIT,
  CONTROL_CENTER_UNIT,
  X200_SYSTEMD_UNITS,
  type X200SystemdUnit,
} from "@/lib/x200/boot/constants";

export function isAllowlistedUnit(unit: string): unit is X200SystemdUnit {
  return (X200_SYSTEMD_UNITS as readonly string[]).includes(unit);
}

export function assertAllowlistedUnit(unit: string): X200SystemdUnit {
  if (!isAllowlistedUnit(unit)) {
    throw new Error(`UNIT_NOT_ALLOWLISTED: ${unit}`);
  }
  return unit;
}

/** Fixed argv only — never interpolate caller-controlled unit names beyond allowlist. */
export function systemctlUserShowArgs(unit: X200SystemdUnit): string[] {
  assertAllowlistedUnit(unit);
  return [
    "--user",
    "show",
    unit,
    "--property=LoadState",
    "--property=ActiveState",
    "--property=SubState",
    "--property=UnitFileState",
    "--property=MainPID",
    "--property=NRestarts",
    "--property=ActiveEnterTimestamp",
    "--property=ExecMainStartTimestamp",
    "--property=Result",
    "--property=FragmentPath",
    "--property=WorkingDirectory",
  ];
}

export function systemctlUserControlArgs(
  verb: "start" | "stop" | "restart" | "enable" | "disable" | "is-enabled" | "is-active",
  unit: X200SystemdUnit,
): string[] {
  assertAllowlistedUnit(unit);
  if (verb === "disable") {
    return ["--user", "disable", "--now", unit];
  }
  if (verb === "enable") {
    return ["--user", "enable", "--now", unit];
  }
  return ["--user", verb, unit];
}

export const PRIMARY_BOOT_UNITS = [
  CONTROL_CENTER_UNIT,
  AUTOPILOT_UNIT,
] as const;

export const OPTIONAL_WATCHDOG_UNITS = [
  BOOT_WATCHDOG_UNIT,
  BOOT_WATCHDOG_TIMER,
] as const;
