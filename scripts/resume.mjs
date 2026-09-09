#!/usr/bin/env node
import { spawnSync } from "node:child_process";

import { utcDateStamp } from "./lib/x100-backlog.mjs";
import { isCliEntry } from "./lib/x100-fs.mjs";
import { mutateBacklogAtomic, resumeInspection } from "./lib/x200-claim.mjs";

function gitDirty() {
  const run = spawnSync("git", ["status", "--porcelain"], { encoding: "utf8" });
  return Boolean((run.stdout || "").trim());
}

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  return {
    filePath: argv.find((arg) => !arg.startsWith("--")) || "backlog.json",
    json: flags.has("--json"),
    apply: flags.has("--apply"),
    dryRun: !flags.has("--apply"),
  };
}

export function runResume({ filePath = "backlog.json", apply = false } = {}) {
  const dirty = gitDirty();
  return mutateBacklogAtomic({
    filePath,
    dryRun: !apply,
    mutator(data) {
      const inspection = resumeInspection(data, { gitDirty: dirty });
      if (!apply) {
        return { ok: true, data, inspection };
      }

      let next = data;
      for (const finding of inspection.active) {
        const task = next.tasks.find((item) => item.id === finding.id);
        if (!task) {
          continue;
        }
        if (finding.expired && finding.gitDirty) {
          const blocked = {
            ...task,
            status: "BLOQUÉE",
            claim: null,
            blockedReason: "reprise incertaine: bail expiré et arbre Git modifié",
            lastTransitionReason: "resume: effet externe non réconcilié",
            nextAction: "inspecter diff et preuves avant toute répétition",
            updatedAt: utcDateStamp(),
          };
          next = {
            ...next,
            tasks: next.tasks.map((item) => (item.id === blocked.id ? blocked : item)),
          };
          continue;
        }
        if (finding.expired && !finding.gitDirty) {
          const ready = {
            ...task,
            status: "PRÊTE",
            claim: null,
            lastTransitionReason: "resume: bail expiré sans modification Git détectée",
            nextAction: "revérifier les effets hors Git avant de réserver",
            updatedAt: utcDateStamp(),
          };
          next = {
            ...next,
            tasks: next.tasks.map((item) => (item.id === ready.id ? ready : item)),
          };
        }
      }
      return { ok: true, data: next, inspection };
    },
  });
}

async function main(argv) {
  const options = parseArgs(argv);
  const result = runResume(options);
  const inspection = result.inspection || resumeInspection({ tasks: [] });
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ ok: result.ok, error: result.error, inspection, wrote: result.wrote }, null, 2)}\n`);
  } else {
    process.stdout.write(`RESUME_${result.ok ? "OK" : "FAIL"} dirty=${gitDirty()}\n`);
    process.stdout.write("exactly-once=no\n");
    for (const finding of inspection.active || []) {
      process.stdout.write(`${finding.id} expired=${finding.expired} dirty=${finding.gitDirty} -> ${finding.action}\n`);
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
