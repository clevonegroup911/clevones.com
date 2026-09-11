#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { validateBacklog } from "./lib/x100-backlog.mjs";
import { isCliEntry, readJsonFile } from "./lib/x100-fs.mjs";
import { redactSecrets } from "./lib/x100-redact.mjs";

const DEFAULT_OUT = ".x200/quality-results.json";

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--") && !arg.includes("=")));
  const get = (name) => {
    const index = argv.indexOf(name);
    if (index === -1 || index === argv.length - 1) {
      return null;
    }
    return argv[index + 1];
  };
  return {
    taskId: get("--task") || get("--id"),
    filePath: get("--file") || "backlog.json",
    outPath: get("--out") || DEFAULT_OUT,
    dryRun: flags.has("--dry-run"),
    json: flags.has("--json"),
  };
}

function gitHead() {
  const run = spawnSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" });
  return run.status === 0 ? run.stdout.trim() : "unknown";
}

export function commandsForTask(task) {
  if (task && Array.isArray(task.tests) && task.tests.length > 0) {
    return task.tests;
  }
  return ["npm run x200:validate", "npm run x200:test"];
}

function splitCommand(command) {
  const text = String(command).trim();
  if (!text) {
    return ["true"];
  }
  return ["bash", "-lc", text];
}

export function runQualityGate({
  taskId = null,
  filePath = "backlog.json",
  outPath = DEFAULT_OUT,
  dryRun = false,
} = {}) {
  const loaded = readJsonFile(filePath);
  if (!loaded.ok) {
    return { ok: false, error: loaded.error, steps: [] };
  }
  const validation = validateBacklog(loaded.data);
  if (!validation.ok) {
    return { ok: false, error: "BACKLOG_INVALID", errors: validation.errors, steps: [] };
  }

  const task = taskId
    ? loaded.data.tasks.find((item) => item.id === taskId)
    : loaded.data.tasks.find((item) => item.status === "EN_COURS")
      || loaded.data.tasks.find((item) => item.id === loaded.data.nextTaskId);

  const commands = commandsForTask(task);
  const startedAt = new Date().toISOString();
  const steps = [];

  for (const command of commands) {
    if (dryRun) {
      steps.push({
        name: command,
        command,
        exitCode: null,
        result: "dry-run",
        startedAt,
        endedAt: startedAt,
      });
      continue;
    }
    const argv = splitCommand(command);
    const begun = new Date().toISOString();
    const run = spawnSync(argv[0], argv.slice(1), { encoding: "utf8", env: process.env, shell: false });
    const ended = new Date().toISOString();
    const output = redactSecrets(`${run.stdout || ""}${run.stderr || ""}`).slice(0, 4000);
    steps.push({
      name: command,
      command,
      exitCode: run.status === null ? 1 : run.status,
      result: run.status === 0 ? "pass" : "fail",
      startedAt: begun,
      endedAt: ended,
      outputPreview: output,
    });
  }

  const ok = dryRun ? true : steps.every((step) => step.exitCode === 0);
  const result = {
    ok,
    dryRun,
    taskId: task?.id || taskId || null,
    generatedAt: startedAt,
    gitHead: gitHead(),
    nodeVersion: process.versions.node,
    location: resolve(outPath),
    steps,
  };

  if (!dryRun) {
    mkdirSync(dirname(resolve(outPath)), { recursive: true });
    writeFileSync(resolve(outPath), `${JSON.stringify(result, null, 2)}\n`);
  }

  return result;
}

async function main(argv) {
  const options = parseArgs(argv);
  const result = runQualityGate(options);
  if (options.json || options.dryRun) {
    process.stdout.write(`${JSON.stringify({
      ok: result.ok,
      taskId: result.taskId,
      dryRun: result.dryRun,
      steps: result.steps.map((step) => ({
        command: step.command,
        exitCode: step.exitCode,
        result: step.result,
      })),
    }, null, 2)}\n`);
  } else {
    process.stdout.write(`QUALITY_GATE_${result.ok ? "OK" : "FAIL"} task=${result.taskId || "none"}\n`);
    for (const step of result.steps) {
      process.stdout.write(`${step.result} ${step.command} exit=${step.exitCode}\n`);
    }
  }
  return result.ok ? 0 : 1;
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
