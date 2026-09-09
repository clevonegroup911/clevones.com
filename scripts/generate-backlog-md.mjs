#!/usr/bin/env node
import { writeFileSync } from "node:fs";

import { validateBacklog } from "./lib/x100-backlog.mjs";
import { isCliEntry, readJsonFile } from "./lib/x100-fs.mjs";

const STATUS_ORDER = [
  "EN_COURS",
  "EN_CONTRÔLE",
  "PRÊTE",
  "BLOQUÉE",
  "ÉCHOUÉE",
  "À_FAIRE",
  "TERMINÉE",
  "ANNULÉE",
];

export function renderBacklogMarkdown(data) {
  const counts = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0]));
  for (const task of data.tasks) {
    counts[task.status] = (counts[task.status] || 0) + 1;
  }
  const lines = [
    "# Backlog — Clevones.com",
    "",
    "Vue générée depuis `backlog.json`. Ne pas éditer à la main.",
    "",
    `- Schéma : ${data.schemaVersion}`,
    `- Registre : ${data.registryVersion}`,
    `- Mode : ${data.executionMode}`,
    `- Mis à jour : ${data.updatedAt}`,
    "",
    "## Compteurs",
    "",
    ...STATUS_ORDER.map((status) => `- ${status} : ${counts[status] || 0}`),
    "",
    "## Tâches",
    "",
    "| ID | Priorité | État | Titre | Humain |",
    "|---|---|---|---|---|",
    ...data.tasks.map((task) => `| ${task.id} | ${task.priority} | ${task.status} | ${task.title.replaceAll("|", "/")} | ${task.requiresHuman ? "oui" : "non"} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export function runGenerateBacklogMd({ filePath = "backlog.json", outPath = "BACKLOG.md" } = {}) {
  const loaded = readJsonFile(filePath);
  if (!loaded.ok) {
    return { ok: false, error: loaded.error };
  }
  const validation = validateBacklog(loaded.data);
  if (!validation.ok) {
    return { ok: false, error: "BACKLOG_INVALID", errors: validation.errors };
  }
  const markdown = renderBacklogMarkdown(loaded.data);
  writeFileSync(outPath, markdown);
  return { ok: true, path: outPath };
}

async function main(argv) {
  const outPath = argv.find((arg) => !arg.startsWith("--")) || "BACKLOG.md";
  const result = runGenerateBacklogMd({ outPath });
  if (!result.ok) {
    process.stderr.write(`BACKLOG_MD_FAILED ${result.error}\n`);
    return 1;
  }
  process.stdout.write(`BACKLOG_MD ${result.path}\n`);
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
