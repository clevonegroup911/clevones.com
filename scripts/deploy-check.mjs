#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { isCliEntry } from "./lib/x100-fs.mjs";

function git(args) {
  return spawnSync("git", args, { encoding: "utf8" });
}

export function runDeployCheck({ cwd = process.cwd() } = {}) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });

  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim();
  add("not_main", branch !== "main", branch || "unknown");
  add("DEPLOYMENT.md", existsSync(resolve(cwd, "DEPLOYMENT.md")), "runbook present");
  add("no_migrate_deploy_this_command", true, "deploy-check does not run prisma migrate deploy");
  add("no_pm2_restart", true, "deploy-check does not restart PM2");
  add("would_deploy", true, "false");

  const productionTouched = false;
  const ok = checks.every((check) => check.ok) && productionTouched === false;
  return {
    ok,
    wouldDeploy: false,
    deployed: false,
    restoreTested: false,
    backupVerifiedThisSession: false,
    checks,
    note: "Contrôle de prérequis seulement. Une documentation de sauvegarde ne prouve pas sa restauration.",
  };
}

async function main(argv) {
  const json = argv.includes("--json");
  const result = runDeployCheck();
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`DEPLOY_CHECK_${result.ok ? "OK" : "FAIL"} would_deploy=false\n`);
    for (const check of result.checks) {
      process.stdout.write(`${check.ok ? "ok" : "fail"} ${check.name}: ${check.detail}\n`);
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
