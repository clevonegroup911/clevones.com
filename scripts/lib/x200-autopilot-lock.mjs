import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";
import { dirname, resolve } from "node:path";

export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error && error.code === "EPERM";
  }
}

export function readLockFile(lockPath) {
  if (!existsSync(lockPath)) return { ok: true, missing: true, lock: null };
  let raw;
  try {
    raw = readFileSync(lockPath, "utf8").trim();
  } catch (error) {
    return { ok: false, error: "LOCK_UNREADABLE", detail: String(error), lock: null };
  }
  if (!raw) {
    return { ok: false, error: "LOCK_INVALID_JSON", detail: "empty lock file", lock: null };
  }
  try {
    const lock = JSON.parse(raw);
    if (!lock || typeof lock !== "object" || Array.isArray(lock)) {
      return { ok: false, error: "LOCK_INVALID_JSON", detail: "lock root must be an object", lock: null };
    }
    if (!Number.isInteger(lock.pid) || lock.pid <= 0) {
      return { ok: false, error: "LOCK_INVALID_JSON", detail: "pid must be a positive integer", lock: null };
    }
    if (typeof lock.host !== "string" || !lock.host.trim()) {
      return { ok: false, error: "LOCK_INVALID_JSON", detail: "host must be a non-empty string", lock: null };
    }
    return { ok: true, missing: false, lock };
  } catch (error) {
    return { ok: false, error: "LOCK_INVALID_JSON", detail: String(error), lock: null };
  }
}

export function classifyLock(lock, { host = hostname(), alive = isProcessAlive } = {}) {
  if (!lock) return "NO_LOCK";
  if (lock.host !== host) return "FOREIGN_LOCK";
  return alive(lock.pid) ? "LIVE_LOCK" : "STALE_LOCK";
}

export function archiveLock(lockPath, timestamp = new Date()) {
  const stamp = timestamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const archivedPath = `${lockPath}.stale.${stamp}`;
  renameSync(lockPath, archivedPath);
  return archivedPath;
}

function writeNewLock(lockPath, { pid = process.pid, host = hostname(), startedAt = new Date().toISOString() } = {}) {
  mkdirSync(dirname(lockPath), { recursive: true, mode: 0o700 });
  const fd = openSync(lockPath, "wx", 0o600);
  try {
    writeFileSync(fd, `${JSON.stringify({ pid, host, startedAt })}\n`);
  } finally {
    closeSync(fd);
  }
  return { pid, host, startedAt, path: lockPath };
}

/**
 * Acquire an exclusive autopilot lock with single stale-lock self-heal.
 * Never deletes a LIVE lock. Never silently overwrites invalid JSON.
 */
export function acquireLock(lockPath, {
  pid = process.pid,
  host = hostname(),
  alive = isProcessAlive,
  now = () => new Date(),
  log = (line) => process.stderr.write(`${line}\n`),
} = {}) {
  mkdirSync(dirname(lockPath), { recursive: true, mode: 0o700 });

  const attempt = (allowStaleHeal) => {
    try {
      const lock = writeNewLock(lockPath, { pid, host, startedAt: now().toISOString() });
      return { ok: true, lock, healed: !allowStaleHeal };
    } catch (error) {
      if (!error || error.code !== "EEXIST") throw error;

      const parsed = readLockFile(lockPath);
      if (!parsed.ok) {
        log(`AUTOPILOT_LOCK_INVALID path=${lockPath} error=${parsed.error} detail=${parsed.detail}`);
        return { ok: false, code: "AUTOPILOT_LOCK_INVALID", error: parsed.error, detail: parsed.detail };
      }

      const status = classifyLock(parsed.lock, { host, alive });
      if (status === "LIVE_LOCK" || status === "FOREIGN_LOCK") {
        log(`AUTOPILOT_LOCKED path=${lockPath} status=${status} pid=${parsed.lock.pid} host=${parsed.lock.host}`);
        return { ok: false, code: "AUTOPILOT_LOCKED", status, lock: parsed.lock };
      }

      if (status === "STALE_LOCK" && allowStaleHeal) {
        const archived = archiveLock(lockPath, now());
        log(`AUTOPILOT_STALE_LOCK_ARCHIVED path=${lockPath} archived=${archived} deadPid=${parsed.lock.pid}`);
        return attempt(false);
      }

      log(`AUTOPILOT_LOCKED path=${lockPath} status=${status} pid=${parsed.lock.pid} host=${parsed.lock.host}`);
      return { ok: false, code: "AUTOPILOT_LOCKED", status, lock: parsed.lock };
    }
  };

  return attempt(true);
}

/**
 * Release a lock only when the caller still owns it.
 * Returns whether the lock file was removed.
 */
export function releaseLock(lockPath, {
  pid = process.pid,
  host = hostname(),
  log = (line) => process.stderr.write(`${line}\n`),
} = {}) {
  const parsed = readLockFile(lockPath);
  if (parsed.missing) return { ok: true, released: false, reason: "NO_LOCK" };
  if (!parsed.ok) {
    log(`AUTOPILOT_LOCK_RELEASE_SKIPPED path=${lockPath} reason=${parsed.error}`);
    return { ok: false, released: false, reason: parsed.error, detail: parsed.detail };
  }
  if (parsed.lock.pid !== pid || parsed.lock.host !== host) {
    log(
      `AUTOPILOT_LOCK_RELEASE_SKIPPED path=${lockPath} reason=NOT_OWNER `
      + `ownerPid=${parsed.lock.pid} ownerHost=${parsed.lock.host} callerPid=${pid} callerHost=${host}`,
    );
    return { ok: true, released: false, reason: "NOT_OWNER", lock: parsed.lock };
  }
  rmSync(lockPath, { force: true });
  return { ok: true, released: true, reason: "OWNED" };
}

export function resolveAutopilotLockPath(root = process.cwd()) {
  return resolve(root, ".x200", "autopilot.lock");
}
