#!/usr/bin/env node
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

import { REPORT_MARKER, REPORT_MARKER_X200 } from "./lib/x100-report.mjs";
import { isCliEntry, readJsonFile, readTextFile } from "./lib/x100-fs.mjs";
import { redactSecrets } from "./lib/x100-redact.mjs";

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
    backlogPath: get("--file") || "backlog.json",
    gatePath: get("--gate") || ".x200/quality-results.json",
    outPath: get("--out") || "TASK_REPORT.md",
    copyReports: !flags.has("--no-copy"),
    dryRun: flags.has("--dry-run"),
  };
}

function git(args) {
  return spawnSync("git", args, { encoding: "utf8" });
}

function loadOptionalJson(path) {
  try {
    return JSON.parse(readTextFile(path));
  } catch {
    return null;
  }
}

function bullet(items) {
  if (!items || items.length === 0) {
    return "- aucun";
  }
  return items.map((item) => `- ${item}`).join("\n");
}

export function buildTaskReport({ task, backlog, gate, extra = {} }) {
  const passed = (gate?.steps || []).filter((step) => step.exitCode === 0).map((step) => `${step.command} (exit ${step.exitCode})`);
  const failed = (gate?.steps || []).filter((step) => step.exitCode !== 0).map((step) => `${step.command} (exit ${step.exitCode})`);
  const next = extra.nextTaskId || backlog.nextTaskId || "NO_READY_TASK";
  const created = extra.created || [];
  const modified = extra.modified || [];
  const status = extra.status || task.status;
  const result = extra.result || task.lastTransitionReason || task.objective;
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim() || "unknown";
  const head = git(["rev-parse", "--short", "HEAD"]).stdout.trim() || "unknown";

  const body = [
    "# TASK_REPORT",
    "",
    REPORT_MARKER,
    "",
    REPORT_MARKER_X200,
    "",
    "## ID",
    "",
    task.id,
    "",
    "## Statut",
    "",
    status,
    "",
    "## Objectif",
    "",
    task.objective,
    "",
    "## Résultat",
    "",
    redactSecrets(result),
    "",
    "## Fichiers créés",
    "",
    bullet(created),
    "",
    "## Fichiers modifiés",
    "",
    bullet(modified),
    "",
    "## Commandes",
    "",
    bullet((gate?.steps || []).map((step) => step.command).concat(extra.commands || [])),
    "",
    "## Tests réussis",
    "",
    bullet(passed.length ? passed : extra.passed),
    "",
    "## Tests échoués",
    "",
    bullet(failed.length ? failed : extra.failed),
    "",
    "## Lint",
    "",
    extra.lint || "non exigé pour cette tâche ou inclus dans quality-gate",
    "",
    "## Type-check",
    "",
    extra.typecheck || "non exigé pour cette tâche",
    "",
    "## Build",
    "",
    extra.build || "aucun déploiement",
    "",
    "## Sécurité",
    "",
    extra.security || "aucun secret dans le rapport ; .env non stagé ; pas d'accès production",
    "",
    "## Commit",
    "",
    extra.commit || `${branch} @ ${head}`,
    "",
    "## Pull Request",
    "",
    extra.pullRequest || "PR draft à mettre à jour sans merge ni main",
    "",
    "## Preuves",
    "",
    bullet([
      ...(task.evidence || []),
      ...(gate ? [`quality-gate ok=${gate.ok} head=${gate.gitHead} at=${gate.generatedAt}`] : []),
      ...(extra.evidence || []),
    ]),
    "",
    "## Risques",
    "",
    extra.risks || "- exécutant unique local ; relais ChatGPT non configuré",
    "",
    "## Blocage",
    "",
    extra.blockage || (gate && gate.ok === false ? "quality-gate en échec ; TERMINÉE interdite" : "aucun"),
    "",
    "## Prochaine tâche prête",
    "",
    typeof next === "string" ? next : next || "NO_READY_TASK",
    "",
  ];

  return `${body.join("\n").trim()}\n`;
}

export function runGenerateReport(options) {
  const loaded = readJsonFile(options.backlogPath);
  if (!loaded.ok) {
    return { ok: false, error: loaded.error };
  }
  const taskId = options.taskId
    || loaded.data.tasks.find((task) => task.status === "EN_COURS")?.id
    || loaded.data.tasks.find((task) => task.status === "EN_CONTRÔLE")?.id;
  const task = loaded.data.tasks.find((item) => item.id === taskId);
  if (!task) {
    return { ok: false, error: "tâche introuvable pour le rapport" };
  }
  const gate = loadOptionalJson(options.gatePath);
  const markdown = buildTaskReport({
    task,
    backlog: loaded.data,
    gate,
    extra: options.extra || {},
  });
  if (options.dryRun) {
    return { ok: true, dryRun: true, markdown, taskId: task.id };
  }
  writeFileSync(options.outPath, markdown);
  if (options.copyReports) {
    const reportCopy = join("reports/tasks", `${task.id}.md`);
    mkdirSync(dirname(reportCopy), { recursive: true });
    copyFileSync(options.outPath, reportCopy);
  }
  return { ok: true, dryRun: false, path: options.outPath, taskId: task.id, gateOk: gate?.ok ?? null };
}

async function main(argv) {
  const options = parseArgs(argv);
  const result = runGenerateReport(options);
  if (!result.ok) {
    process.stderr.write(`REPORT_FAILED ${result.error}\n`);
    return 1;
  }
  if (options.dryRun) {
    process.stdout.write(result.markdown);
    return 0;
  }
  process.stdout.write(`REPORT_WRITTEN ${result.path} task=${result.taskId}\n`);
  return 0;
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
