import assert from "node:assert/strict";
import { test } from "node:test";

import { evaluateAuditReport } from "./ci-audit.mjs";
import { buildSummary } from "./ci-gate.mjs";
import { buildCommentBody, findX100Comment } from "./ci-pr-comment.mjs";
import { redactSecrets } from "./lib/x100-redact.mjs";

test("redacts connection strings and tokens without leaking them back", () => {
  const redacted = redactSecrets(
    "url=postgresql://ci:ci@127.0.0.1:5432/db AUTH_SECRET=ci-only-not-a-real-secret-value-00000000 token=github_pat_abcdefghijklmnopqrstu Bearer abc.def",
  );
  assert.doesNotMatch(redacted, /postgresql:\/\//);
  assert.doesNotMatch(redacted, /github_pat_/);
  assert.doesNotMatch(redacted, /Bearer abc/);
  assert.match(redacted, /\[redacted\]/);
});

test("audit allowlist accepts the documented Prisma advisory only", () => {
  const allowed = evaluateAuditReport({
    vulnerabilities: {
      "deepmerge-ts": {
        severity: "high",
        via: [{ url: "https://github.com/advisories/GHSA-ggr8-5vv4-36mx" }],
      },
      "@prisma/config": {
        severity: "high",
        via: ["deepmerge-ts"],
      },
      prisma: {
        severity: "high",
        via: ["@prisma/config"],
      },
    },
  });
  assert.equal(allowed.ok, true);

  const blocked = evaluateAuditReport({
    vulnerabilities: {
      leftover: {
        severity: "critical",
        via: [{ url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc" }],
      },
    },
  });
  assert.equal(blocked.ok, false);
});

test("CI comment starts with [X100-CI] and updates the previous bot comment", () => {
  const body = buildCommentBody({
    taskId: "T007",
    sha: "b64d503deadbeef",
    summary: {
      ok: true,
      checks: {
        tests: "pass",
        x100Tests: "pass",
        lint: "pass",
        build: "pass",
        backlog: "pass",
        taskReport: "pass",
      },
    },
    backlogOk: true,
    reportOk: true,
    nextTaskId: null,
    workflowUrl: "https://github.com/clevonegroup911/clevones.com/actions/runs/1",
  });
  assert.ok(body.startsWith("[X100-CI]"));
  assert.match(body, /T007/);
  assert.match(body, /NO_READY_TASK/);
  assert.doesNotMatch(body, /AUTH_SECRET|MFA_ENCRYPTION_KEY|postgresql:\/\//);

  const existing = findX100Comment([
    { id: 1, body: "hello", user: { type: "User" } },
    { id: 2, body: "[X100-CI]\nold", user: { type: "Bot" } },
  ]);
  assert.equal(existing.id, 2);
});

test("quality summary fails when a required check is missing", () => {
  const summary = buildSummary({ steps: [] });
  assert.equal(summary.ok, false);
  assert.ok(summary.failed.includes("tests"));
});
