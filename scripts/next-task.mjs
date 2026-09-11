#!/usr/bin/env node
import { selectNextTaskResult, utcDateStamp, validateBacklog } from "./lib/x100-backlog.mjs";
import { isCliEntry, readJsonFile, writeJsonFileAtomic } from "./lib/x100-fs.mjs";

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  const filePath = argv.find((arg) => !arg.startsWith("--")) || "backlog.json";
  return {
    filePath,
    json: flags.has("--json"),
    write: flags.has("--write"),
    dryRun: flags.has("--dry-run") || !flags.has("--write"),
    includeHuman: flags.has("--include-human"),
    ignoreInControl: !flags.has("--respect-in-control"),
  };
}

export function runNextTask({
  filePath = "backlog.json",
  write = false,
  includeHuman = false,
  ignoreInControl = true,
} = {}) {
  const loaded = readJsonFile(filePath);
  if (!loaded.ok) {
    return { ok: false, errors: [loaded.error], path: loaded.path };
  }

  const validation = validateBacklog(loaded.data);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, path: loaded.path };
  }

  const selection = selectNextTaskResult(loaded.data, { includeHuman, ignoreInControl });
  const next = selection.task;
  const nextTaskId = next ? next.id : null;
  let wrote = false;

  if (write) {
    const updated = {
      ...loaded.data,
      nextTaskId,
      updatedAt: utcDateStamp(),
    };
    writeJsonFileAtomic(filePath, updated);
    wrote = true;
  }

  return {
    ok: true,
    path: loaded.path,
    nextTaskId,
    reason: next ? null : selection.reason || "NO_READY_TASK",
    blocking: selection.blocking || [],
    task: next,
    wrote,
    dryRun: !write,
  };
}

function printHuman(result) {
  if (!result.nextTaskId) {
    process.stdout.write(`${result.reason || "NO_READY_TASK"}\n`);
    if (result.blocking?.length) {
      process.stdout.write(`blocking: ${result.blocking.join(", ")}\n`);
    }
    return;
  }
  process.stdout.write(`NEXT_TASK ${result.nextTaskId}\n`);
  process.stdout.write(`title: ${result.task.title}\n`);
  process.stdout.write(`priority: ${result.task.priority}\n`);
  process.stdout.write(`status: ${result.task.status}\n`);
}

async function main(argv) {
  const options = parseArgs(argv);
  const result = runNextTask(options);

  if (!result.ok) {
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, errors: result.errors }, null, 2)}\n`);
    } else {
      process.stderr.write("BACKLOG_INVALID\n");
      for (const error of result.errors) {
        process.stderr.write(`- ${error}\n`);
      }
    }
    return 1;
  }

  if (options.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: true,
          nextTaskId: result.nextTaskId,
          reason: result.reason,
          blocking: result.blocking,
          dryRun: result.dryRun,
          task: result.task
            ? {
                id: result.task.id,
                title: result.task.title,
                priority: result.task.priority,
                status: result.task.status,
                risk: result.task.risk,
                estimatedCost: result.task.estimatedCost,
              }
            : null,
        },
        null,
        2,
      )}\n`,
    );
  } else {
    printHuman(result);
  }

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
