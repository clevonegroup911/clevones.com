#!/usr/bin/env node
import { validateBacklog } from "./lib/x100-backlog.mjs";
import { isCliEntry, readJsonFile } from "./lib/x100-fs.mjs";

export function runValidateBacklog(filePath = "backlog.json") {
  const loaded = readJsonFile(filePath);
  if (!loaded.ok) {
    return { ok: false, errors: [loaded.error], path: loaded.path };
  }
  const result = validateBacklog(loaded.data);
  return { ...result, path: loaded.path, data: loaded.data };
}

async function main(argv) {
  const filePath = argv.find((arg) => !arg.startsWith("--")) || "backlog.json";
  const result = runValidateBacklog(filePath);

  if (!result.ok) {
    process.stderr.write(`BACKLOG_INVALID ${result.path}\n`);
    for (const error of result.errors) {
      process.stderr.write(`- ${error}\n`);
    }
    return 1;
  }

  process.stdout.write(`BACKLOG_VALID ${result.path}\n`);
  process.stdout.write(`tasks=${result.data.tasks.length}\n`);
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
