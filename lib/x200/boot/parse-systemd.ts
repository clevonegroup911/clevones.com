/**
 * Pure parsers for systemd --user show KEY=VALUE output.
 * CI-safe: no live systemctl calls.
 */

export type ParsedSystemdShow = {
  loadState: string | null;
  activeState: string | null;
  subState: string | null;
  unitFileState: string | null;
  mainPid: number | null;
  nRestarts: number | null;
  activeEnterTimestamp: string | null;
  execMainStartTimestamp: string | null;
  result: string | null;
  fragmentPath: string | null;
  workingDirectory: string | null;
};

export function parseSystemdShowOutput(stdout: string): ParsedSystemdShow {
  const map = new Map<string, string>();
  for (const line of stdout.split("\n")) {
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    map.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
  }

  const mainPidRaw = map.get("MainPID");
  const nRestartsRaw = map.get("NRestarts");
  const mainPid =
    mainPidRaw && /^\d+$/.test(mainPidRaw) ? Number(mainPidRaw) : null;
  const nRestarts =
    nRestartsRaw && /^\d+$/.test(nRestartsRaw) ? Number(nRestartsRaw) : null;

  const ts = (key: string): string | null => {
    const raw = map.get(key);
    if (!raw || raw === "n/a" || raw === "0" || raw.startsWith("n/a")) {
      return null;
    }
    return raw;
  };

  return {
    loadState: map.get("LoadState") ?? null,
    activeState: map.get("ActiveState") ?? null,
    subState: map.get("SubState") ?? null,
    unitFileState: map.get("UnitFileState") ?? null,
    mainPid: mainPid != null && mainPid >= 0 ? mainPid : null,
    nRestarts,
    activeEnterTimestamp: ts("ActiveEnterTimestamp"),
    execMainStartTimestamp: ts("ExecMainStartTimestamp"),
    result: map.get("Result") ?? null,
    fragmentPath: map.get("FragmentPath") || null,
    workingDirectory: map.get("WorkingDirectory") || null,
  };
}

export function isSystemdEnabled(unitFileState: string | null): boolean | null {
  if (!unitFileState) return null;
  if (unitFileState === "enabled" || unitFileState === "enabled-runtime") {
    return true;
  }
  if (
    unitFileState === "disabled" ||
    unitFileState === "masked" ||
    unitFileState === "static" ||
    unitFileState === "indirect"
  ) {
    return unitFileState === "static" || unitFileState === "indirect"
      ? null
      : false;
  }
  return false;
}

export function isSystemdActive(activeState: string | null): boolean | null {
  if (!activeState) return null;
  return activeState === "active";
}
