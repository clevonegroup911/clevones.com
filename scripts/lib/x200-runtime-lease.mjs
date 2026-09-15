import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

import { readJsonFile, writeJsonFileAtomic } from "./x100-fs.mjs";

export const DEFAULT_RUNTIME_LEASE_PATH = ".x200/runtime/autopilot-lease.json";
export const RUNTIME_LEASE_SCHEMA_VERSION = 1;

/**
 * Runtime AUTOPILOT lease / heartbeat — never versioned in Git.
 * Must not contain secrets (no claim tokens, env values, credentials).
 * @typedef {{
 *   schemaVersion: number,
 *   taskId: string,
 *   workerId: string,
 *   claimedAt: string | null,
 *   expiresAt: string,
 *   renewedAt: string | null,
 *   heartbeatAt: string,
 *   leaseSeconds: number | null,
 * }} RuntimeLease
 */

export function runtimeLeasePath(filePath = DEFAULT_RUNTIME_LEASE_PATH) {
  return resolve(filePath);
}

/**
 * @param {unknown} raw
 * @returns {RuntimeLease | null}
 */
export function normalizeRuntimeLease(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const record = /** @type {Record<string, unknown>} */ (raw);
  if (typeof record.taskId !== "string" || !record.taskId.trim()) {
    return null;
  }
  if (typeof record.workerId !== "string" || !record.workerId.trim()) {
    return null;
  }
  if (typeof record.expiresAt !== "string" || !record.expiresAt.trim()) {
    return null;
  }
  if ("token" in record) {
    // Refuse secret-bearing payloads; callers must rewrite without token.
    return null;
  }
  return {
    schemaVersion:
      typeof record.schemaVersion === "number"
        ? record.schemaVersion
        : RUNTIME_LEASE_SCHEMA_VERSION,
    taskId: record.taskId,
    workerId: record.workerId,
    claimedAt: typeof record.claimedAt === "string" ? record.claimedAt : null,
    expiresAt: record.expiresAt,
    renewedAt: typeof record.renewedAt === "string" ? record.renewedAt : null,
    heartbeatAt:
      typeof record.heartbeatAt === "string"
        ? record.heartbeatAt
        : typeof record.renewedAt === "string"
          ? record.renewedAt
          : record.expiresAt,
    leaseSeconds:
      Number.isInteger(record.leaseSeconds) ? record.leaseSeconds : null,
  };
}

/**
 * @param {{
 *   taskId: string,
 *   workerId: string,
 *   expiresAt: string,
 *   claimedAt?: string | null,
 *   renewedAt?: string | null,
 *   heartbeatAt?: string | null,
 *   leaseSeconds?: number | null,
 * }} input
 * @returns {RuntimeLease}
 */
export function buildRuntimeLease(input) {
  const heartbeatAt =
    input.heartbeatAt || input.renewedAt || input.claimedAt || input.expiresAt;
  return {
    schemaVersion: RUNTIME_LEASE_SCHEMA_VERSION,
    taskId: input.taskId,
    workerId: input.workerId,
    claimedAt: input.claimedAt ?? null,
    expiresAt: input.expiresAt,
    renewedAt: input.renewedAt ?? null,
    heartbeatAt,
    leaseSeconds: Number.isInteger(input.leaseSeconds) ? input.leaseSeconds : null,
  };
}

export function readRuntimeLease(filePath = DEFAULT_RUNTIME_LEASE_PATH) {
  const absolute = runtimeLeasePath(filePath);
  if (!existsSync(absolute)) {
    return { ok: true, missing: true, lease: null, path: absolute };
  }
  const loaded = readJsonFile(absolute);
  if (!loaded.ok) {
    return { ok: false, missing: false, lease: null, path: absolute, error: loaded.error };
  }
  const lease = normalizeRuntimeLease(loaded.data);
  if (!lease) {
    return {
      ok: false,
      missing: false,
      lease: null,
      path: absolute,
      error: "RUNTIME_LEASE_INVALID",
    };
  }
  return { ok: true, missing: false, lease, path: absolute };
}

export function writeRuntimeLease(lease, filePath = DEFAULT_RUNTIME_LEASE_PATH) {
  const normalized = normalizeRuntimeLease(lease);
  if (!normalized) {
    return { ok: false, error: "RUNTIME_LEASE_INVALID" };
  }
  const absolute = writeJsonFileAtomic(filePath, normalized);
  return { ok: true, path: absolute, lease: normalized };
}

export function clearRuntimeLease(filePath = DEFAULT_RUNTIME_LEASE_PATH) {
  const absolute = runtimeLeasePath(filePath);
  if (!existsSync(absolute)) {
    return { ok: true, cleared: false, path: absolute };
  }
  unlinkSync(absolute);
  return { ok: true, cleared: true, path: absolute };
}

/**
 * Overlay ephemeral expiry/heartbeat from runtime onto the durable backlog claim.
 * Durable identity (workerId, token, claimedAt) stays on the claim object.
 */
export function mergeClaimWithRuntime(claim, runtimeLease, taskId) {
  if (!claim || typeof claim !== "object") {
    return claim;
  }
  if (
    !runtimeLease ||
    runtimeLease.taskId !== taskId ||
    (runtimeLease.workerId &&
      claim.workerId &&
      runtimeLease.workerId !== claim.workerId)
  ) {
    return claim;
  }
  return {
    ...claim,
    expiresAt: runtimeLease.expiresAt || claim.expiresAt,
    renewedAt: runtimeLease.renewedAt ?? claim.renewedAt ?? null,
    heartbeatAt: runtimeLease.heartbeatAt || runtimeLease.renewedAt || null,
  };
}

/**
 * When EN_COURS has a durable claim but runtime lease is missing/mismatched,
 * rebuild runtime from the durable claim (self-heal without touching backlog).
 */
export function healRuntimeLeaseFromClaim(task, {
  filePath = DEFAULT_RUNTIME_LEASE_PATH,
  dryRun = false,
  nowIso = null,
} = {}) {
  if (!task || task.status !== "EN_COURS" || !task.claim) {
    return { ok: true, healed: false, lease: null };
  }
  const existing = readRuntimeLease(filePath);
  if (
    existing.ok &&
    existing.lease &&
    existing.lease.taskId === task.id &&
    existing.lease.workerId === task.claim.workerId
  ) {
    return { ok: true, healed: false, lease: existing.lease };
  }

  const lease = buildRuntimeLease({
    taskId: task.id,
    workerId: task.claim.workerId,
    claimedAt: task.claim.claimedAt || null,
    expiresAt: task.claim.expiresAt,
    renewedAt: task.claim.renewedAt || null,
    heartbeatAt: nowIso || task.claim.renewedAt || task.claim.claimedAt || task.claim.expiresAt,
    leaseSeconds: task.claim.leaseSeconds ?? null,
  });

  if (dryRun) {
    return { ok: true, healed: true, dryRun: true, lease };
  }
  const written = writeRuntimeLease(lease, filePath);
  if (!written.ok) {
    return written;
  }
  return { ok: true, healed: true, lease: written.lease, path: written.path };
}
