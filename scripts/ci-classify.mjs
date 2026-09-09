#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const MODES = Object.freeze({ METADATA: "METADATA", FAST: "FAST", FULL: "FULL" });

const METADATA_PATHS = new Set(["backlog.json", "BACKLOG.md", "TASK_REPORT.md"]);

const FULL_PATTERNS = [
  /^\.github\/workflows\//,
  /^\.cursor\//,
  /^AGENTS\.md$/,
  /^SECURITY\.md$/,
  /^package(-lock)?\.json$/,
  /^prisma\//,
  /^lib\/auth\//,
  /^app\/admin\//,
  /^middleware\.ts$/,
  /^instrumentation\.ts$/,
  /^\.env(?:\.|$)/,
  /(?:^|\/)(?:auth|mfa|secret|secrets|credential|credentials)(?:\/|\.|-|_)/i,
  /^scripts\/(?:ci-|deploy-|backup-|verify-backup|restore-|run-scheduled-backup)/,
  /^scripts\/lib\/(?:x100-backlog|x200-claim)\.mjs$/,
  /(?:^|\/)(?:Dockerfile|docker-compose[^/]*)$/i,
  /(?:^|\/)(?:nginx|caddy)(?:\/|\.|$)/i,
];

const BACKLOG_RUNTIME_ROOT_FIELDS = new Set(["updatedAt", "registryVersion", "nextTaskId", "history"]);
const BACKLOG_RUNTIME_TASK_FIELDS = new Set([
  "status", "evidence", "evidenceRecords", "attempts", "updatedAt", "claim",
  "nextAction", "lastTransitionReason", "blockedReason", "lastFailureCause",
  "consecutiveSameCauseFailures",
]);

function runGit(args) {
  return spawnSync("git", args, { encoding: "utf8", shell: false });
}

function truthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}

function gitShowJson(ref, path) {
  const run = runGit(["show", `${ref}:${path}`]);
  if (run.status !== 0) return null;
  try { return JSON.parse(run.stdout); } catch { return null; }
}

function stripBacklogRuntime(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const root = {};
  for (const [key, value] of Object.entries(data)) {
    if (BACKLOG_RUNTIME_ROOT_FIELDS.has(key)) continue;
    if (key === "tasks" && Array.isArray(value)) {
      root.tasks = value.map((task) => {
        if (!task || typeof task !== "object" || Array.isArray(task)) return task;
        const stableTask = {};
        for (const [taskKey, taskValue] of Object.entries(task)) {
          if (!BACKLOG_RUNTIME_TASK_FIELDS.has(taskKey)) stableTask[taskKey] = taskValue;
        }
        return stableTask;
      });
      continue;
    }
    root[key] = value;
  }
  return root;
}

function backlogChangeIsRuntimeMetadata(base) {
  const before = gitShowJson(base, "backlog.json");
  let after;
  try { after = JSON.parse(readFileSync("backlog.json", "utf8")); } catch { return false; }
  if (!before || !after) return false;
  return JSON.stringify(stripBacklogRuntime(before)) === JSON.stringify(stripBacklogRuntime(after));
}

function isMetadataPath(path) {
  return METADATA_PATHS.has(path) || path.startsWith("reports/tasks/");
}

function requiresFull(path) {
  return FULL_PATTERNS.some((pattern) => pattern.test(path));
}

export function classifyChangedFiles({ files, base, forceFull = false, premerge = false } = {}) {
  if (forceFull || premerge) return { mode: MODES.FULL, reason: forceFull ? "forced" : "premerge" };
  if (!Array.isArray(files) || files.length === 0) return { mode: MODES.FULL, reason: "unknown-or-empty-diff" };
  const fullFile = files.find(requiresFull);
  if (fullFile) return { mode: MODES.FULL, reason: `sensitive-control:${fullFile}` };
  if (files.every(isMetadataPath)) {
    if (files.includes("backlog.json") && !backlogChangeIsRuntimeMetadata(base)) {
      return { mode: MODES.FULL, reason: "backlog-policy-change" };
    }
    return { mode: MODES.METADATA, reason: "runtime-metadata-only" };
  }
  return { mode: MODES.FAST, reason: "ordinary-code" };
}

function changedFiles(base, head) {
  if (!base || !head) return [];
  const run = runGit(["diff", "--name-only", "--diff-filter=ACMRTUXB", `${base}...${head}`]);
  if (run.status !== 0) return [];
  return run.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
}

async function main(argv) {
  const base = argv[0] || process.env.X200_BASE_SHA || process.env.GITHUB_BASE_SHA || null;
  const head = argv[1] || process.env.X200_HEAD_SHA || process.env.GITHUB_SHA || "HEAD";
  const files = changedFiles(base, head);
  const result = classifyChangedFiles({
    files,
    base,
    forceFull: truthy(process.env.X200_FORCE_FULL),
    premerge: truthy(process.env.X200_PREMERGE),
  });
  process.stdout.write(`X200_CI_MODE=${result.mode}\nreason=${result.reason}\nchanged=${files.join(",") || "unknown"}\n`);
  if (process.env.GITHUB_OUTPUT) {
    const fs = await import("node:fs");
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `mode=${result.mode}\nreason=${result.reason}\nchanged_count=${files.length}\n`);
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exit(1);
    },
  );
}
