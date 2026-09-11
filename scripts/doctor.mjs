#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { hostname } from "node:os";
import { resolve } from "node:path";

import { SCHEMA_VERSION, validateBacklog } from "./lib/x100-backlog.mjs";
import { isCliEntry, readJsonFile } from "./lib/x100-fs.mjs";
import { redactSecrets } from "./lib/x100-redact.mjs";

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8", shell: false });
}

function gitTracked(path) {
  const result = run("git", ["ls-files", "--error-unmatch", path]);
  return result.status === 0;
}

export function runDoctor({ cwd = process.cwd() } = {}) {
  const checks = [];
  const add = (name, ok, detail) => {
    checks.push({ name, ok, detail: redactSecrets(String(detail)) });
  };

  add("node", Number(process.versions.node.split(".")[0]) >= 20, process.versions.node);
  const npm = run("npm", ["-v"]);
  add("npm", npm.status === 0, (npm.stdout || "").trim() || "missing");
  const git = run("git", ["--version"]);
  add("git", git.status === 0, (git.stdout || "").trim() || "missing");

  const backlogPath = resolve(cwd, "backlog.json");
  const loaded = readJsonFile(backlogPath);
  if (!loaded.ok) {
    add("backlog.json", false, loaded.error);
  } else {
    const validation = validateBacklog(loaded.data);
    add(
      "backlog",
      validation.ok && loaded.data.schemaVersion === SCHEMA_VERSION,
      validation.ok
        ? `schema=${loaded.data.schemaVersion} tasks=${loaded.data.tasks.length} mode=${loaded.data.executionMode}`
        : validation.errors.join("; "),
    );
  }

  add(".env tracked", !gitTracked(".env"), gitTracked(".env") ? "tracked" : "not tracked");
  add(".env.example", existsSync(resolve(cwd, ".env.example")), "present");
  add("AGENTS.md", existsSync(resolve(cwd, "AGENTS.md")), "present");
  add("DEPLOYMENT.md", existsSync(resolve(cwd, "DEPLOYMENT.md")), "present");
  add("single-executor", loaded.ok ? loaded.data.executionMode === "single-executor" : false, loaded.ok ? loaded.data.executionMode : "unknown");
  add("host", true, hostname());
  add("lock", true, existsSync(resolve(cwd, ".x200/executor.lock")) ? "held_or_stale" : "free");

  const envKeys = [];
  try {
    const example = readFileSync(resolve(cwd, ".env.example"), "utf8");
    for (const line of example.split("\n")) {
      const match = /^([A-Z0-9_]+)=/.exec(line);
      if (match) {
        envKeys.push(match[1]);
      }
    }
  } catch {
    // optional
  }
  add("env_names", envKeys.length > 0, envKeys.join(",") || "none");

  const ok = checks.every((check) => check.ok);
  return { ok, checks };
}

async function main(argv) {
  const json = argv.includes("--json");
  const result = runDoctor();
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`DOCTOR_${result.ok ? "OK" : "FAIL"}\n`);
    for (const check of result.checks) {
      process.stdout.write(`${check.ok ? "ok" : "fail"} ${check.name}: ${check.detail}\n`);
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
