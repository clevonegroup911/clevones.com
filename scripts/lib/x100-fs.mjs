import {
  closeSync,
  constants,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function readJsonFile(filePath) {
  const absolute = resolve(filePath);
  let raw;
  try {
    raw = readFileSync(absolute, "utf8");
  } catch (error) {
    return {
      ok: false,
      error: `lecture impossible: ${error instanceof Error ? error.message : String(error)}`,
      path: absolute,
    };
  }
  try {
    return { ok: true, data: JSON.parse(raw), raw, path: absolute };
  } catch (error) {
    return {
      ok: false,
      error: `JSON invalide: ${error instanceof Error ? error.message : String(error)}`,
      path: absolute,
      raw,
    };
  }
}

export function writeJsonFileAtomic(filePath, data) {
  const absolute = resolve(filePath);
  const dir = dirname(absolute);
  mkdirSync(dir, { recursive: true });
  const tmp = `${absolute}.${process.pid}.${Date.now()}.tmp`;
  const json = `${JSON.stringify(data, null, 2)}\n`;
  writeFileSync(tmp, json, { encoding: "utf8", mode: 0o644 });
  renameSync(tmp, absolute);
  return absolute;
}

export function writeJsonFile(filePath, data) {
  return writeJsonFileAtomic(filePath, data);
}

export function readTextFile(filePath) {
  return readFileSync(resolve(filePath), "utf8");
}

export function isCliEntry(metaUrl, argv1 = process.argv[1]) {
  if (!argv1) {
    return false;
  }
  return resolve(argv1) === fileURLToPath(metaUrl);
}

export function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function acquireExclusiveLock(lockPath, payload, { staleMs = 2 * 60 * 60 * 1000 } = {}) {
  const absolute = resolve(lockPath);
  mkdirSync(dirname(absolute), { recursive: true });

  const tryOpen = () => {
    const fd = openSync(absolute, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    try {
      writeFileSync(fd, `${JSON.stringify(payload, null, 2)}\n`);
    } catch (error) {
      closeSync(fd);
      throw error;
    }
    return { ok: true, path: absolute, fd, created: true };
  };

  try {
    return tryOpen();
  } catch (error) {
    if (error?.code !== "EEXIST") {
      return {
        ok: false,
        error: `verrou: ${error instanceof Error ? error.message : String(error)}`,
        path: absolute,
      };
    }
  }

  let existing = null;
  try {
    existing = JSON.parse(readFileSync(absolute, "utf8"));
  } catch {
    existing = null;
  }

  const mtimeMs = existsSync(absolute) ? statSync(absolute).mtimeMs : 0;
  const ageMs = Date.now() - mtimeMs;
  const holderAlive = isPidAlive(existing?.pid);
  const stale = !holderAlive || ageMs > staleMs;

  if (!stale) {
    return {
      ok: false,
      error: "LOCK_HELD",
      path: absolute,
      holder: existing?.workerId || existing?.pid || "unknown",
    };
  }

  try {
    unlinkSync(absolute);
  } catch (error) {
    return {
      ok: false,
      error: `verrou stale non supprimable: ${error instanceof Error ? error.message : String(error)}`,
      path: absolute,
    };
  }

  try {
    return tryOpen();
  } catch (error) {
    return {
      ok: false,
      error: error?.code === "EEXIST" ? "LOCK_HELD" : String(error),
      path: absolute,
    };
  }
}

export function releaseExclusiveLock(lockHandle) {
  if (!lockHandle || !lockHandle.path) {
    return;
  }
  try {
    if (typeof lockHandle.fd === "number") {
      closeSync(lockHandle.fd);
    }
  } catch {
    // already closed
  }
  try {
    unlinkSync(lockHandle.path);
  } catch {
    // already released
  }
}

export function withExclusiveLock(lockPath, payload, fn, options) {
  const lock = acquireExclusiveLock(lockPath, payload, options);
  if (!lock.ok) {
    return { ok: false, error: lock.error, holder: lock.holder };
  }
  try {
    return fn(lock);
  } finally {
    releaseExclusiveLock(lock);
  }
}
