import assert from "node:assert/strict";
import { test } from "node:test";

import { parseArgs } from "./claim-task.mjs";
import { classifyChangedFiles } from "./ci-classify.mjs";
import { createBacklogDocument, createTaskDocument } from "./lib/x100-backlog.mjs";
import { claimTask, releaseTask, scopesConflict } from "./lib/x200-claim.mjs";

test("CI classifier sends ordinary code to FAST", () => {
  const result = classifyChangedFiles({ files: ["components/Card.tsx"], base: "HEAD~1" });
  assert.equal(result.mode, "FAST");
});

test("CI classifier sends auth and workflow changes to FULL", () => {
  assert.equal(classifyChangedFiles({ files: ["lib/auth/session.ts"] }).mode, "FULL");
  assert.equal(classifyChangedFiles({ files: [".github/workflows/ci.yml"] }).mode, "FULL");
});

test("CI classifier allows report-only metadata lane", () => {
  const result = classifyChangedFiles({ files: ["TASK_REPORT.md", "reports/tasks/T099.md"] });
  assert.equal(result.mode, "METADATA");
});

test("premerge always forces FULL", () => {
  const result = classifyChangedFiles({ files: ["TASK_REPORT.md"], premerge: true });
  assert.equal(result.mode, "FULL");
});

test("explicit task id cannot bypass requiresHuman", () => {
  const backlog = createBacklogDocument([
    createTaskDocument({ id: "T001", status: "PRÊTE", requiresHuman: true }),
  ]);
  const result = claimTask(backlog, { taskId: "T001", workerId: "worker-a" });
  assert.equal(result.ok, false);
  assert.equal(result.error, "HUMAN_GATE_REQUIRED");
});

test("human task can only be claimed after explicit authorization flag", () => {
  const backlog = createBacklogDocument([
    createTaskDocument({ id: "T001", status: "PRÊTE", requiresHuman: true }),
  ]);
  const result = claimTask(backlog, {
    taskId: "T001",
    workerId: "worker-a",
    includeHuman: true,
  });
  assert.equal(result.ok, true);
});

test("scope parent and child conflict", () => {
  assert.equal(scopesConflict(["app"], ["app/admin"]), true);
  assert.equal(scopesConflict(["docs/a"], ["components/b"]), false);
});

test("claim refuses overlapping scope already in control", () => {
  const backlog = createBacklogDocument([
    createTaskDocument({
      id: "T001",
      status: "EN_CONTRÔLE",
      evidence: ["quality pending"],
      scope: ["components/admin"],
    }),
    createTaskDocument({
      id: "T002",
      status: "PRÊTE",
      scope: ["components/admin/users"],
    }),
  ]);
  const result = claimTask(backlog, { taskId: "T002", workerId: "worker-b" });
  assert.equal(result.ok, false);
  assert.equal(result.error, "SCOPE_CONFLICT");
});

test("automatic claim can continue while unrelated work is in control", () => {
  const backlog = createBacklogDocument([
    createTaskDocument({
      id: "T001",
      status: "EN_CONTRÔLE",
      evidence: ["quality pending"],
      scope: ["docs/a"],
    }),
    createTaskDocument({ id: "T002", status: "PRÊTE", scope: ["components/b"] }),
  ]);
  const result = claimTask(backlog, { workerId: "worker-b" });
  assert.equal(result.ok, true);
  assert.equal(result.task.id, "T002");
});

test("release cannot reopen a completed task", () => {
  const backlog = createBacklogDocument([
    createTaskDocument({ id: "T001", status: "TERMINÉE", evidence: ["commit abc"] }),
  ]);
  const result = releaseTask(backlog, { taskId: "T001", workerId: "worker-a" });
  assert.equal(result.ok, false);
  assert.match(result.error, /release interdit/);
});

test("claim parser does not treat option values as task ids", () => {
  const parsed = parseArgs(["--worker", "worker-a", "--file", "tmp/backlog.json", "T042", "--json"]);
  assert.equal(parsed.taskId, "T042");
  assert.equal(parsed.workerId, "worker-a");
  assert.equal(parsed.filePath, "tmp/backlog.json");
  assert.equal(parsed.json, true);
});
