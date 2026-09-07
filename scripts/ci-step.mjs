#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { isCliEntry } from "./lib/x100-fs.mjs";
import { redactSecrets } from "./lib/x100-redact.mjs";

const ARTIFACT_DIR = "ci-artifact";
const RESULTS_PATH = join(ARTIFACT_DIR, "results.json");
const LOG_DIR = join(ARTIFACT_DIR, "logs");

function loadResults() {
  try {
    return JSON.parse(readFileSync(RESULTS_PATH, "utf8"));
  } catch {
    return { steps: [] };
  }
}

function saveResults(results) {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
}

export function recordStep(name, command, extra = {}) {
  mkdirSync(LOG_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const run = spawnSync(command[0], command.slice(1), {
    encoding: "utf8",
    env: process.env,
    shell: false,
  });
  const endedAt = new Date().toISOString();
  const combined = `${run.stdout || ""}${run.stderr || ""}`;
  const redacted = redactSecrets(combined);
  writeFileSync(join(LOG_DIR, `${name}.log`), redacted);

  const results = loadResults();
  const step = {
    name,
    command: command.join(" "),
    exitCode: run.status === null ? 1 : run.status,
    startedAt,
    endedAt,
    ...extra,
  };
  results.steps = results.steps.filter((item) => item.name !== name);
  results.steps.push(step);
  saveResults(results);
  return step;
}

async function main(argv) {
  const separator = argv.indexOf("--");
  if (separator <= 0 || separator === argv.length - 1) {
    process.stderr.write("usage: node scripts/ci-step.mjs <name> -- <command>...\n");
    return 2;
  }
  const name = argv[0];
  const command = argv.slice(separator + 1);
  const step = recordStep(name, command);
  process.stdout.write(`${step.name} exit=${step.exitCode}\n`);
  return step.exitCode;
}

if (isCliEntry(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exit(1);
    },
  );
}
