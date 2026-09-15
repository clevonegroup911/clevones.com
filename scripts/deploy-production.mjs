#!/usr/bin/env node
/**
 * Fixed production deploy entrypoint for X200 Human Action Center.
 * Never accepts free-form shell. Refuses unless explicitly enabled.
 * CI and default local runs do not deploy.
 */
import { isCliEntry } from "./lib/x100-fs.mjs";

function argValue(argv, name) {
  const idx = argv.indexOf(name);
  if (idx === -1 || idx + 1 >= argv.length) return null;
  return argv[idx + 1];
}

export function runDeployProduction(argv = process.argv.slice(2), env = process.env) {
  const sha = argValue(argv, "--sha");
  const confirm = argValue(argv, "--confirm");
  const json = argv.includes("--json");

  const short = sha ? sha.slice(0, 7) : null;
  const expectedPhrase = short ? `DEPLOY PRODUCTION ${short}` : null;

  const result = {
    ok: false,
    code: "DEPLOY_FAILED",
    wouldDeploy: false,
    deployed: false,
    sha: sha ?? null,
    checks: [],
    note: "",
  };

  const add = (name, ok, detail) => result.checks.push({ name, ok, detail });

  add("sha_present", Boolean(sha), sha || "missing");
  add(
    "confirm_phrase",
    Boolean(expectedPhrase && confirm === expectedPhrase),
    confirm || "missing",
  );
  add(
    "production_flag",
    env.X200_PRODUCTION_ACTIONS_ENABLED === "true",
    String(env.X200_PRODUCTION_ACTIONS_ENABLED),
  );
  add("not_ci", env.CI !== "true", String(env.CI));
  add("no_force", !argv.includes("--force"), "force forbidden");

  if (env.CI === "true" || env.X200_FORCE_DEPLOY_ADAPTER_MOCK === "true") {
    result.code = "DEPLOY_MOCK";
    result.ok = false;
    result.note = "CI/mock refuses real production deploy";
  } else if (result.checks.every((c) => c.ok)) {
    result.code = "DEPLOY_FAILED";
    result.ok = false;
    result.note =
      "deploy-production.mjs validates gates only; host PM2/rsync runbook not auto-executed";
  } else {
    result.code = "DEPLOY_FAILED";
    result.note = "preflight failed";
  }

  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`${result.code} would_deploy=false\n`);
  }
  return result;
}

if (isCliEntry(import.meta.url)) {
  const result = runDeployProduction();
  process.exit(result.ok ? 0 : 1);
}
