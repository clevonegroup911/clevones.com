/**
 * Fedora AUTOPILOT → Control Center telemetry writer (T043).
 * Writes `.x200/telemetry.json` mode 0600 without secrets.
 */

import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { resolve } from "node:path";

export const TELEMETRY_FILE_NAME = "telemetry.json";
export const TELEMETRY_VERSION = 1;

/** @typedef {"daemon"|"once"|"single"} TelemetryMode */
/** @typedef {"BOOT"|"FAST_LANE"|"AUTOPLAN"|"AUTOPLAN_COMPLETE"|"HUMAN_GATE"|"WAIT"|"IDLE"|"SHUTDOWN"} TelemetryEvent */

/**
 * @param {string} [root]
 * @returns {string}
 */
export function resolveTelemetryPath(root = process.cwd()) {
  return resolve(root, ".x200", TELEMETRY_FILE_NAME);
}

/**
 * @param {object} input
 * @param {string} [input.root]
 * @param {number} [input.pid]
 * @param {string} [input.host]
 * @param {TelemetryMode} input.mode
 * @param {string|null} input.head
 * @param {string|null} input.branch
 * @param {TelemetryEvent} input.lastEvent
 * @param {number} [input.cycle]
 * @param {boolean} [input.agentRunning]
 * @param {string|null} [input.taskId]
 * @param {string} [input.updatedAt]
 */
export function buildTelemetryPayload(input) {
  return {
    version: TELEMETRY_VERSION,
    updatedAt: input.updatedAt || new Date().toISOString(),
    pid: typeof input.pid === "number" ? input.pid : process.pid,
    host: input.host || hostname(),
    mode: input.mode,
    head: input.head || null,
    branch: input.branch || null,
    lastEvent: input.lastEvent,
    cycle: typeof input.cycle === "number" ? input.cycle : 0,
    agentRunning: input.agentRunning === true,
    taskId: typeof input.taskId === "string" ? input.taskId : null,
  };
}

/**
 * @param {ReturnType<typeof buildTelemetryPayload>} payload
 * @param {{ root?: string }} [options]
 */
export function writeTelemetryFile(payload, options = {}) {
  const root = options.root || process.cwd();
  const stateDir = resolve(root, ".x200");
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const path = resolveTelemetryPath(root);
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  // mode on writeFileSync only applies at create-time; force 0600 on updates too.
  chmodSync(path, 0o600);
  return path;
}
