import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  SCHEMA_VERSION,
  SCHEMA_VERSION_V1,
  applySameCauseFailure,
  canMarkTerminee,
  createBacklogDocument,
  createTaskDocument,
  migrateBacklogData,
  selectNextTask,
  validateBacklog,
} from "./lib/x100-backlog.mjs";
import { claimTask, completeTask, resumeInspection } from "./lib/x200-claim.mjs";
import { runMigrateBacklog } from "./migrate-backlog.mjs";
import { buildTaskReport } from "./generate-report.mjs";
import { commandsForTask } from "./quality-gate.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function v1Backlog(tasks) {
  return {
    schemaVersion: SCHEMA_VERSION_V1,
    project: "clevones.com",
    repository: "clevonegroup911/clevones.com",
    updatedAt: "2026-09-07",
    allowedStatuses: [
      "À_FAIRE",
      "PRÊTE",
      "EN_COURS",
      "EN_CONTRÔLE",
      "BLOQUÉE",
      "ÉCHOUÉE",
      "TERMINÉE",
    ],
    allowedPriorities: ["P0", "P1", "P2", "P3"],
    wipLimits: {
      maxActiveP0: 1,
      maxActiveTasks: 3,
      activeStatuses: ["EN_COURS"],
      neverParallelize: ["migration", "authentication"],
    },
    selectionPolicy: {
      readyStatus: "PRÊTE",
      excludeStatuses: ["BLOQUÉE", "ÉCHOUÉE", "EN_CONTRÔLE"],
      order: ["priority", "unblockCount", "riskAsc", "costAsc", "idAsc"],
    },
    nextTaskId: null,
    tasks,
    history: [{ at: "2026-09-07", taskId: "T001", status: "TERMINÉE" }],
  };
}

test("migration 1.0.0 → 2.0.0 preserves tasks, is idempotent, and does not duplicate ids", () => {
  const source = v1Backlog([
    createTaskDocument({ id: "T001", status: "TERMINÉE", evidence: ["commit abc"] }),
    createTaskDocument({ id: "T016", status: "TERMINÉE", evidence: ["commit def"] }),
  ]);
  const first = migrateBacklogData(source);
  assert.equal(first.ok, true);
  assert.equal(first.data.schemaVersion, SCHEMA_VERSION);
  assert.equal(first.data.tasks.length, 2);
  assert.deepEqual(
    first.data.tasks.map((task) => task.id),
    ["T001", "T016"],
  );
  assert.equal(first.data.history.length, 1);
  assert.ok(first.data.allowedStatuses.includes("ANNULÉE"));
  const validated = validateBacklog(first.data);
  assert.equal(validated.ok, true, validated.errors.join(" | "));

  const second = migrateBacklogData(first.data);
  assert.equal(second.ok, true);
  assert.equal(second.changed, false);
  assert.equal(second.data.tasks.length, 2);

  const dir = mkdtempSync(join(tmpdir(), "x200-migrate-"));
  const file = join(dir, "backlog.json");
  writeFileSync(file, `${JSON.stringify(source, null, 2)}\n`);
  const run = runMigrateBacklog({ filePath: file });
  assert.equal(run.ok, true, run.error);
  assert.equal(run.changed, true);
  const rerun = runMigrateBacklog({ filePath: file });
  assert.equal(rerun.ok, true);
  assert.equal(rerun.changed, false);
  const after = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(after.tasks.length, 2);
});

test("completed tasks are excluded and ANNULÉE does not satisfy dependencies", () => {
  const cancelled = createBacklogDocument([
    createTaskDocument({ id: "T001", status: "ANNULÉE", evidence: ["cancelled"] }),
    createTaskDocument({ id: "T002", status: "PRÊTE", dependencies: ["T001"] }),
  ]);
  const result = validateBacklog(cancelled);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("n'est pas TERMINÉE")));

  const ready = createBacklogDocument([
    createTaskDocument({ id: "T001", status: "TERMINÉE", evidence: ["ok"] }),
    createTaskDocument({ id: "T002", status: "TERMINÉE", evidence: ["ok"] }),
    createTaskDocument({ id: "T003", status: "PRÊTE", dependencies: ["T001"] }),
  ]);
  assert.equal(selectNextTask(ready).id, "T003");
});

test("second claim is refused and an expired token cannot complete", () => {
  const backlog = createBacklogDocument([
    createTaskDocument({ id: "T001", status: "TERMINÉE", evidence: ["ok"] }),
    createTaskDocument({ id: "T002", status: "PRÊTE", dependencies: ["T001"] }),
  ]);
  const first = claimTask(backlog, { taskId: "T002", workerId: "worker-a" });
  assert.equal(first.ok, true);
  const second = claimTask(first.data, { taskId: "T002", workerId: "worker-b" });
  assert.equal(second.ok, false);
  assert.equal(second.error, "LOCK_HELD");

  const expired = {
    ...first.data,
    tasks: first.data.tasks.map((task) =>
      task.id === "T002"
        ? {
            ...task,
            claim: { ...task.claim, expiresAt: "2000-01-01T00:00:00.000Z" },
          }
        : task,
    ),
  };
  const done = completeTask(expired, {
    taskId: "T002",
    workerId: "worker-a",
    token: first.task.claim.token,
    gate: { ok: true, taskId: "T002" },
  });
  assert.equal(done.ok, false);
  assert.match(done.error, /expiré/);
});

test("resume after interruption reports double-effect risk and never promises exactly-once", () => {
  const claimed = claimTask(
    createBacklogDocument([
      createTaskDocument({ id: "T001", status: "TERMINÉE", evidence: ["ok"] }),
      createTaskDocument({ id: "T002", status: "PRÊTE", dependencies: ["T001"] }),
    ]),
    { taskId: "T002", workerId: "worker-a" },
  );
  const expired = {
    ...claimed.data,
    tasks: claimed.data.tasks.map((task) =>
      task.id === "T002"
        ? { ...task, claim: { ...task.claim, expiresAt: "2000-01-01T00:00:00.000Z" } }
        : task,
    ),
  };
  const inspection = resumeInspection(expired, { gitDirty: true });
  assert.equal(inspection.exactlyOnce, false);
  assert.equal(inspection.active[0].doubleEffectRisk, true);
  assert.match(inspection.active[0].action, /BLOQUÉE|réconcilier/);
});

test("a corrupted registry is detected and left untouched", () => {
  const dir = mkdtempSync(join(tmpdir(), "x200-corrupt-"));
  const file = join(dir, "backlog.json");
  const raw = "{not-json";
  writeFileSync(file, raw);
  const migrated = runMigrateBacklog({ filePath: file });
  assert.equal(migrated.ok, false);
  assert.equal(migrated.preserved, true);
  assert.equal(readFileSync(file, "utf8"), raw);
});

test("a failed quality-gate blocks TERMINÉE and remains visible in the report", () => {
  const task = createTaskDocument({
    id: "T002",
    status: "EN_COURS",
    evidence: ["wip"],
    claim: {
      workerId: "worker-a",
      token: "token-a",
      claimedAt: "2026-09-09T00:00:00.000Z",
      expiresAt: "2099-01-01T00:00:00.000Z",
    },
  });
  const gate = {
    ok: false,
    taskId: "T002",
    steps: [{ command: "false", exitCode: 1, result: "fail" }],
  };
  assert.equal(canMarkTerminee(task, gate).ok, false);
  const report = buildTaskReport({
    task,
    backlog: createBacklogDocument([task]),
    gate,
  });
  assert.match(report, /false \(exit 1\)/);
  assert.match(report, /quality-gate en échec|TERMINÉE interdite/);
});

test("three identical failures block the task", () => {
  let task = createTaskDocument({ id: "T002", status: "EN_COURS" });
  task = applySameCauseFailure(task, "unit-timeout");
  task = applySameCauseFailure(task, "unit-timeout");
  task = applySameCauseFailure(task, "unit-timeout");
  assert.equal(task.status, "BLOQUÉE");
  assert.equal(task.consecutiveSameCauseFailures, 3);
});

test("quality-gate uses the task tests list", () => {
  const commands = commandsForTask(createTaskDocument({ tests: ["npm run x200:doctor"] }));
  assert.deepEqual(commands, ["npm run x200:doctor"]);
});

test("repository v1 backlog is rejected until migrated", () => {
  const result = validateBacklog(v1Backlog([createTaskDocument({ status: "À_FAIRE" })]));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("x200:migrate")));
});

test("repository backlog keeps historical ids T001–T016 after X200 fields exist", () => {
  const backlog = JSON.parse(readFileSync(join(ROOT, "backlog.json"), "utf8"));
  const ids = backlog.tasks.map((task) => task.id);
  for (let n = 1; n <= 16; n += 1) {
    assert.ok(ids.includes(`T${String(n).padStart(3, "0")}`), `missing T${n}`);
  }
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(backlog.schemaVersion, SCHEMA_VERSION);
});
