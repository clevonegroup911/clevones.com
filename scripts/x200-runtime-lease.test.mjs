import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import { createBacklogDocument, createTaskDocument } from "./lib/x100-backlog.mjs";
import { writeJsonFileAtomic } from "./lib/x100-fs.mjs";
import {
  claimTask,
  ensureRuntimeLeaseForActiveClaims,
  mutateBacklogAtomic,
  resumeInspection,
} from "./lib/x200-claim.mjs";
import {
  buildRuntimeLease,
  clearRuntimeLease,
  normalizeRuntimeLease,
  readRuntimeLease,
  writeRuntimeLease,
} from "./lib/x200-runtime-lease.mjs";

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function gitPorcelain(cwd) {
  const run = spawnSync("git", ["status", "--porcelain"], {
    cwd,
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr || "git status failed");
  return (run.stdout || "").trim();
}

function initTrackedBacklogRepo() {
  const dir = mkdtempSync(join(tmpdir(), "x200-lease-git-"));
  const backlogPath = join(dir, "backlog.json");
  const lockPath = join(dir, ".x200", "executor.lock");
  const runtimeLeasePath = join(dir, ".x200", "runtime", "autopilot-lease.json");
  mkdirSync(join(dir, ".x200", "runtime"), { recursive: true });

  const backlog = createBacklogDocument([
    createTaskDocument({ id: "T001", status: "TERMINÉE", evidence: ["ok"] }),
    createTaskDocument({ id: "T002", status: "PRÊTE", dependencies: ["T001"] }),
  ]);
  writeJsonFileAtomic(backlogPath, backlog);

  const gitInit = spawnSync("git", ["init"], { cwd: dir, encoding: "utf8" });
  assert.equal(gitInit.status, 0, gitInit.stderr);
  spawnSync("git", ["config", "user.email", "lease-test@example.com"], { cwd: dir });
  spawnSync("git", ["config", "user.name", "Lease Test"], { cwd: dir });
  writeFileSync(join(dir, ".gitignore"), ".x200/\n", "utf8");
  const add = spawnSync("git", ["add", "backlog.json", ".gitignore"], {
    cwd: dir,
    encoding: "utf8",
  });
  assert.equal(add.status, 0, add.stderr);
  const commit = spawnSync("git", ["commit", "-m", "seed"], {
    cwd: dir,
    encoding: "utf8",
  });
  assert.equal(commit.status, 0, commit.stderr);

  return { dir, backlogPath, lockPath, runtimeLeasePath };
}

test("runtime lease rejects secret token payloads", () => {
  assert.equal(
    normalizeRuntimeLease({
      taskId: "T001",
      workerId: "w",
      expiresAt: "2099-01-01T00:00:00.000Z",
      token: "secret",
    }),
    null,
  );
});

test("renew lease x3 keeps backlog hash stable, updates runtime, keeps git clean", () => {
  const { dir, backlogPath, lockPath, runtimeLeasePath } = initTrackedBacklogRepo();
  try {
    const claimed = mutateBacklogAtomic({
      filePath: backlogPath,
      lockPath,
      runtimeLeasePath,
      workerId: "worker-a",
      mutator(data, { runtimeLease } = {}) {
        return claimTask(data, {
          taskId: "T002",
          workerId: "worker-a",
          leaseSeconds: 3600,
          runtimeLease,
        });
      },
    });
    assert.equal(claimed.ok, true);
    assert.equal(claimed.action, "claimed");
    assert.equal(claimed.wrote, true);

    // Commit the business transition so renewals start from a clean worktree.
    const add = spawnSync("git", ["add", "backlog.json"], { cwd: dir, encoding: "utf8" });
    assert.equal(add.status, 0, add.stderr);
    const commit = spawnSync("git", ["commit", "-m", "claim"], {
      cwd: dir,
      encoding: "utf8",
    });
    assert.equal(commit.status, 0, commit.stderr);
    assert.equal(gitPorcelain(dir), "");

    const hashBefore = sha256File(backlogPath);
    const registryBefore = JSON.parse(readFileSync(backlogPath, "utf8")).registryVersion;
    let lastExpires = null;

    for (let i = 0; i < 3; i += 1) {
      const renewed = mutateBacklogAtomic({
        filePath: backlogPath,
        lockPath,
        runtimeLeasePath,
        workerId: "worker-a",
        mutator(data, { runtimeLease } = {}) {
          return claimTask(data, {
            taskId: "T002",
            workerId: "worker-a",
            leaseSeconds: 3600,
            runtimeLease,
            now: new Date(Date.now() + (i + 1) * 60_000),
          });
        },
      });
      assert.equal(renewed.ok, true, renewed.error);
      assert.equal(renewed.action, "renewed");
      assert.equal(renewed.wrote, false);
      assert.equal(renewed.backlogUnchanged, true);
      assert.equal(sha256File(backlogPath), hashBefore);
      assert.equal(
        JSON.parse(readFileSync(backlogPath, "utf8")).registryVersion,
        registryBefore,
      );
      assert.equal(gitPorcelain(dir), "");

      const runtime = readRuntimeLease(runtimeLeasePath);
      assert.equal(runtime.ok, true);
      assert.equal(runtime.lease?.taskId, "T002");
      assert.equal(runtime.lease?.workerId, "worker-a");
      assert.ok(runtime.lease?.expiresAt);
      assert.ok(runtime.lease?.renewedAt);
      assert.ok(runtime.lease?.heartbeatAt);
      assert.equal("token" in (runtime.lease || {}), false);
      lastExpires = runtime.lease.expiresAt;
    }

    assert.ok(lastExpires);
    const backlogClaim = JSON.parse(readFileSync(backlogPath, "utf8")).tasks.find(
      (task) => task.id === "T002",
    ).claim;
    assert.notEqual(backlogClaim.expiresAt, lastExpires);
    assert.equal(
      JSON.parse(readFileSync(backlogPath, "utf8")).history.some(
        (entry) => entry.note === "renouvellement de réservation",
      ),
      false,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("stale runtime lease self-heal recovers missing lease and resume clears expired lease", () => {
  const { dir, backlogPath, lockPath, runtimeLeasePath } = initTrackedBacklogRepo();
  try {
    const claimed = mutateBacklogAtomic({
      filePath: backlogPath,
      lockPath,
      runtimeLeasePath,
      workerId: "worker-a",
      mutator(data) {
        return claimTask(data, {
          taskId: "T002",
          workerId: "worker-a",
          leaseSeconds: 3600,
        });
      },
    });
    assert.equal(claimed.ok, true);
    clearRuntimeLease(runtimeLeasePath);
    assert.equal(readRuntimeLease(runtimeLeasePath).missing, true);

    const data = JSON.parse(readFileSync(backlogPath, "utf8"));
    const healed = ensureRuntimeLeaseForActiveClaims(data, {
      runtimeLeasePath,
      now: new Date(),
    });
    assert.equal(healed.ok, true);
    assert.equal(healed.healed, true);
    const restored = readRuntimeLease(runtimeLeasePath);
    assert.equal(restored.ok, true);
    assert.equal(restored.lease?.taskId, "T002");
    assert.equal(restored.lease?.workerId, "worker-a");

    // Force stale expiry in runtime only — backlog durable claim stays future-dated.
    writeRuntimeLease(
      buildRuntimeLease({
        taskId: "T002",
        workerId: "worker-a",
        claimedAt: claimed.task.claim.claimedAt,
        expiresAt: "2000-01-01T00:00:00.000Z",
        renewedAt: "2000-01-01T00:00:00.000Z",
        heartbeatAt: "2000-01-01T00:00:00.000Z",
        leaseSeconds: 3600,
      }),
      runtimeLeasePath,
    );

    const inspection = resumeInspection(data, {
      gitDirty: false,
      runtimeLease: readRuntimeLease(runtimeLeasePath).lease,
    });
    assert.equal(inspection.active[0].expired, true);

    const resumed = mutateBacklogAtomic({
      filePath: backlogPath,
      lockPath,
      runtimeLeasePath,
      workerId: "worker-a",
      mutator(current, { runtimeLease } = {}) {
        const view = resumeInspection(current, {
          gitDirty: false,
          runtimeLease,
        });
        let next = current;
        for (const finding of view.active) {
          if (!finding.expired) continue;
          next = {
            ...next,
            tasks: next.tasks.map((task) =>
              task.id === finding.id
                ? {
                    ...task,
                    status: "PRÊTE",
                    claim: null,
                    lastTransitionReason: "resume: bail expiré sans modification Git détectée",
                  }
                : task,
            ),
          };
        }
        return { ok: true, data: next, inspection: view, clearRuntimeLease: true };
      },
    });
    assert.equal(resumed.ok, true);
    assert.equal(resumed.wrote, true);
    const after = JSON.parse(readFileSync(backlogPath, "utf8"));
    assert.equal(after.tasks.find((task) => task.id === "T002").status, "PRÊTE");
    assert.equal(after.tasks.find((task) => task.id === "T002").claim, null);
    assert.equal(readRuntimeLease(runtimeLeasePath).missing, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("renew while another worker holds the lease is still refused", () => {
  const backlog = createBacklogDocument([
    createTaskDocument({ id: "T001", status: "TERMINÉE", evidence: ["ok"] }),
    createTaskDocument({ id: "T002", status: "PRÊTE", dependencies: ["T001"] }),
  ]);
  const first = claimTask(backlog, { taskId: "T002", workerId: "worker-a" });
  const second = claimTask(first.data, {
    taskId: "T002",
    workerId: "worker-b",
    runtimeLease: first.runtimeLease,
  });
  assert.equal(second.ok, false);
  assert.equal(second.error, "LOCK_HELD");
});
