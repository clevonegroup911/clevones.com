import "server-only";

import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { isProductionActionsEnvEnabled } from "@/lib/x200/actions/policy";
import type { DriftSnapshot } from "@/lib/x200/actions/types";

const execFileAsync = promisify(execFile);

export type DeployPreflight = {
  ok: boolean;
  code: string;
  message: string;
  preview: {
    environment: "PRODUCTION";
    sha: string | null;
    branch: string | null;
    migrationCount: number | null;
    servicesAffected: string[];
    expectedDowntime: string;
    backup: string;
    rollbackCommit: string | null;
  };
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

export function preflightDeploy(input: {
  branch: string | null;
  dirty: boolean | null;
  deploySha: string | null;
  ciSuccess: boolean;
  backupVerified: boolean;
  secretsConfigured: boolean;
  healthBefore: boolean;
  rollbackTarget: string | null;
  drift: Pick<DriftSnapshot, "blocksDeploy" | "state" | "detail">;
  migrationCount?: number | null;
}): DeployPreflight {
  const checks: DeployPreflight["checks"] = [];
  const add = (name: string, ok: boolean, detail: string) =>
    checks.push({ name, ok, detail });

  add("main_only", input.branch === "main", String(input.branch));
  add("clean_repository", input.dirty === false, String(input.dirty));
  add("ci_green", input.ciSuccess, "ci");
  add("exact_deploy_sha", Boolean(input.deploySha), input.deploySha ?? "missing");
  add("backup_verified", input.backupVerified, "BACKUP_VERIFIED");
  add("secrets_configured", input.secretsConfigured, "secrets");
  add("health_before", input.healthBefore, "health");
  add(
    "rollback_target",
    Boolean(input.rollbackTarget),
    input.rollbackTarget ?? "missing",
  );
  add(
    "no_critical_drift",
    !input.drift.blocksDeploy,
    input.drift.detail,
  );

  const failed = checks.find((c) => !c.ok);
  return {
    ok: !failed,
    code: failed ? "DEPLOY_BLOCKED" : "DEPLOY_READY",
    message: failed ? `Deploy bloqué: ${failed.name}` : "Preflight deploy OK",
    preview: {
      environment: "PRODUCTION",
      sha: input.deploySha,
      branch: input.branch,
      migrationCount: input.migrationCount ?? null,
      servicesAffected: ["next-app", "postgres"],
      expectedDowntime: "unknown — confirm in runbook",
      backup: input.backupVerified ? "VERIFIED" : "MISSING",
      rollbackCommit: input.rollbackTarget,
    },
    checks,
  };
}

export type DeployAdapterResult = {
  ok: boolean;
  code: "DEPLOY_SUCCESS" | "DEPLOY_FAILED" | "ROLLBACK_RECOMMENDED" | "DEPLOY_DISABLED" | "DEPLOY_MOCK";
  detail: string;
};

export type DeployAdapter = {
  deployProduction: (input: {
    sha: string;
    typedPhrase: string;
  }) => Promise<DeployAdapterResult>;
};

/**
 * Fixed script only: scripts/deploy-production.mjs
 * Never arbitrary shell. CI/mock never deploys.
 */
export function createDeployAdapter(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): DeployAdapter {
  return {
    async deployProduction({ sha, typedPhrase }) {
      if (!isProductionActionsEnvEnabled(env)) {
        return {
          ok: false,
          code: "DEPLOY_DISABLED",
          detail: "X200_PRODUCTION_ACTIONS_ENABLED=false",
        };
      }
      if (env.CI === "true" || env.X200_FORCE_DEPLOY_ADAPTER_MOCK === "true") {
        return {
          ok: false,
          code: "DEPLOY_MOCK",
          detail: "CI/mock refuses real production deploy",
        };
      }
      const script = path.join(cwd, "scripts", "deploy-production.mjs");
      try {
        const { stdout, stderr } = await execFileAsync(
          process.execPath,
          [script, "--sha", sha, "--confirm", typedPhrase, "--json"],
          {
            cwd,
            timeout: 120_000,
            encoding: "utf8",
            env: { ...process.env, ...env },
          },
        );
        const combined = `${stdout}\n${stderr}`;
        if (combined.includes("DEPLOY_SUCCESS")) {
          return { ok: true, code: "DEPLOY_SUCCESS", detail: combined.slice(0, 800) };
        }
        if (combined.includes("ROLLBACK_RECOMMENDED")) {
          return {
            ok: false,
            code: "ROLLBACK_RECOMMENDED",
            detail: combined.slice(0, 800),
          };
        }
        return { ok: false, code: "DEPLOY_FAILED", detail: combined.slice(0, 800) };
      } catch (error) {
        return {
          ok: false,
          code: "DEPLOY_FAILED",
          detail: error instanceof Error ? error.message.slice(0, 800) : "deploy failed",
        };
      }
    },
  };
}
