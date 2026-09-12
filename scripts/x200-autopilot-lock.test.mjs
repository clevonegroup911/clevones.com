import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  decideAfterAutoplan,
  decideSupervisorAction,
  wouldRecreateTerminatedTask,
} from "./lib/x200-autopilot-cycle.mjs";
import {
  acquireLock,
  classifyLock,
  isProcessAlive,
  readLockFile,
  releaseLock,
} from "./lib/x200-autopilot-lock.mjs";
import { completionMarkerMatches } from "./lib/x200-autoplan.mjs";

const LOCK_LIB = fileURLToPath(new URL("./lib/x200-autopilot-lock.mjs", import.meta.url));

function tempLockPath() {
  const dir = mkdtempSync(join(tmpdir(), "x200-lock-"));
  return { dir, lockPath: join(dir, "autopilot.lock") };
}

test("first daemon obtains the lock", () => {
  const { dir, lockPath } = tempLockPath();
  try {
    const result = acquireLock(lockPath, { pid: 1111, host: "fedora", alive: () => false, log: () => {} });
    assert.equal(result.ok, true);
    const parsed = readLockFile(lockPath);
    assert.equal(parsed.lock.pid, 1111);
    assert.equal(parsed.lock.host, "fedora");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("second daemon is refused while first is alive", () => {
  const { dir, lockPath } = tempLockPath();
  try {
    const first = acquireLock(lockPath, { pid: 2222, host: "fedora", alive: (pid) => pid === 2222, log: () => {} });
    assert.equal(first.ok, true);
    const second = acquireLock(lockPath, { pid: 3333, host: "fedora", alive: (pid) => pid === 2222, log: () => {} });
    assert.equal(second.ok, false);
    assert.equal(second.code, "AUTOPILOT_LOCKED");
    assert.equal(second.status, "LIVE_LOCK");
    assert.equal(readLockFile(lockPath).lock.pid, 2222);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("lock with dead PID is classified STALE", () => {
  const lock = { pid: 999999, host: "fedora", startedAt: "2026-09-12T00:00:00.000Z" };
  assert.equal(classifyLock(lock, { host: "fedora", alive: () => false }), "STALE_LOCK");
  assert.equal(classifyLock(lock, { host: "fedora", alive: () => true }), "LIVE_LOCK");
  assert.equal(classifyLock(lock, { host: "other", alive: () => false }), "FOREIGN_LOCK");
});

test("stale lock is recovered automatically once", () => {
  const { dir, lockPath } = tempLockPath();
  try {
    writeFileSync(lockPath, `${JSON.stringify({ pid: 4444, host: "fedora", startedAt: "2026-09-11T00:00:00.000Z" })}\n`);
    const result = acquireLock(lockPath, {
      pid: 5555,
      host: "fedora",
      alive: () => false,
      log: () => {},
    });
    assert.equal(result.ok, true);
    assert.equal(result.healed, true);
    assert.equal(readLockFile(lockPath).lock.pid, 5555);
    const archived = readdirSync(dir).filter((name) => name.includes(".stale."));
    assert.equal(archived.length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("process cannot delete another process lock", () => {
  const { dir, lockPath } = tempLockPath();
  try {
    acquireLock(lockPath, { pid: 6666, host: "fedora", alive: () => true, log: () => {} });
    const release = releaseLock(lockPath, { pid: 7777, host: "fedora", log: () => {} });
    assert.equal(release.released, false);
    assert.equal(release.reason, "NOT_OWNER");
    assert.equal(readLockFile(lockPath).lock.pid, 6666);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("invalid lock JSON is not overwritten silently", () => {
  const { dir, lockPath } = tempLockPath();
  try {
    writeFileSync(lockPath, "not-json\n");
    const result = acquireLock(lockPath, { pid: 8888, host: "fedora", log: () => {} });
    assert.equal(result.ok, false);
    assert.equal(result.code, "AUTOPILOT_LOCK_INVALID");
    assert.equal(readFileSync(lockPath, "utf8").trim(), "not-json");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("SIGTERM releases only the owned lock", async () => {
  const { dir, lockPath } = tempLockPath();
  const script = join(dir, "sigterm-holder.mjs");
  writeFileSync(script, `
import { acquireLock, releaseLock } from ${JSON.stringify(LOCK_LIB)};
const lockPath = process.argv[2];
const result = acquireLock(lockPath);
if (!result.ok) process.exit(2);
let owned = true;
function releaseOwned() {
  if (!owned) return;
  releaseLock(lockPath);
  owned = false;
}
process.on("SIGTERM", () => {
  releaseOwned();
  process.exit(0);
});
process.stdout.write("READY\\n");
setInterval(() => {}, 1000);
`);

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, lockPath], { stdio: ["ignore", "pipe", "pipe"] });
    let ready = false;
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes("READY") && !ready) {
        ready = true;
        assert.equal(readLockFile(lockPath).lock.pid, child.pid);
        child.kill("SIGTERM");
      }
    });
    child.on("exit", (code) => {
      try {
        assert.equal(code, 0);
        assert.equal(readLockFile(lockPath).missing, true);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    child.on("error", reject);
    setTimeout(() => reject(new Error("SIGTERM lock test timed out")), 5000);
  });

  rmSync(dir, { recursive: true, force: true });
});

test("absence of PRÊTE automatic task triggers AUTOPLAN", () => {
  const decision = decideSupervisorAction({
    backlog: { tasks: [{ id: "T001", status: "TERMINÉE", requiresHuman: false, evidence: ["ok"] }] },
    hasFastLanePrompt: false,
    head: "abc",
    goalHash: "goal",
    completionMarker: null,
  });
  assert.equal(decision.action, "AUTOPLAN");
  assert.equal(decision.reason, "NO_READY_AUTOMATIC_TASK");
});

test("AUTOPLAN must not recreate a TERMINÉE task with evidence", () => {
  const backlog = {
    tasks: [{ id: "T010", status: "TERMINÉE", requiresHuman: true, evidence: ["quality=SUCCESS on sha"] }],
  };
  assert.equal(wouldRecreateTerminatedTask(backlog, { id: "T010", title: "redeploy" }), true);
  assert.equal(wouldRecreateTerminatedTask(backlog, { id: "T099", title: "new" }), false);
});

test("valid PRODUCT_COMPLETE stops false work generation", () => {
  const marker = {
    version: 1,
    head: "abc",
    goalHash: "goal",
    evidence: ["tests pass"],
  };
  assert.equal(completionMarkerMatches(marker, { head: "abc", goalHash: "goal" }), true);
  const decision = decideSupervisorAction({
    backlog: { tasks: [] },
    hasFastLanePrompt: false,
    head: "abc",
    goalHash: "goal",
    completionMarker: marker,
  });
  assert.equal(decision.action, "AUTOPLAN_COMPLETE");
});

test("human gate remains blocking only for its perimeter", () => {
  const after = decideAfterAutoplan({
    backlogAfter: {
      tasks: [
        { id: "T050", status: "PRÊTE", requiresHuman: true, title: "prod" },
        { id: "T051", status: "TERMINÉE", requiresHuman: false, evidence: ["ok"] },
      ],
    },
    hasFastLanePrompt: false,
    head: "abc",
    goalHash: "goal",
    completionMarker: null,
  });
  assert.equal(after.action, "HUMAN_GATE");
  assert.equal(after.tasks.map((t) => t.id).join(","), "T050");

  const withIndependentWork = decideAfterAutoplan({
    backlogAfter: {
      tasks: [
        { id: "T050", status: "PRÊTE", requiresHuman: true, title: "prod" },
        { id: "T052", status: "PRÊTE", requiresHuman: false, title: "docs" },
      ],
    },
    hasFastLanePrompt: true,
    head: "abc",
    goalHash: "goal",
    completionMarker: null,
  });
  assert.equal(withIndependentWork.action, "AUTOPLAN_CREATED_WORK");
});

test("isProcessAlive matches kill -0 semantics for current pid", () => {
  assert.equal(isProcessAlive(process.pid), true);
  assert.equal(isProcessAlive(1_000_000_001), false);
});
