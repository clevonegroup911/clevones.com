#!/usr/bin/env node
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { isCliEntry } from "./lib/x100-fs.mjs";
import { redactSecrets } from "./lib/x100-redact.mjs";

const ARTIFACT_DIR = "ci-artifact";
const RESULTS_PATH = join(ARTIFACT_DIR, "results.json");

const REQUIRED_BY_MODE = Object.freeze({
  METADATA: Object.freeze([
    "classify",
    "backlog",
    "task_report",
    "diff_check",
    "secrets",
  ]),
  FAST: Object.freeze([
    "classify",
    "backlog",
    "x100_tests",
    "task_report",
    "tests",
    "lint",
    "typecheck",
    "diff_check",
    "secrets",
  ]),
  FULL: Object.freeze([
    "classify",
    "doctor",
    "prisma_validate",
    "backlog",
    "x100_tests",
    "task_report",
    "tests",
    "lint",
    "typecheck",
    "db_integration",
    "build",
    "diff_check",
    "secrets",
    "audit",
    "playwright",
  ]),
});

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

function normalizeMode(value) {
  const mode = String(value || "").toUpperCase();
  return Object.hasOwn(REQUIRED_BY_MODE, mode) ? mode : "FULL";
}

export function buildSummary(results, requestedMode = process.env.X200_CI_MODE) {
  const steps = results.steps || [];
  const mode = normalizeMode(requestedMode || results.mode);
  const required = REQUIRED_BY_MODE[mode];
  const failed = steps
    .filter((step) => required.includes(step.name) && step.exitCode !== 0)
    .map((step) => step.name);

  for (const name of required) {
    if (statusOf(steps, name) !== "pass" && !failed.includes(name)) {
      failed.push(name);
    }
  }

  const checks = {};
  for (const name of new Set(Object.values(REQUIRED_BY_MODE).flat())) {
    checks[name] = statusOf(steps, name);
  }

  return {
    generatedAt: new Date().toISOString(),
    mode,
    required,
    ok: failed.length === 0,
    failed,
    checks,
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
      "# X200 CI summary",
      `mode=${summary.mode}`,
      `ok=${summary.ok}`,
      `required=${summary.required.join(",")}`,
      `failed=${summary.failed.join(",") || "none"}`,
      ...Object.entries(summary.checks).map(([name, status]) => `${name}=${status}`),
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
