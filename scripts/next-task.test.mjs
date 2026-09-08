import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  ALLOWED_PRIORITIES,
  ALLOWED_STATUSES,
} from "./lib/x100-backlog.mjs";
import { runNextTask } from "./next-task.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function makeTask(overrides = {}) {
  return {
    id: "T001",
    title: "Task",
    objective: "Do the work",
    priority: "P1",
    owner: "cursor",
    dependencies: [],
    scope: ["scripts/"],
    acceptanceCriteria: ["done"],
    tests: ["npm run x100:test"],
    status: "À_FAIRE",
    evidence: [],
    estimatedCost: 1,
    risk: "low",
    attempts: 0,
    requiresHuman: false,
    updatedAt: "2026-09-07",
    ...overrides,
  };
}

function makeBacklog(tasks, extra = {}) {
  return {
    schemaVersion: "1.0.0",
    project: "clevones.com",
    repository: "clevonegroup911/clevones.com",
    updatedAt: "2026-09-07",
    allowedStatuses: [...ALLOWED_STATUSES],
    allowedPriorities: [...ALLOWED_PRIORITIES],
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
    history: [],
    ...extra,
  };
}

function writeBacklog(data) {
  const dir = mkdtempSync(join(tmpdir(), "x100-next-"));
  const file = join(dir, "backlog.json");
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

function runCli(args, cwd = ROOT) {
  return spawnSync(process.execPath, ["scripts/next-task.mjs", ...args], {
    cwd,
    encoding: "utf8",
  });
}

test("repository selector matches the current valid backlog state", () => {
  const source = join(ROOT, "backlog.json");
  const backlog = JSON.parse(readFileSync(source, "utf8"));
  const t009 = backlog.tasks.find((task) => task.id === "T009");
  const t012 = backlog.tasks.find((task) => task.id === "T012");
  const t013 = backlog.tasks.find((task) => task.id === "T013");
  assert.equal(t009?.status, "TERMINÉE");
  assert.equal(t012?.status, "EN_CONTRÔLE");
  assert.equal(t013?.status, "TERMINÉE");
  assert.equal(backlog.nextTaskId, null);
  const run = runCli(["--json", source]);
  assert.equal(run.status, 0, run.stderr);
  const payload = JSON.parse(run.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.nextTaskId, null);
  assert.equal(payload.reason, "NO_READY_TASK");
});

test("does not select BLOQUÉE, ÉCHOUÉE or EN_CONTRÔLE tasks", () => {
  const done = makeTask({
    id: "T001",
    status: "TERMINÉE",
    evidence: ["ok"],
  });
  const file = writeBacklog(
    makeBacklog([
      done,
      makeTask({ id: "T002", status: "BLOQUÉE", dependencies: ["T001"] }),
      makeTask({ id: "T003", status: "ÉCHOUÉE", dependencies: ["T001"] }),
      makeTask({ id: "T004", status: "EN_CONTRÔLE", dependencies: ["T001"] }),
      makeTask({ id: "T005", status: "EN_COURS", dependencies: ["T001"] }),
    ]),
  );
  const result = runNextTask({ filePath: file });
  assert.equal(result.ok, true);
  assert.equal(result.reason, "NO_READY_TASK");
  assert.equal(result.nextTaskId, null);
});

test("does not modify the backlog by default", () => {
  const source = join(ROOT, "backlog.json");
  const dir = mkdtempSync(join(tmpdir(), "x100-next-copy-"));
  const file = join(dir, "backlog.json");
  copyFileSync(source, file);
  const before = readFileSync(file, "utf8");
  const run = runCli(["--json", file]);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(readFileSync(file, "utf8"), before);
});

test("--write records only nextTaskId and updatedAt", () => {
  const done = makeTask({
    id: "T001",
    status: "TERMINÉE",
    evidence: ["ok"],
  });
  const ready = makeTask({
    id: "T002",
    status: "PRÊTE",
    dependencies: ["T001"],
    title: "Ready task",
  });
  const original = makeBacklog([done, ready], { updatedAt: "2020-01-01" });
  const file = writeBacklog(original);
  const run = runCli(["--write", "--json", file]);
  assert.equal(run.status, 0, run.stderr);
  const after = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(after.nextTaskId, "T002");
  assert.notEqual(after.updatedAt, "2020-01-01");
  assert.deepEqual(
    { ...after, nextTaskId: original.nextTaskId, updatedAt: original.updatedAt },
    original,
  );
});

test("returns a non-zero exit code for an invalid backlog", () => {
  const file = writeBacklog({ not: "a backlog" });
  const run = runCli(["--json", file]);
  assert.notEqual(run.status, 0);
  const payload = JSON.parse(run.stdout);
  assert.equal(payload.ok, false);
  assert.ok(payload.errors.length > 0);
});
