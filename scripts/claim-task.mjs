#!/usr/bin/env node
import { readFileSync } from "node:fs";

import { isCliEntry } from "./lib/x100-fs.mjs";
import {
  claimTask,
  completeTask,
  defaultWorkerId,
  mutateBacklogAtomic,
  releaseTask,
} from "./lib/x200-claim.mjs";

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--") && !arg.includes("=")));
  const get = (name) => {
    const index = argv.indexOf(name);
    if (index === -1 || index === argv.length - 1) {
      return null;
    }
    return argv[index + 1];
  };
  const positional = argv.filter((arg) => !arg.startsWith("--"));
  return {
    taskId: positional[0] || get("--id"),
    filePath: get("--file") || "backlog.json",
    dryRun: flags.has("--dry-run"),
    json: flags.has("--json"),
    includeHuman: flags.has("--include-human"),
    workerId: get("--worker") || defaultWorkerId(),
    token: get("--token") || process.env.X200_CLAIM_TOKEN || null,
    leaseSeconds: get("--lease-seconds") ? Number.parseInt(get("--lease-seconds"), 10) : null,
    release: flags.has("--release"),
    complete: flags.has("--complete"),
    gatePath: get("--gate") || ".x200/quality-results.json",
    targetStatus: flags.has("--finalize") ? "TERMINÉE" : "EN_CONTRÔLE",
  };
}

function loadGate(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function runClaimTask(options) {
  const {
    taskId,
    filePath,
    dryRun,
    includeHuman,
    workerId,
    token,
    leaseSeconds,
    release,
    complete,
    gatePath,
    targetStatus,
  } = options;

  return mutateBacklogAtomic({
    filePath,
    dryRun,
    workerId,
    mutator(data) {
      if (release) {
        if (!taskId) {
          return { ok: false, error: "taskId requis pour --release" };
        }
        return releaseTask(data, { taskId, workerId, token });
      }
      if (complete) {
        if (!taskId) {
          return { ok: false, error: "taskId requis pour --complete" };
        }
        const gate = loadGate(gatePath);
        return completeTask(data, { taskId, workerId, token, gate, targetStatus });
      }
      return claimTask(data, { taskId, workerId, leaseSeconds, includeHuman });
    },
  });
}

async function main(argv) {
  const options = parseArgs(argv);
  const result = runClaimTask(options);
  const payload = {
    ok: result.ok,
    action: result.action || null,
    dryRun: Boolean(result.dryRun),
    error: result.error || null,
    errors: result.errors || [],
    taskId: result.task?.id || options.taskId || null,
    workerId: result.task?.claim?.workerId || options.workerId,
    expiresAt: result.task?.claim?.expiresAt || null,
    token: result.task?.claim?.token || null,
    status: result.task?.status || null,
  };
  if (options.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else if (result.ok) {
    process.stdout.write(`CLAIM_${String(result.action || "ok").toUpperCase()} ${payload.taskId} ${payload.status}\n`);
    if (payload.token && !options.complete && !options.release) {
      process.stdout.write(`token=${payload.token}\n`);
    }
  } else {
    process.stderr.write(`CLAIM_FAILED ${result.error || "error"}\n`);
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
