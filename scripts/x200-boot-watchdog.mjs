#!/usr/bin/env node
/**
 * Bounded boot health watchdog (oneshot, driven by systemd timer ~60s).
 * - Never reboots host
 * - Never kills unknown processes
 * - Never resets DB
 * - Only restarts allowlisted clevones-x200-control-center.service
 */

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STATE_PATH = path.join(ROOT, ".x200", "boot-watchdog.json");
const AUDIT_PATH = path.join(ROOT, ".x200", "boot-watchdog-audit.jsonl");
const UNIT = "clevones-x200-control-center.service";
const URL = "http://127.0.0.1:3001/admin/x200";
const FAILURE_THRESHOLD = 3;
const MAX_RECOVERIES = 5;
const COOLDOWN_MS = 15 * 60_000;

function emptyState() {
  return {
    consecutiveFailures: 0,
    recoveryCount: 0,
    lastRecoveryAt: null,
    lastFailureAt: null,
    cooldownUntil: null,
    lastCheckAt: null,
    lastResult: null,
  };
}

async function readState() {
  try {
    return { ...emptyState(), ...JSON.parse(await fs.readFile(STATE_PATH, "utf8")) };
  } catch {
    return emptyState();
  }
}

async function writeState(state) {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, {
    mode: 0o600,
  });
}

async function appendAudit(entry) {
  await fs.mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  await fs.appendFile(AUDIT_PATH, `${JSON.stringify(entry)}\n`, { mode: 0o600 });
}

async function healthy() {
  try {
    const res = await fetch(URL, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(4_000),
    });
    return (
      (res.status >= 200 && res.status < 400) ||
      res.status === 401 ||
      res.status === 303 ||
      res.status === 307 ||
      res.status === 308
    );
  } catch {
    return false;
  }
}

async function restartUnit() {
  await execFileAsync("systemctl", ["--user", "restart", UNIT], {
    timeout: 45_000,
  });
}

async function main() {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  let state = await readState();

  if (state.cooldownUntil && Date.parse(state.cooldownUntil) > now) {
    state.lastCheckAt = nowIso;
    await writeState(state);
    console.log(
      JSON.stringify({
        WATCHDOG_STATUS: "COOLDOWN",
        CONSECUTIVE_FAILURES: state.consecutiveFailures,
        RECOVERY_COUNT: state.recoveryCount,
        LAST_RECOVERY: state.lastRecoveryAt,
        COOLDOWN_STATE: "ACTIVE",
      }),
    );
    return;
  }

  const ok = await healthy();
  if (ok) {
    state = {
      ...state,
      consecutiveFailures: 0,
      lastCheckAt: nowIso,
      lastResult: "OK",
      cooldownUntil: null,
    };
    await writeState(state);
    console.log(
      JSON.stringify({
        WATCHDOG_STATUS: "OK",
        CONSECUTIVE_FAILURES: 0,
        RECOVERY_COUNT: state.recoveryCount,
        LAST_RECOVERY: state.lastRecoveryAt,
        COOLDOWN_STATE: "NONE",
      }),
    );
    return;
  }

  state.consecutiveFailures += 1;
  state.lastFailureAt = nowIso;
  state.lastCheckAt = nowIso;
  state.lastResult = "FAIL";

  if (state.consecutiveFailures < FAILURE_THRESHOLD) {
    await writeState(state);
    console.log(
      JSON.stringify({
        WATCHDOG_STATUS: "DEGRADED",
        CONSECUTIVE_FAILURES: state.consecutiveFailures,
        RECOVERY_COUNT: state.recoveryCount,
        LAST_RECOVERY: state.lastRecoveryAt,
        COOLDOWN_STATE: "NONE",
      }),
    );
    return;
  }

  if (state.recoveryCount >= MAX_RECOVERIES) {
    state.cooldownUntil = new Date(now + COOLDOWN_MS).toISOString();
    await writeState(state);
    await appendAudit({
      at: nowIso,
      action: "COOLDOWN",
      reason: "MAX_RECOVERIES",
      unit: UNIT,
    });
    console.log(
      JSON.stringify({
        WATCHDOG_STATUS: "COOLDOWN",
        CONSECUTIVE_FAILURES: state.consecutiveFailures,
        RECOVERY_COUNT: state.recoveryCount,
        LAST_RECOVERY: state.lastRecoveryAt,
        COOLDOWN_STATE: "ACTIVE",
      }),
    );
    return;
  }

  try {
    await restartUnit();
    state.recoveryCount += 1;
    state.consecutiveFailures = 0;
    state.lastRecoveryAt = nowIso;
    if (state.recoveryCount >= MAX_RECOVERIES) {
      state.cooldownUntil = new Date(now + COOLDOWN_MS).toISOString();
    }
    await writeState(state);
    await appendAudit({
      at: nowIso,
      action: "RECOVER",
      unit: UNIT,
      recoveryCount: state.recoveryCount,
    });
    console.log(
      JSON.stringify({
        WATCHDOG_STATUS: "RECOVERED",
        CONSECUTIVE_FAILURES: 0,
        RECOVERY_COUNT: state.recoveryCount,
        LAST_RECOVERY: state.lastRecoveryAt,
        COOLDOWN_STATE: state.cooldownUntil ? "ACTIVE" : "NONE",
      }),
    );
  } catch (error) {
    await writeState(state);
    await appendAudit({
      at: nowIso,
      action: "RECOVER_FAILED",
      unit: UNIT,
      error: error instanceof Error ? error.message.slice(0, 160) : "error",
    });
    console.log(
      JSON.stringify({
        WATCHDOG_STATUS: "DEGRADED",
        CONSECUTIVE_FAILURES: state.consecutiveFailures,
        RECOVERY_COUNT: state.recoveryCount,
        LAST_RECOVERY: state.lastRecoveryAt,
        COOLDOWN_STATE: "NONE",
      }),
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
