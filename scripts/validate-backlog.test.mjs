import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  ALLOWED_PRIORITIES,
  ALLOWED_STATUSES,
  selectNextTask,
  validateBacklog,
} from "./lib/x100-backlog.mjs";
import { runValidateBacklog } from "./validate-backlog.mjs";

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

function reject(backlog, snippet) {
  const result = validateBacklog(backlog);
  assert.equal(result.ok, false, `expected invalid backlog, errors=${result.errors.join(" | ")}`);
  assert.ok(
    result.errors.some((error) => error.includes(snippet)),
    `expected error containing ${snippet}, got: ${result.errors.join(" | ")}`,
  );
}

test("the repository backlog.json is valid", () => {
  const result = runValidateBacklog(join(ROOT, "backlog.json"));
  assert.equal(result.ok, true, result.errors?.join(" | "));
});

test("rejects invalid JSON via CLI", () => {
  const dir = mkdtempSync(join(tmpdir(), "x100-backlog-"));
  const file = join(dir, "backlog.json");
  writeFileSync(file, "{not json");
  const run = spawnSync(process.execPath, ["scripts/validate-backlog.mjs", file], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /JSON invalide/);
});

test("rejects IDs outside T001–T100 and duplicates", () => {
  reject(makeBacklog([makeTask({ id: "T000" })]), "hors T001");
  reject(makeBacklog([makeTask({ id: "T101" })]), "hors T001");
  reject(
    makeBacklog([makeTask({ id: "T001", status: "TERMINÉE", evidence: ["ok"] }), makeTask({ id: "T001" })]),
    "dupliqué",
  );
  const hundred = validateBacklog(
    makeBacklog([makeTask({ id: "T100", status: "TERMINÉE", evidence: ["ok"] })]),
  );
  assert.equal(hundred.ok, true, hundred.errors.join(" | "));
});

test("rejects unknown status, priority, and missing fields", () => {
  reject(makeBacklog([makeTask({ status: "DONE" })]), "état inconnu");
  reject(makeBacklog([makeTask({ priority: "P9" })]), "priorité inconnue");
  const task = makeTask();
  delete task.objective;
  reject(makeBacklog([task]), "objective");
});

test("rejects missing, circular, and incomplete ready dependencies", () => {
  reject(makeBacklog([makeTask({ id: "T002", dependencies: ["T099"] })]), "inexistante");
  reject(
    makeBacklog([
      makeTask({ id: "T001", dependencies: ["T002"] }),
      makeTask({ id: "T002", dependencies: ["T001"] }),
    ]),
    "circulaire",
  );
  reject(
    makeBacklog([
      makeTask({ id: "T001", status: "À_FAIRE" }),
      makeTask({ id: "T002", status: "PRÊTE", dependencies: ["T001"] }),
    ]),
    "n'est pas TERMINÉE",
  );
});

test("rejects more than one active P0 and more than three active tasks", () => {
  reject(
    makeBacklog([
      makeTask({ id: "T001", priority: "P0", status: "EN_COURS", scope: ["docs/"] }),
      makeTask({ id: "T002", priority: "P0", status: "EN_COURS", scope: ["README.md"] }),
    ]),
    "plus d'une P0",
  );
  reject(
    makeBacklog([
      makeTask({ id: "T001", status: "EN_COURS", scope: ["docs/a"] }),
      makeTask({ id: "T002", status: "EN_COURS", scope: ["docs/b"] }),
      makeTask({ id: "T003", status: "EN_COURS", scope: ["docs/c"] }),
      makeTask({ id: "T004", status: "EN_COURS", scope: ["docs/d"] }),
    ]),
    "plus de trois",
  );
});

test("rejects a completed task without evidence", () => {
  reject(makeBacklog([makeTask({ status: "TERMINÉE", evidence: [] })]), "preuve absente");
});

test("rejects parallel authentication or migration work", () => {
  reject(
    makeBacklog([
      makeTask({ id: "T001", status: "EN_COURS", scope: ["lib/auth/session-token.ts"] }),
      makeTask({ id: "T002", status: "EN_COURS", scope: ["prisma/migrations/x.sql"] }),
    ]),
    "authentification",
  );
});

test("selects P0 first, then unblock count, risk, cost, then lowest id", () => {
  const done = makeTask({
    id: "T001",
    status: "TERMINÉE",
    evidence: ["commit abc"],
  });
  const backlog = makeBacklog([
    done,
    makeTask({
      id: "T010",
      status: "PRÊTE",
      priority: "P1",
      risk: "low",
      estimatedCost: 1,
      dependencies: ["T001"],
    }),
    makeTask({
      id: "T004",
      status: "PRÊTE",
      priority: "P0",
      risk: "high",
      estimatedCost: 9,
      dependencies: ["T001"],
    }),
    makeTask({
      id: "T005",
      status: "PRÊTE",
      priority: "P0",
      risk: "low",
      estimatedCost: 1,
      dependencies: ["T001"],
    }),
    makeTask({
      id: "T020",
      status: "À_FAIRE",
      dependencies: ["T004"],
    }),
    makeTask({
      id: "T021",
      status: "À_FAIRE",
      dependencies: ["T004"],
    }),
  ]);
  assert.equal(selectNextTask(backlog).id, "T004");

  const samePriority = makeBacklog([
    done,
    makeTask({
      id: "T008",
      status: "PRÊTE",
      priority: "P1",
      risk: "medium",
      estimatedCost: 5,
      dependencies: ["T001"],
    }),
    makeTask({
      id: "T009",
      status: "PRÊTE",
      priority: "P1",
      risk: "low",
      estimatedCost: 5,
      dependencies: ["T001"],
    }),
  ]);
  assert.equal(selectNextTask(samePriority).id, "T009");

  const sameRisk = makeBacklog([
    done,
    makeTask({
      id: "T011",
      status: "PRÊTE",
      priority: "P2",
      risk: "low",
      estimatedCost: 3,
      dependencies: ["T001"],
    }),
    makeTask({
      id: "T012",
      status: "PRÊTE",
      priority: "P2",
      risk: "low",
      estimatedCost: 1,
      dependencies: ["T001"],
    }),
  ]);
  assert.equal(selectNextTask(sameRisk).id, "T012");

  const sameCost = makeBacklog([
    done,
    makeTask({
      id: "T014",
      status: "PRÊTE",
      priority: "P3",
      risk: "low",
      estimatedCost: 1,
      dependencies: ["T001"],
    }),
    makeTask({
      id: "T013",
      status: "PRÊTE",
      priority: "P3",
      risk: "low",
      estimatedCost: 1,
      dependencies: ["T001"],
    }),
  ]);
  assert.equal(selectNextTask(sameCost).id, "T013");
});
