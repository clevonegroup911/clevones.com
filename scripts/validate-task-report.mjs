#!/usr/bin/env node
import { validateBacklog } from "./lib/x100-backlog.mjs";
import { isCliEntry, readJsonFile, readTextFile } from "./lib/x100-fs.mjs";
import { validateTaskReport } from "./lib/x100-report.mjs";

export function runValidateTaskReport({
  reportPath = "TASK_REPORT.md",
  backlogPath = "backlog.json",
} = {}) {
  const loaded = readJsonFile(backlogPath);
  if (!loaded.ok) {
    return { ok: false, errors: [loaded.error] };
  }

  const backlogResult = validateBacklog(loaded.data);
  if (!backlogResult.ok) {
    return {
      ok: false,
      errors: backlogResult.errors.map((error) => `backlog: ${error}`),
    };
  }

  let markdown;
  try {
    markdown = readTextFile(reportPath);
  } catch (error) {
    return {
      ok: false,
      errors: [
        `impossible de lire ${reportPath}: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }

  return validateTaskReport(markdown, loaded.data);
}

async function main(argv) {
  const positional = argv.filter((arg) => !arg.startsWith("--"));
  const reportPath = positional[0] || "TASK_REPORT.md";
  const backlogPath = positional[1] || "backlog.json";
  const result = runValidateTaskReport({ reportPath, backlogPath });

  if (!result.ok) {
    process.stderr.write(`TASK_REPORT_INVALID ${reportPath}\n`);
    for (const error of result.errors) {
      process.stderr.write(`- ${error}\n`);
    }
    return 1;
  }

  process.stdout.write(`TASK_REPORT_VALID ${reportPath}\n`);
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
