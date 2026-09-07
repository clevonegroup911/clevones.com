#!/usr/bin/env node
import { spawnSync } from "node:child_process";

import { isCliEntry } from "./lib/x100-fs.mjs";

function runGit(args) {
  return spawnSync("git", args, { encoding: "utf8" });
}

async function main() {
  const ranged = runGit(["diff", "--check", "origin/main...HEAD"]);
  const unknown =
    ranged.status !== 0 &&
    /unknown revision|bad revision|ambiguous argument/i.test(`${ranged.stderr}${ranged.stdout}`);

  const result = unknown ? runGit(["diff", "--check"]) : ranged;
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  return result.status === 0 ? 0 : 1;
}

if (isCliEntry(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exit(1);
    },
  );
}
