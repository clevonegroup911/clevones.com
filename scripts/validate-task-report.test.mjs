import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  ALLOWED_PRIORITIES,
  ALLOWED_STATUSES,
} from "./lib/x100-backlog.mjs";
import { REPORT_MARKER, validateTaskReport } from "./lib/x100-report.mjs";
import { runValidateTaskReport } from "./validate-task-report.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function makeTask(overrides = {}) {
  return {
    id: "T007",
    title: "Install X100",
    objective: "Bootstrap orchestration",
    priority: "P0",
    owner: "cursor",
    dependencies: [],
    scope: ["scripts/"],
    acceptanceCriteria: ["done"],
    tests: ["npm run x100:test"],
    status: "EN_COURS",
    evidence: [],
    estimatedCost: 1,
    risk: "low",
    attempts: 1,
    requiresHuman: false,
    updatedAt: "2026-09-07",
    ...overrides,
  };
}

function makeBacklog(taskOverrides = {}) {
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
    },
    nextTaskId: null,
    tasks: [makeTask(taskOverrides)],
    history: [],
  };
}

function makeReport({ id = "T007", status = "EN_COURS", evidence = "commit abcdef1" } = {}) {
  const sections = [
    ["ID", id],
    ["Statut", status],
    ["Objectif", "Installer X100"],
    ["Résultat", "en cours"],
    ["Fichiers créés", "- AGENTS.md"],
    ["Fichiers modifiés", "- package.json"],
    ["Commandes", "- npm test"],
    ["Tests réussis", "- x100"],
    ["Tests échoués", "- aucun"],
    ["Lint", "OK"],
    ["Type-check", "OK"],
    ["Build", "OK"],
    ["Sécurité", "aucun secret"],
    ["Commit", evidence],
    ["Pull Request", "draft"],
    ["Preuves", evidence],
    ["Risques", "aucun"],
    ["Blocage", "aucun"],
    ["Prochaine tâche prête", "NO_READY_TASK"],
  ];
  return [
    "# TASK_REPORT",
    "",
    REPORT_MARKER,
    "",
    ...sections.flatMap(([name, value]) => [`## ${name}`, "", value, ""]),
  ].join("\n");
}

test("repository TASK_REPORT.md matches the backlog", () => {
  const result = runValidateTaskReport({
    reportPath: join(ROOT, "TASK_REPORT.md"),
    backlogPath: join(ROOT, "backlog.json"),
  });
  assert.equal(result.ok, true, result.errors?.join(" | "));
});

test("rejects a report without the marker, id, status, or required section", () => {
  const backlog = makeBacklog();
  assert.equal(validateTaskReport(makeReport().replace(REPORT_MARKER, ""), backlog).ok, false);
  assert.equal(validateTaskReport(makeReport({ id: "T999" }), backlog).ok, false);
  assert.equal(validateTaskReport(makeReport({ status: "DONE" }), backlog).ok, false);
  const missing = makeReport().replace("## Risques", "## Autre");
  assert.equal(validateTaskReport(missing, backlog).ok, false);
});

test("rejects a status mismatch with the backlog", () => {
  const result = validateTaskReport(makeReport({ status: "TERMINÉE" }), makeBacklog());
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("incohérence")));
});

test("requires evidence when the report is TERMINÉE", () => {
  const backlog = makeBacklog({ status: "TERMINÉE", evidence: ["commit abcdef1"] });
  const empty = validateTaskReport(makeReport({ status: "TERMINÉE", evidence: "aucun" }), backlog);
  assert.equal(empty.ok, false);
  const ok = validateTaskReport(makeReport({ status: "TERMINÉE", evidence: "commit abcdef1" }), backlog);
  assert.equal(ok.ok, true, ok.errors.join(" | "));
});

test("CLI validates a matching pair of files", () => {
  const dir = mkdtempSync(join(tmpdir(), "x100-report-"));
  const backlogPath = join(dir, "backlog.json");
  const reportPath = join(dir, "TASK_REPORT.md");
  writeFileSync(backlogPath, `${JSON.stringify(makeBacklog(), null, 2)}\n`);
  writeFileSync(reportPath, makeReport());
  const result = runValidateTaskReport({ reportPath, backlogPath });
  assert.equal(result.ok, true, result.errors?.join(" | "));
});
