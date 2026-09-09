#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { selectNextTask } from "./lib/x100-backlog.mjs";
import { isCliEntry, readJsonFile } from "./lib/x100-fs.mjs";
import { parseTaskReport } from "./lib/x100-report.mjs";

const MARKER = "[X100-CI]";

function readOptionalJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function checkLabel(value) {
  if (value === "pass") {
    return "succès";
  }
  if (value === "fail") {
    return "échec";
  }
  return value || "inconnu";
}

export function buildCommentBody({
  taskId,
  sha,
  summary,
  backlogOk,
  reportOk,
  nextTaskId,
  workflowUrl,
}) {
  const overall = summary?.ok ? "succès" : "échec";
  const checks = summary?.checks || {};
  const nextLine = nextTaskId ? nextTaskId : "NO_READY_TASK";

  return [
    MARKER,
    "",
    `- ID de tâche : ${taskId || "inconnu"}`,
    `- SHA contrôlé : ${sha || "inconnu"}`,
    `- Résultat : ${overall}`,
    `- Tests : ${checkLabel(checks.tests)} (X100 ${checkLabel(checks.x100Tests)})`,
    `- Lint : ${checkLabel(checks.lint)}`,
    `- Build : ${checkLabel(checks.build)}`,
    `- Playwright : ${checkLabel(checks.playwright)}`,
    `- Backlog : ${backlogOk ? "valide" : "invalide"}`,
    `- Rapport : ${reportOk ? "valide" : "invalide"}`,
    `- Gouvernance : X200 (commentaire [X100-CI] conservé)`,
    `- Relais ChatGPT : non configuré`,
    `- Workflow : ${workflowUrl || "indisponible"}`,
    `- Prochaine tâche : ${nextLine}`,
    "",
  ].join("\n");
}

export function findX100Comment(comments) {
  return (comments || []).find(
    (comment) =>
      comment &&
      typeof comment.body === "string" &&
      comment.body.startsWith(MARKER) &&
      comment.user &&
      comment.user.type === "Bot",
  );
}

function artifactPaths(root) {
  return {
    summary: join(root, "summary.json"),
    backlog: join(root, "backlog.json"),
    report: join(root, "TASK_REPORT.md"),
  };
}

async function githubRequest(url, { method = "GET", body } = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN manquant");
  }
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "clevones-x100-ci",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: "[unparsed]" };
  }
  if (!response.ok) {
    throw new Error(`GitHub API ${method} ${response.status}`);
  }
  return data;
}

export async function upsertPrComment({
  repository,
  prNumber,
  body,
  apiBase = "https://api.github.com",
  request = githubRequest,
}) {
  const listUrl = `${apiBase}/repos/${repository}/issues/${prNumber}/comments?per_page=100`;
  const comments = await request(listUrl);
  const existing = findX100Comment(Array.isArray(comments) ? comments : []);
  if (existing) {
    await request(`${apiBase}/repos/${repository}/issues/comments/${existing.id}`, {
      method: "PATCH",
      body: { body },
    });
    return "updated";
  }
  await request(`${apiBase}/repos/${repository}/issues/${prNumber}/comments`, {
    method: "POST",
    body: { body },
  });
  return "created";
}

async function main() {
  const headRepo = process.env.PR_HEAD_REPO || "";
  const repository = process.env.GITHUB_REPOSITORY || "";
  if (headRepo && repository && headRepo !== repository) {
    process.stdout.write("SKIP_FORK_READONLY\n");
    return 0;
  }

  const artifactRoot = process.env.X100_ARTIFACT_DIR || "ci-artifact";
  const paths = artifactPaths(artifactRoot);
  const summary = readOptionalJson(paths.summary) || { ok: false, checks: {} };
  const backlogLoaded = readJsonFile(paths.backlog);
  const backlogOk =
    Boolean(process.env.BACKLOG_OK) ||
    (backlogLoaded.ok && Array.isArray(backlogLoaded.data?.tasks));

  let reportOk = process.env.REPORT_OK === "true";
  let taskId = "";
  try {
    const markdown = readFileSync(paths.report, "utf8");
    const parsed = parseTaskReport(markdown);
    taskId = parsed.id;
    reportOk = reportOk || Boolean(parsed.id && parsed.status);
  } catch {
    reportOk = false;
  }

  const nextTask = backlogLoaded.ok ? selectNextTask(backlogLoaded.data) : null;
  const body = buildCommentBody({
    taskId,
    sha: process.env.HEAD_SHA || process.env.GITHUB_SHA || "",
    summary,
    backlogOk: summary.checks?.backlog ? summary.checks.backlog === "pass" : backlogOk,
    reportOk: summary.checks?.taskReport ? summary.checks.taskReport === "pass" : reportOk,
    nextTaskId: nextTask?.id || null,
    workflowUrl: process.env.WORKFLOW_URL || "",
  });

  if (!body.startsWith(MARKER)) {
    throw new Error("le commentaire CI doit commencer par [X100-CI]");
  }

  const prNumber = process.env.PR_NUMBER;
  if (!prNumber || !repository) {
    process.stdout.write("SKIP_NO_PR\n");
    process.stdout.write(body);
    return 0;
  }

  const action = await upsertPrComment({
    repository,
    prNumber,
    body,
  });
  process.stdout.write(`COMMENT_${action.toUpperCase()}\n`);
  return 0;
}

if (isCliEntry(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    },
  );
}
