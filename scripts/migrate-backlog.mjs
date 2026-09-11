#!/usr/bin/env node
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { migrateBacklogData, validateBacklog } from "./lib/x100-backlog.mjs";
import { isCliEntry, readJsonFile, writeJsonFileAtomic } from "./lib/x100-fs.mjs";

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  const filePath = argv.find((arg) => !arg.startsWith("--")) || "backlog.json";
  return {
    filePath,
    dryRun: flags.has("--dry-run"),
    json: flags.has("--json"),
  };
}

export function runMigrateBacklog({ filePath = "backlog.json", dryRun = false } = {}) {
  const loaded = readJsonFile(filePath);
  if (!loaded.ok) {
    return { ok: false, error: loaded.error, path: loaded.path, preserved: true };
  }

  const migrated = migrateBacklogData(loaded.data);
  if (!migrated.ok) {
    return { ok: false, error: migrated.error, path: loaded.path, preserved: true };
  }

  const validation = validateBacklog(migrated.data);
  if (!validation.ok) {
    return {
      ok: false,
      error: "migration invalide",
      errors: validation.errors,
      path: loaded.path,
      preserved: true,
    };
  }

  const ids = migrated.data.tasks.map((task) => task.id);
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    return { ok: false, error: "duplication d'identifiants après migration", preserved: true };
  }

  if (dryRun || !migrated.changed) {
    return {
      ok: true,
      changed: migrated.changed,
      wrote: false,
      fromVersion: migrated.fromVersion,
      taskCount: ids.length,
      path: loaded.path,
    };
  }

  const backupDir = join(dirname(loaded.path), ".x200");
  mkdirSync(backupDir, { recursive: true });
  const backupPath = join(backupDir, "backlog.pre-migrate.json");
  copyFileSync(loaded.path, backupPath);
  writeJsonFileAtomic(filePath, migrated.data);

  return {
    ok: true,
    changed: true,
    wrote: true,
    fromVersion: migrated.fromVersion,
    taskCount: ids.length,
    backupPath,
    path: loaded.path,
  };
}

async function main(argv) {
  const options = parseArgs(argv);
  const result = runMigrateBacklog(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (result.ok) {
    process.stdout.write(
      `MIGRATE_${result.changed ? "APPLIED" : "NOOP"} tasks=${result.taskCount} from=${result.fromVersion}\n`,
    );
  } else {
    process.stderr.write(`MIGRATE_FAILED ${result.error}\n`);
    for (const error of result.errors || []) {
      process.stderr.write(`- ${error}\n`);
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
