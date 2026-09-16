import "server-only";

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  AUTOPILOT_UNIT,
  BROWSER_AUTOSTART_DESKTOP,
  CONTROL_CENTER_PORT,
  CONTROL_CENTER_UNIT,
  CONTROL_CENTER_URL,
  DB_CONTAINER_NAME,
  DB_RESTART_POLICY_TARGET,
} from "@/lib/x200/boot/constants";
import {
  isDbAutostartReady,
  parseDockerAvailability,
  parseDockerInspectJson,
} from "@/lib/x200/boot/parse-docker";
import {
  lingerEnableCommand,
  parseLingerOutput,
} from "@/lib/x200/boot/parse-linger";
import {
  isSystemdActive,
  isSystemdEnabled,
  parseSystemdShowOutput,
} from "@/lib/x200/boot/parse-systemd";
import { classifyPortOwnership } from "@/lib/x200/boot/port-ownership";
import type {
  BootOrchestratorSnapshot,
  BootOverall,
  BrowserAutostartSnapshot,
  DockerDbSnapshot,
  LingerSnapshot,
  PortOwnershipSnapshot,
  SystemdUnitSnapshot,
  VerifiedFact,
  WatchdogSnapshot,
} from "@/lib/x200/boot/types";
import { systemctlUserShowArgs } from "@/lib/x200/boot/units";
import {
  emptyWatchdogState,
  isInCooldown,
  watchdogStatusLabel,
  type WatchdogPersistedState,
} from "@/lib/x200/boot/watchdog";
import type { X200SystemdUnit } from "@/lib/x200/boot/constants";

const execFileAsync = promisify(execFile);

async function readProcFile(
  pid: number,
  name: "cmdline" | "environ" | "comm",
): Promise<string | null> {
  try {
    const buf = await fs.readFile(`/proc/${pid}/${name}`);
    return buf.toString("utf8").replace(/\0/g, " ").trim();
  } catch {
    return null;
  }
}

async function readProcCwd(pid: number): Promise<string | null> {
  try {
    return await fs.readlink(`/proc/${pid}/cwd`);
  } catch {
    return null;
  }
}

export async function readSystemdUnitSnapshot(
  unit: X200SystemdUnit,
  options?: { env?: NodeJS.ProcessEnv; timeoutMs?: number; cwd?: string },
): Promise<SystemdUnitSnapshot> {
  const env = options?.env ?? process.env;
  const source = `systemctl --user show ${unit}`;
  if (env.X200_FORCE_SYSTEMD_UNAVAILABLE === "true") {
    return {
      unit,
      status: "UNAVAILABLE",
      loaded: null,
      enabled: null,
      activeState: null,
      subState: null,
      mainPid: null,
      nRestarts: null,
      activeEnterTimestamp: null,
      execMainStartTimestamp: null,
      result: null,
      fragmentPath: null,
      workingDirectory: null,
      warning: "systemd probe forced unavailable",
      source,
    };
  }
  if (env.NODE_ENV === "production" && env.X200_ALLOW_PROD_CONTROL !== "true") {
    return {
      unit,
      status: "UNAVAILABLE",
      loaded: null,
      enabled: null,
      activeState: null,
      subState: null,
      mainPid: null,
      nRestarts: null,
      activeEnterTimestamp: null,
      execMainStartTimestamp: null,
      result: null,
      fragmentPath: null,
      workingDirectory: null,
      warning: "systemd probe skipped in production",
      source,
    };
  }

  try {
    const { stdout } = await execFileAsync(
      "systemctl",
      systemctlUserShowArgs(unit),
      {
        cwd: options?.cwd ?? process.cwd(),
        timeout: options?.timeoutMs ?? 5_000,
        maxBuffer: 64 * 1024,
        env: { ...process.env, ...env },
      },
    );
    const parsed = parseSystemdShowOutput(stdout);
    if (!parsed.activeState && parsed.loadState === "not-found") {
      return {
        unit,
        status: "MISSING",
        loaded: false,
        enabled: false,
        activeState: parsed.activeState,
        subState: parsed.subState,
        mainPid: null,
        nRestarts: parsed.nRestarts,
        activeEnterTimestamp: null,
        execMainStartTimestamp: null,
        result: parsed.result,
        fragmentPath: parsed.fragmentPath,
        workingDirectory: parsed.workingDirectory,
        warning: "unit not installed",
        source,
      };
    }
    return {
      unit,
      status: "OK",
      loaded: parsed.loadState === "loaded",
      enabled: isSystemdEnabled(parsed.unitFileState),
      activeState: parsed.activeState,
      subState: parsed.subState,
      mainPid:
        parsed.mainPid != null && parsed.mainPid > 0 ? parsed.mainPid : null,
      nRestarts: parsed.nRestarts,
      activeEnterTimestamp: parsed.activeEnterTimestamp,
      execMainStartTimestamp: parsed.execMainStartTimestamp,
      result: parsed.result,
      fragmentPath: parsed.fragmentPath,
      workingDirectory: parsed.workingDirectory,
      warning: null,
      source,
    };
  } catch (error) {
    return {
      unit,
      status: "NOT_CONNECTED",
      loaded: null,
      enabled: null,
      activeState: null,
      subState: null,
      mainPid: null,
      nRestarts: null,
      activeEnterTimestamp: null,
      execMainStartTimestamp: null,
      result: null,
      fragmentPath: null,
      workingDirectory: null,
      warning:
        error instanceof Error
          ? `systemd unavailable: ${error.message.slice(0, 160)}`
          : "systemd unavailable",
      source,
    };
  }
}

export async function readDockerDbSnapshot(options?: {
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  cwd?: string;
}): Promise<DockerDbSnapshot> {
  const env = options?.env ?? process.env;
  const source = `docker inspect ${DB_CONTAINER_NAME}`;
  if (env.X200_FORCE_DOCKER_UNAVAILABLE === "true") {
    return {
      status: "UNAVAILABLE",
      dockerAvailable: false,
      container: DB_CONTAINER_NAME,
      exists: null,
      running: null,
      health: null,
      restartPolicy: null,
      autostartReady: null,
      warning: "Docker probe forced unavailable — DEGRADED",
      source,
    };
  }

  try {
    await execFileAsync("docker", ["info"], {
      timeout: options?.timeoutMs ?? 5_000,
      maxBuffer: 256 * 1024,
      env: { ...process.env, ...env },
    });
  } catch {
    return {
      status: "NOT_CONNECTED",
      dockerAvailable: false,
      container: DB_CONTAINER_NAME,
      exists: null,
      running: null,
      health: null,
      restartPolicy: null,
      autostartReady: null,
      warning: "Docker daemon unavailable — DEGRADED",
      source: "docker info",
    };
  }

  try {
    const { stdout } = await execFileAsync(
      "docker",
      ["inspect", DB_CONTAINER_NAME],
      {
        timeout: options?.timeoutMs ?? 5_000,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, ...env },
      },
    );
    const parsed = parseDockerInspectJson(JSON.parse(stdout));
    return {
      status: "OK",
      dockerAvailable: parseDockerAvailability(0),
      container: DB_CONTAINER_NAME,
      exists: parsed.exists,
      running: parsed.running,
      health: parsed.health ?? (parsed.running ? "running-no-healthcheck" : "stopped"),
      restartPolicy: parsed.restartPolicy,
      autostartReady: isDbAutostartReady(
        parsed.restartPolicy,
        DB_RESTART_POLICY_TARGET,
      ),
      warning: isDbAutostartReady(parsed.restartPolicy, DB_RESTART_POLICY_TARGET)
        ? null
        : `DB_RESTART_POLICY=${parsed.restartPolicy} (want ${DB_RESTART_POLICY_TARGET})`,
      source,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "inspect failed";
    if (/No such object/i.test(msg)) {
      return {
        status: "MISSING",
        dockerAvailable: true,
        container: DB_CONTAINER_NAME,
        exists: false,
        running: false,
        health: null,
        restartPolicy: null,
        autostartReady: false,
        warning: `container ${DB_CONTAINER_NAME} not found`,
        source,
      };
    }
    return {
      status: "ERROR",
      dockerAvailable: true,
      container: DB_CONTAINER_NAME,
      exists: null,
      running: null,
      health: null,
      restartPolicy: null,
      autostartReady: null,
      warning: msg.slice(0, 160),
      source,
    };
  }
}

export async function readLingerSnapshot(options?: {
  env?: NodeJS.ProcessEnv;
  user?: string;
  timeoutMs?: number;
}): Promise<LingerSnapshot> {
  const env = options?.env ?? process.env;
  const user = options?.user ?? env.USER ?? "clevones";
  const enableCommand = lingerEnableCommand(user);
  const source = "loginctl show-user -p Linger";

  if (env.X200_FORCE_LINGER_UNAVAILABLE === "true") {
    return {
      status: "UNAVAILABLE",
      linger: null,
      lingerRequired: true,
      enableCommand,
      warning: "linger probe forced unavailable",
      source,
    };
  }

  try {
    const { stdout } = await execFileAsync(
      "loginctl",
      ["show-user", user, "-p", "Linger"],
      {
        timeout: options?.timeoutMs ?? 5_000,
        maxBuffer: 16 * 1024,
        env: { ...process.env, ...env },
      },
    );
    const parsed = parseLingerOutput(stdout);
    return {
      status: "OK",
      linger: parsed.linger,
      lingerRequired: parsed.lingerRequired,
      enableCommand,
      warning: parsed.lingerRequired ? "LINGER_REQUIRED" : null,
      source,
    };
  } catch (error) {
    return {
      status: "NOT_CONNECTED",
      linger: null,
      lingerRequired: true,
      enableCommand,
      warning:
        error instanceof Error
          ? `loginctl unavailable: ${error.message.slice(0, 120)}`
          : "loginctl unavailable",
      source,
    };
  }
}

async function detectListeningPid(
  port: number,
): Promise<{ pid: number | null; listenAddress: string | null }> {
  try {
    const { stdout } = await execFileAsync(
      "ss",
      ["-ltnp", `sport = :${port}`],
      { timeout: 5_000, maxBuffer: 256 * 1024 },
    );
    const pidMatch = stdout.match(/pid=(\d+)/);
    const addrMatch = stdout.match(/([\d.:\[\]]+):(\d+)\s/);
    return {
      pid: pidMatch ? Number(pidMatch[1]) : null,
      listenAddress: addrMatch ? addrMatch[1] : null,
    };
  } catch {
    return { pid: null, listenAddress: null };
  }
}

export async function readPortOwnershipSnapshot(options?: {
  env?: NodeJS.ProcessEnv;
  repoRoot?: string;
  controlCenterMainPid?: number | null;
  port?: number;
}): Promise<PortOwnershipSnapshot> {
  const port = options?.port ?? CONTROL_CENTER_PORT;
  const source = `ss + /proc (port ${port})`;
  try {
    const { pid, listenAddress } = await detectListeningPid(port);
    if (pid == null) {
      const classified = classifyPortOwnership({
        port,
        listening: false,
        pid: null,
        processName: null,
        cmdline: null,
        cwd: null,
        environ: null,
        listenAddress: null,
        repoRoot: options?.repoRoot ?? process.cwd(),
        controlCenterMainPid: options?.controlCenterMainPid ?? null,
      });
      return {
        status: "OK",
        port,
        owner: classified.owner,
        state: classified.state,
        pid: null,
        processName: null,
        cmdline: null,
        cwd: null,
        listenAddress: null,
        warning: null,
        source,
      };
    }

    const [cmdline, environ, processName, cwd] = await Promise.all([
      readProcFile(pid, "cmdline"),
      readProcFile(pid, "environ"),
      readProcFile(pid, "comm"),
      readProcCwd(pid),
    ]);

    const classified = classifyPortOwnership({
      port,
      listening: true,
      pid,
      processName,
      cmdline,
      cwd,
      environ,
      listenAddress,
      repoRoot: options?.repoRoot ?? process.cwd(),
      controlCenterMainPid: options?.controlCenterMainPid ?? null,
    });

    return {
      status: "OK",
      port,
      owner: classified.owner,
      state: classified.state,
      pid: classified.pid,
      processName: classified.processName,
      cmdline: classified.cmdline
        ? classified.cmdline.slice(0, 200)
        : null,
      cwd: classified.cwd,
      listenAddress: classified.listenAddress,
      warning:
        classified.state === "PORT_3001_CONFLICT" ? classified.detail : null,
      source,
    };
  } catch (error) {
    return {
      status: "ERROR",
      port,
      owner: "NONE",
      state: "ERROR",
      pid: null,
      processName: null,
      cmdline: null,
      cwd: null,
      listenAddress: null,
      warning:
        error instanceof Error ? error.message.slice(0, 160) : "port probe failed",
      source,
    };
  }
}

export async function readBrowserAutostartSnapshot(options?: {
  home?: string;
}): Promise<BrowserAutostartSnapshot> {
  const home = options?.home ?? homedir();
  const desktopPath = path.join(
    home,
    ".config",
    "autostart",
    BROWSER_AUTOSTART_DESKTOP,
  );
  const source = desktopPath;
  try {
    await fs.access(desktopPath);
    return {
      status: "OK",
      installed: true,
      desktopPath,
      sessionMarkerPresent: null,
      warning: null,
      source,
    };
  } catch {
    return {
      status: "MISSING",
      installed: false,
      desktopPath,
      sessionMarkerPresent: null,
      warning: "browser autostart desktop entry not installed",
      source,
    };
  }
}

export async function readWatchdogSnapshot(options?: {
  cwd?: string;
}): Promise<WatchdogSnapshot> {
  const cwd = options?.cwd ?? process.cwd();
  const filePath = path.join(cwd, ".x200", "boot-watchdog.json");
  const source = filePath;
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as WatchdogPersistedState;
    const now = Date.now();
    return {
      status: "OK",
      watchdogStatus: watchdogStatusLabel(parsed, now),
      consecutiveFailures: parsed.consecutiveFailures ?? 0,
      recoveryCount: parsed.recoveryCount ?? 0,
      lastRecovery: parsed.lastRecoveryAt,
      cooldownState: isInCooldown(parsed, now) ? "ACTIVE" : "NONE",
      warning: null,
      source,
    };
  } catch {
    const empty = emptyWatchdogState();
    return {
      status: "MISSING",
      watchdogStatus: "UNKNOWN",
      consecutiveFailures: empty.consecutiveFailures,
      recoveryCount: empty.recoveryCount,
      lastRecovery: null,
      cooldownState: "NONE",
      warning: "watchdog state file absent (timer may be uninstalled)",
      source,
    };
  }
}

function fact(
  id: string,
  label: string,
  value: string | number | boolean | null,
  source: string,
  generatedAt: string,
  verification: VerifiedFact["verification"] = "VERIFIED",
): VerifiedFact {
  return {
    id,
    label,
    value,
    source,
    timestamp: generatedAt,
    ageMs: 0,
    freshness: verification === "VERIFIED" ? "live" : "unavailable",
    verification,
  };
}

export function deriveBootOverall(input: {
  controlCenter: SystemdUnitSnapshot;
  autopilot: SystemdUnitSnapshot;
  dockerDb: DockerDbSnapshot;
  linger: LingerSnapshot;
  port: PortOwnershipSnapshot;
  browser: BrowserAutostartSnapshot;
}): { overall: BootOverall; missing: string[] } {
  const missing: string[] = [];

  if (input.port.state === "PORT_3001_CONFLICT") {
    return { overall: "CONFLICT", missing: ["PORT_3001_OWNER=UNKNOWN"] };
  }

  if (input.controlCenter.status === "MISSING" || input.controlCenter.loaded === false) {
    missing.push("CONTROL_CENTER_SERVICE_INSTALLED");
  }
  if (input.controlCenter.enabled !== true) {
    missing.push("CONTROL_CENTER_SERVICE_ENABLED");
  }
  if (!isSystemdActive(input.controlCenter.activeState) && input.port.state !== "ALREADY_RUNNING") {
    missing.push("CONTROL_CENTER_SERVICE_ACTIVE");
  }
  if (input.autopilot.enabled !== true) {
    missing.push("AUTOPILOT_SERVICE_ENABLED");
  }
  if (!isSystemdActive(input.autopilot.activeState)) {
    missing.push("AUTOPILOT_SERVICE_ACTIVE");
  }
  if (input.dockerDb.dockerAvailable === false) {
    missing.push("DOCKER_AVAILABLE");
  } else if (input.dockerDb.running !== true) {
    missing.push("DB_RUNNING");
  }
  if (input.dockerDb.autostartReady !== true) {
    missing.push("DB_AUTOSTART_POLICY");
  }
  if (input.browser.installed !== true) {
    missing.push("BROWSER_AUTOSTART_INSTALLED");
  }
  if (input.linger.lingerRequired) {
    return {
      overall: "LINGER_REQUIRED",
      missing: [...missing, "USER_LINGER", `COMMAND=${input.linger.enableCommand}`],
    };
  }

  if (
    input.controlCenter.status === "MISSING" &&
    input.autopilot.status === "MISSING" &&
    input.browser.installed !== true
  ) {
    return { overall: "NOT_INSTALLED", missing };
  }

  if (missing.length > 0) {
    return { overall: "DEGRADED", missing };
  }
  return { overall: "READY", missing: [] };
}

export function buildDiagnosticsText(snapshot: Omit<BootOrchestratorSnapshot, "diagnosticsText">): string {
  const lines = [
    `OVERALL=${snapshot.overall}`,
    `CONTROL_CENTER_URL=${snapshot.controlCenterUrl}`,
    `CONTROL_CENTER_ENABLED=${snapshot.controlCenter.enabled}`,
    `CONTROL_CENTER_ACTIVE=${snapshot.controlCenter.activeState}`,
    `CONTROL_CENTER_PID=${snapshot.controlCenter.mainPid}`,
    `AUTOPILOT_ENABLED=${snapshot.autopilot.enabled}`,
    `AUTOPILOT_ACTIVE=${snapshot.autopilot.activeState}`,
    `AUTOPILOT_PID=${snapshot.autopilot.mainPid}`,
    `DB_CONTAINER=${snapshot.dockerDb.container}`,
    `DB_RUNNING=${snapshot.dockerDb.running}`,
    `DB_HEALTH=${snapshot.dockerDb.health}`,
    `DB_RESTART_POLICY=${snapshot.dockerDb.restartPolicy}`,
    `USER_LINGER=${snapshot.linger.linger}`,
    `BROWSER_AUTOSTART=${snapshot.browser.installed}`,
    `PORT_3001_OWNER=${snapshot.port.owner}`,
    `PORT_3001_STATE=${snapshot.port.state}`,
    `WATCHDOG=${snapshot.watchdog.watchdogStatus}`,
    `MISSING=${snapshot.missing.join(",") || "none"}`,
  ];
  return lines.join("\n");
}

export async function assembleBootOrchestratorSnapshot(options?: {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  home?: string;
}): Promise<BootOrchestratorSnapshot> {
  const generatedAt = new Date().toISOString();
  const cwd = options?.cwd ?? process.cwd();
  const env = options?.env ?? process.env;

  const [controlCenter, autopilot, dockerDb, linger, browser, watchdog] =
    await Promise.all([
      readSystemdUnitSnapshot(CONTROL_CENTER_UNIT, { env, cwd }),
      readSystemdUnitSnapshot(AUTOPILOT_UNIT, { env, cwd }),
      readDockerDbSnapshot({ env, cwd }),
      readLingerSnapshot({ env }),
      readBrowserAutostartSnapshot({ home: options?.home }),
      readWatchdogSnapshot({ cwd }),
    ]);

  const port = await readPortOwnershipSnapshot({
    env,
    repoRoot: cwd,
    controlCenterMainPid: controlCenter.mainPid,
  });

  const { overall, missing } = deriveBootOverall({
    controlCenter,
    autopilot,
    dockerDb,
    linger,
    port,
    browser,
  });

  const facts: VerifiedFact[] = [
    fact("boot_overall", "BOOT OVERALL", overall, "derived", generatedAt),
    fact(
      "cc_enabled",
      "CONTROL CENTER ENABLED",
      controlCenter.enabled,
      controlCenter.source,
      generatedAt,
      controlCenter.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "cc_active",
      "CONTROL CENTER ACTIVE",
      controlCenter.activeState,
      controlCenter.source,
      generatedAt,
      controlCenter.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "cc_pid",
      "CONTROL CENTER PID",
      controlCenter.mainPid,
      controlCenter.source,
      generatedAt,
      controlCenter.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "cc_restarts",
      "CONTROL CENTER RESTART COUNT",
      controlCenter.nRestarts,
      controlCenter.source,
      generatedAt,
      controlCenter.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "ap_enabled",
      "AUTOPILOT ENABLED",
      autopilot.enabled,
      autopilot.source,
      generatedAt,
      autopilot.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "ap_active",
      "AUTOPILOT ACTIVE",
      autopilot.activeState,
      autopilot.source,
      generatedAt,
      autopilot.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "ap_pid",
      "AUTOPILOT PID",
      autopilot.mainPid,
      autopilot.source,
      generatedAt,
      autopilot.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "ap_restarts",
      "AUTOPILOT RESTART COUNT",
      autopilot.nRestarts,
      autopilot.source,
      generatedAt,
      autopilot.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "docker",
      "DOCKER AVAILABLE",
      dockerDb.dockerAvailable,
      dockerDb.source,
      generatedAt,
      dockerDb.dockerAvailable === true ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "db_container",
      "X200 DB CONTAINER",
      dockerDb.container,
      dockerDb.source,
      generatedAt,
      dockerDb.status === "OK" ? "VERIFIED" : "UNVERIFIED",
    ),
    fact(
      "db_running",
      "DB RUNNING",
      dockerDb.running,
      dockerDb.source,
      generatedAt,
      dockerDb.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "db_health",
      "DB HEALTH",
      dockerDb.health,
      dockerDb.source,
      generatedAt,
      dockerDb.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "db_policy",
      "DB RESTART POLICY",
      dockerDb.restartPolicy,
      dockerDb.source,
      generatedAt,
      dockerDb.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "linger",
      "USER LINGER",
      linger.linger,
      linger.source,
      generatedAt,
      linger.status === "OK" ? "VERIFIED" : "NOT_CONNECTED",
    ),
    fact(
      "browser",
      "BROWSER AUTOSTART",
      browser.installed,
      browser.source,
      generatedAt,
      browser.status === "OK" ? "VERIFIED" : "UNVERIFIED",
    ),
    fact(
      "browser_file",
      "BROWSER AUTOSTART FILE",
      browser.desktopPath,
      browser.source,
      generatedAt,
      browser.installed ? "VERIFIED" : "UNVERIFIED",
    ),
    fact("cc_url", "CONTROL CENTER URL", CONTROL_CENTER_URL, "constant", generatedAt),
    fact(
      "port_owner",
      "PORT 3001 OWNER",
      port.owner,
      port.source,
      generatedAt,
      port.status === "OK" ? "VERIFIED" : "ERROR",
    ),
    fact(
      "port_state",
      "PORT 3001 STATE",
      port.state,
      port.source,
      generatedAt,
      port.status === "OK" ? "VERIFIED" : "ERROR",
    ),
    fact(
      "watchdog",
      "WATCHDOG STATUS",
      watchdog.watchdogStatus,
      watchdog.source,
      generatedAt,
      watchdog.status === "OK" ? "VERIFIED" : "UNVERIFIED",
    ),
    fact(
      "watchdog_failures",
      "CONSECUTIVE FAILURES",
      watchdog.consecutiveFailures,
      watchdog.source,
      generatedAt,
      watchdog.status === "OK" ? "VERIFIED" : "UNVERIFIED",
    ),
    fact(
      "watchdog_recoveries",
      "RECOVERY COUNT",
      watchdog.recoveryCount,
      watchdog.source,
      generatedAt,
      watchdog.status === "OK" ? "VERIFIED" : "UNVERIFIED",
    ),
    fact(
      "last_recovery",
      "LAST RECOVERY",
      watchdog.lastRecovery,
      watchdog.source,
      generatedAt,
      watchdog.lastRecovery ? "VERIFIED" : "UNVERIFIED",
    ),
  ];

  const partial = {
    generatedAt,
    overall,
    controlCenterUrl: CONTROL_CENTER_URL,
    missing,
    facts,
    controlCenter,
    autopilot,
    dockerDb,
    linger,
    port,
    browser,
    watchdog,
    lastStart: controlCenter.activeEnterTimestamp,
    lastFailure: controlCenter.result === "success" ? null : controlCenter.result,
    lastRecovery: watchdog.lastRecovery,
  };

  return {
    ...partial,
    diagnosticsText: buildDiagnosticsText(partial),
  };
}
