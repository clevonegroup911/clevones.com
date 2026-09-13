import { chmodSync, fsyncSync, mkdirSync, openSync, closeSync, renameSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { resolve } from "node:path";

export const TELEMETRY_FILE_NAME = "telemetry.json";
export const TELEMETRY_VERSION = 1;

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
 * @param {string} input.mode
 * @param {string|null} input.head
 * @param {string|null} input.branch
 * @param {string} input.lastEvent
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
 * Atomic write: temp file → fsync → chmod 0600 → rename over telemetry.json.
 * Readers never observe a truncated JSON body mid-write.
 *
 * @param {ReturnType<typeof buildTelemetryPayload>} payload
 * @param {{ root?: string }} [options]
 */
export function writeTelemetryFile(payload, options = {}) {
  const root = options.root || process.cwd();
  const stateDir = resolve(root, ".x200");
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const path = resolveTelemetryPath(root);
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  const fd = openSync(tmp, "w", 0o600);
  try {
    writeFileSync(fd, body);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  chmodSync(tmp, 0o600);
  renameSync(tmp, path);
  chmodSync(path, 0o600);
  return path;
}
