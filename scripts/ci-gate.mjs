#!/usr/bin/env node
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { isCliEntry } from "./lib/x100-fs.mjs";
import { redactSecrets } from "./lib/x100-redact.mjs";

const ARTIFACT_DIR = "ci-artifact";
const RESULTS_PATH = join(ARTIFACT_DIR, "results.json");

function loadResults() {
  try {
    return JSON.parse(readFileSync(RESULTS_PATH, "utf8"));
  } catch {
    return { steps: [] };
  }
}

function statusOf(steps, name) {
  const step = steps.find((item) => item.name === name);
  if (!step) {
    return "skipped";
  }
  return step.exitCode === 0 ? "pass" : "fail";
}

const REQUIRED_STEPS = Object.freeze([
  "prisma_validate",
  "backlog",
  "x100_tests",
  "task_report",
  "tests",
  "lint",
  "typecheck",
  "build",
  "diff_check",
  "audit",
]);

export function buildSummary(results) {
  const steps = results.steps || [];
  const failed = steps.filter((step) => step.exitCode !== 0).map((step) => step.name);
  for (const name of REQUIRED_STEPS) {
    if (statusOf(steps, name) !== "pass" && !failed.includes(name)) {
      failed.push(name);
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    ok: failed.length === 0,
    failed,
    checks: {
      prismaValidate: statusOf(steps, "prisma_validate"),
      backlog: statusOf(steps, "backlog"),
      x100Tests: statusOf(steps, "x100_tests"),
      taskReport: statusOf(steps, "task_report"),
      tests: statusOf(steps, "tests"),
      lint: statusOf(steps, "lint"),
      typecheck: statusOf(steps, "typecheck"),
      build: statusOf(steps, "build"),
      diffCheck: statusOf(steps, "diff_check"),
      audit: statusOf(steps, "audit"),
    },
    steps,
  };
}

function copyIfExists(from, to) {
  try {
    copyFileSync(from, to);
  } catch {
    writeFileSync(to, "missing\n");
  }
}

async function main() {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const results = loadResults();
  const summary = buildSummary(results);
  const summaryText = redactSecrets(
    [
      "# X100 CI summary",
      `ok=${summary.ok}`,
      `failed=${summary.failed.join(",") || "none"}`,
      `prismaValidate=${summary.checks.prismaValidate}`,
      `backlog=${summary.checks.backlog}`,
      `x100Tests=${summary.checks.x100Tests}`,
      `taskReport=${summary.checks.taskReport}`,
      `tests=${summary.checks.tests}`,
      `lint=${summary.checks.lint}`,
      `typecheck=${summary.checks.typecheck}`,
      `build=${summary.checks.build}`,
      `diffCheck=${summary.checks.diffCheck}`,
      `audit=${summary.checks.audit}`,
      "",
      "## Commands",
      ...summary.steps.map((step) => `- ${step.name}: ${step.command} (exit ${step.exitCode})`),
      "",
    ].join("\n"),
  );

  writeFileSync(join(ARTIFACT_DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(join(ARTIFACT_DIR, "summary.md"), `${summaryText}\n`);
  copyIfExists("TASK_REPORT.md", join(ARTIFACT_DIR, "TASK_REPORT.md"));
  copyIfExists("backlog.json", join(ARTIFACT_DIR, "backlog.json"));

  process.stdout.write(summaryText);
  return summary.ok ? 0 : 1;
}

if (isCliEntry(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exit(1);
    },
  );
}
