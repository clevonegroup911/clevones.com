#!/usr/bin/env node
/**
 * X200 autostart installer / status / repair / disable.
 * Idempotent. Never sudo. Never arbitrary systemctl units.
 * CI: set X200_AUTOSTART_HOME + X200_AUTOSTART_DRY_RUN=1 to avoid live systemd.
 */

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  ALLOWLISTED_UNITS,
  AUTOPILOT_UNIT,
  BROWSER_DESKTOP,
  BOOT_WATCHDOG_TIMER,
  BOOT_WATCHDOG_UNIT,
  CONTROL_CENTER_UNIT,
  CONTROL_CENTER_URL,
  DB_CONTAINER,
  assertAllowlistedUnit,
  renderAutopilotUnit,
  renderBrowserDesktop,
  renderControlCenterUnit,
  renderWatchdogTimer,
  renderWatchdogUnit,
  summarizeAutostartStatus,
  writeFileIdempotent,
} from "./lib/x200-autostart-core.mjs";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function envFlag(name) {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

async function resolveBin(name) {
  const { stdout } = await execFileAsync("bash", ["-lc", `command -v ${name}`], {
    timeout: 5_000,
  });
  const resolved = stdout.trim();
  if (!resolved) throw new Error(`${name} not found`);
  const { stdout: real } = await execFileAsync("readlink", ["-f", resolved], {
    timeout: 5_000,
  }).catch(() => ({ stdout: resolved }));
  return (real || resolved).trim();
}

async function systemctlUser(args, { dryRun }) {
  for (const u of args) {
    if (u.endsWith(".service") || u.endsWith(".timer")) {
      assertAllowlistedUnit(u);
    }
  }
  if (dryRun) {
    return { stdout: `DRY_RUN systemctl --user ${args.join(" ")}\n`, stderr: "" };
  }
  return execFileAsync("systemctl", ["--user", ...args], {
    timeout: 30_000,
    maxBuffer: 512 * 1024,
  });
}

async function detectAgentBin() {
  if (process.env.X200_AGENT_BIN) return process.env.X200_AGENT_BIN;
  for (const cand of ["cursor-agent", "agent"]) {
    try {
      return await resolveBin(cand);
    } catch {
      // continue
    }
  }
  return null;
}

async function ensureDbRestartPolicy({ dryRun }) {
  if (dryRun) {
    return { ok: true, policy: "unless-stopped", note: "DRY_RUN" };
  }
  try {
    await execFileAsync("docker", ["info"], { timeout: 5_000 });
  } catch {
    return { ok: false, policy: null, note: "DOCKER_UNAVAILABLE" };
  }
  try {
    await execFileAsync("docker", ["inspect", DB_CONTAINER], { timeout: 5_000 });
  } catch {
    return { ok: false, policy: null, note: "CONTAINER_MISSING" };
  }
  await execFileAsync(
    "docker",
    ["update", "--restart=unless-stopped", DB_CONTAINER],
    { timeout: 15_000 },
  );
  const { stdout } = await execFileAsync(
    "docker",
    [
      "inspect",
      "-f",
      "{{.HostConfig.RestartPolicy.Name}}",
      DB_CONTAINER,
    ],
    { timeout: 5_000 },
  );
  const policy = stdout.trim();
  return {
    ok: policy === "unless-stopped" || policy === "always",
    policy,
    note: "VERIFIED",
  };
}

async function readLinger() {
  try {
    const user = process.env.USER || "clevones";
    const { stdout } = await execFileAsync(
      "loginctl",
      ["show-user", user, "-p", "Linger"],
      { timeout: 5_000 },
    );
    const m = stdout.match(/Linger=(\w+)/i);
    const raw = (m?.[1] || "").toLowerCase();
    if (raw === "yes") return "YES";
    if (raw === "no") return "NO";
    return "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

async function unitEnabled(unit, { dryRun }) {
  assertAllowlistedUnit(unit);
  if (dryRun) return false;
  try {
    const { stdout } = await systemctlUser(["is-enabled", unit], { dryRun });
    return stdout.trim() === "enabled";
  } catch {
    return false;
  }
}

async function unitActive(unit, { dryRun }) {
  assertAllowlistedUnit(unit);
  if (dryRun) return false;
  try {
    const { stdout } = await systemctlUser(["is-active", unit], { dryRun });
    return stdout.trim() === "active";
  } catch {
    return false;
  }
}

async function install(options = {}) {
  const dryRun = options.dryRun ?? envFlag("X200_AUTOSTART_DRY_RUN");
  const home = options.home ?? process.env.X200_AUTOSTART_HOME ?? homedir();
  const unitDir = path.join(home, ".config", "systemd", "user");
  const autostartDir = path.join(home, ".config", "autostart");

  const nodeBin = options.nodeBin ?? (await resolveBin("node"));
  const npmBin = options.npmBin ?? (await resolveBin("npm"));
  const agentBin = options.agentBin ?? (await detectAgentBin());

  const serveScript = path.join(ROOT, "scripts", "x200-control-center-serve.mjs");
  const browserScript = path.join(ROOT, "scripts", "x200-browser-autostart.mjs");
  const watchdogScript = path.join(ROOT, "scripts", "x200-boot-watchdog.mjs");

  const ccUnit = renderControlCenterUnit({
    root: ROOT,
    nodeBin,
    serveScript,
  });
  const apUnit = renderAutopilotUnit({ root: ROOT, npmBin, agentBin });
  const wdUnit = renderWatchdogUnit({
    root: ROOT,
    nodeBin,
    watchdogScript,
  });
  const wdTimer = renderWatchdogTimer();
  const desktop = renderBrowserDesktop({
    root: ROOT,
    nodeBin,
    browserScript,
  });

  const writes = [];
  if (!dryRun) {
    await fs.mkdir(unitDir, { recursive: true });
    await fs.mkdir(autostartDir, { recursive: true });
  }

  const targets = [
    [path.join(unitDir, CONTROL_CENTER_UNIT), ccUnit],
    [path.join(unitDir, AUTOPILOT_UNIT), apUnit],
    [path.join(unitDir, BOOT_WATCHDOG_UNIT), wdUnit],
    [path.join(unitDir, BOOT_WATCHDOG_TIMER), wdTimer],
    [path.join(autostartDir, BROWSER_DESKTOP), desktop],
  ];

  for (const [filePath, content] of targets) {
    if (dryRun) {
      writes.push({ path: filePath, written: false, reason: "DRY_RUN" });
      continue;
    }
    writes.push(await writeFileIdempotent(filePath, content));
  }

  // Also refresh versioned templates in repo (no secrets).
  const opsDir = path.join(ROOT, "ops", "systemd");
  const xdgDir = path.join(ROOT, "ops", "xdg");
  if (!dryRun) {
    await fs.mkdir(opsDir, { recursive: true });
    await fs.mkdir(xdgDir, { recursive: true });
    await writeFileIdempotent(
      path.join(opsDir, `${CONTROL_CENTER_UNIT}.template`),
      ccUnit.replaceAll(ROOT, "{{REPO_ROOT}}").replaceAll(nodeBin, "{{NODE_BIN}}"),
    );
    await writeFileIdempotent(
      path.join(opsDir, `${AUTOPILOT_UNIT}.template`),
      apUnit.replaceAll(ROOT, "{{REPO_ROOT}}").replaceAll(npmBin, "{{NPM_BIN}}"),
    );
    await writeFileIdempotent(
      path.join(opsDir, `${BOOT_WATCHDOG_UNIT}.template`),
      wdUnit.replaceAll(ROOT, "{{REPO_ROOT}}").replaceAll(nodeBin, "{{NODE_BIN}}"),
    );
    await writeFileIdempotent(
      path.join(opsDir, `${BOOT_WATCHDOG_TIMER}.template`),
      wdTimer,
    );
    await writeFileIdempotent(
      path.join(xdgDir, `${BROWSER_DESKTOP}.template`),
      desktop.replaceAll(ROOT, "{{REPO_ROOT}}").replaceAll(nodeBin, "{{NODE_BIN}}"),
    );
  }

  if (!dryRun) {
    await systemctlUser(["daemon-reload"], { dryRun });
    await systemctlUser(["enable", "--now", CONTROL_CENTER_UNIT], { dryRun });
    await systemctlUser(["enable", "--now", AUTOPILOT_UNIT], { dryRun });
    await systemctlUser(["enable", "--now", BOOT_WATCHDOG_TIMER], { dryRun });
  }

  const db = await ensureDbRestartPolicy({ dryRun });
  const linger = await readLinger();

  const result = {
    ok: true,
    mode: dryRun ? "DRY_RUN" : "LIVE",
    root: ROOT,
    nodeBin,
    npmBin,
    agentBin,
    writes,
    db,
    linger,
    lingerRequired: linger === "NO",
    lingerCommand:
      linger === "NO"
        ? `sudo loginctl enable-linger "${process.env.USER || "$USER"}"`
        : null,
    controlCenterUrl: CONTROL_CENTER_URL,
    units: ALLOWLISTED_UNITS,
  };

  if (linger === "NO") {
    result.LINGER_REQUIRED = "yes";
    result.COMMAND = result.lingerCommand;
  }

  return result;
}

async function status(options = {}) {
  const dryRun = options.dryRun ?? envFlag("X200_AUTOSTART_DRY_RUN");
  const home = options.home ?? process.env.X200_AUTOSTART_HOME ?? homedir();
  const desktopPath = path.join(home, ".config", "autostart", BROWSER_DESKTOP);

  let browserAutostart = false;
  try {
    await fs.access(desktopPath);
    browserAutostart = true;
  } catch {
    browserAutostart = false;
  }

  const controlCenterEnabled = await unitEnabled(CONTROL_CENTER_UNIT, { dryRun });
  const controlCenterActive = await unitActive(CONTROL_CENTER_UNIT, { dryRun });
  const autopilotEnabled = await unitEnabled(AUTOPILOT_UNIT, { dryRun });
  const autopilotActive = await unitActive(AUTOPILOT_UNIT, { dryRun });

  let databaseAutostart = false;
  let dbPolicy = null;
  let dbRunning = null;
  try {
    const { stdout } = await execFileAsync(
      "docker",
      [
        "inspect",
        "-f",
        "{{.HostConfig.RestartPolicy.Name}}|{{.State.Running}}",
        DB_CONTAINER,
      ],
      { timeout: 5_000 },
    );
    const [policy, running] = stdout.trim().split("|");
    dbPolicy = policy;
    dbRunning = running === "true";
    databaseAutostart = policy === "unless-stopped" || policy === "always";
  } catch {
    databaseAutostart = false;
  }

  const linger = await readLinger();
  let portState = "UNKNOWN";
  let portOwnerX200 = false;
  let controlCenterHttpOk = false;
  try {
    const { stdout } = await execFileAsync("ss", ["-ltnp", "sport = :3001"], {
      timeout: 5_000,
    });
    if (/:3001/.test(stdout)) {
      portState = "LISTENING";
      const pidMatch = stdout.match(/pid=(\d+)/);
      if (pidMatch) {
        try {
          const cwd = await fs.readlink(`/proc/${pidMatch[1]}/cwd`);
          if (cwd === ROOT) {
            portOwnerX200 = true;
            portState = "ALREADY_RUNNING";
          }
        } catch {
          // ignore
        }
      }
    } else {
      portState = "FREE";
    }
  } catch {
    portState = "UNKNOWN";
  }

  try {
    const res = await fetch(CONTROL_CENTER_URL, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(3_000),
    });
    controlCenterHttpOk =
      (res.status >= 200 && res.status < 400) ||
      res.status === 401 ||
      res.status === 303 ||
      res.status === 307 ||
      res.status === 308;
  } catch {
    controlCenterHttpOk = false;
  }

  const summary = summarizeAutostartStatus({
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
  });

  return {
    ...summary,
    CONTROL_CENTER_ACTIVE: controlCenterActive ? "YES" : "NO",
    CONTROL_CENTER_HTTP: controlCenterHttpOk ? "OK" : "DOWN",
    PORT_3001_OWNER: portOwnerX200 ? "X200" : portState === "FREE" ? "NONE" : "UNKNOWN",
    AUTOPILOT_ACTIVE: autopilotActive ? "YES" : "NO",
    DB_RESTART_POLICY: dbPolicy,
    DB_RUNNING: dbRunning == null ? "UNKNOWN" : dbRunning ? "YES" : "NO",
    BROWSER_AUTOSTART_FILE: desktopPath,
    CONTROL_CENTER_URL,
    LINGER_REQUIRED: linger === "NO" ? "yes" : "no",
    COMMAND:
      linger === "NO"
        ? `sudo loginctl enable-linger "${process.env.USER || "$USER"}"`
        : null,
  };
}

async function repair(options = {}) {
  // Repair only known X200-owned configuration.
  return install(options);
}

async function disable(options = {}) {
  const dryRun = options.dryRun ?? envFlag("X200_AUTOSTART_DRY_RUN");
  const home = options.home ?? process.env.X200_AUTOSTART_HOME ?? homedir();

  for (const unit of [
    BOOT_WATCHDOG_TIMER,
    BOOT_WATCHDOG_UNIT,
    CONTROL_CENTER_UNIT,
    AUTOPILOT_UNIT,
  ]) {
    assertAllowlistedUnit(unit);
    try {
      await systemctlUser(["disable", "--now", unit], { dryRun });
    } catch {
      // unit may already be inactive
    }
  }

  const desktopPath = path.join(home, ".config", "autostart", BROWSER_DESKTOP);
  if (!dryRun) {
    try {
      await fs.unlink(desktopPath);
    } catch {
      // absent ok
    }
  }

  return {
    ok: true,
    mode: dryRun ? "DRY_RUN" : "LIVE",
    disabled: ALLOWLISTED_UNITS,
    browserDesktopRemoved: desktopPath,
    note: "Only X200 autostart components touched; DB container left running",
  };
}

async function main() {
  const cmd = process.argv[2] || "status";
  let result;
  switch (cmd) {
    case "install":
      result = await install();
      break;
    case "status":
      result = await status();
      break;
    case "repair":
      result = await repair();
      break;
    case "disable":
      result = await disable();
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      console.error("Usage: x200-autostart.mjs <install|status|repair|disable>");
      process.exit(2);
  }
  console.log(JSON.stringify(result, null, 2));
  if (result.LINGER_REQUIRED === "yes" || result.lingerRequired) {
    console.error(`LINGER_REQUIRED=yes`);
    console.error(`COMMAND=${result.COMMAND || result.lingerCommand}`);
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

export { install, status, repair, disable };
