import "server-only";

import { isProductionActionsEnvEnabled } from "@/lib/x200/actions/policy";

export type MigrationSnapshot = {
  pending: string[];
  applied: string[];
  environment: "LOCAL" | "STAGING" | "PRODUCTION";
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export type MigrationPreflight = {
  ok: boolean;
  code: string;
  message: string;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

/**
 * Never runs prisma migrate reset on production.
 * Apply path is adapter-gated and mocked in CI.
 */
export function preflightMigration(input: {
  environment: "LOCAL" | "STAGING" | "PRODUCTION";
  backupVerified: boolean;
  pendingCount: number;
  allowReset?: boolean;
}): MigrationPreflight {
  const checks: MigrationPreflight["checks"] = [];
  const add = (name: string, ok: boolean, detail: string) =>
    checks.push({ name, ok, detail });

  add("no_migrate_reset", input.allowReset !== true, "prisma migrate reset forbidden on prod");
  if (input.environment === "PRODUCTION") {
    add("backup_verified", input.backupVerified === true, "BACKUP_VERIFIED");
    add(
      "production_flag",
      isProductionActionsEnvEnabled(),
      "X200_PRODUCTION_ACTIONS_ENABLED",
    );
  }
  add("has_pending_or_preview", true, `pending=${input.pendingCount}`);

  const failed = checks.find((c) => !c.ok);
  return {
    ok: !failed,
    code: failed ? "MIGRATION_BLOCKED" : "MIGRATION_READY",
    message: failed ? `Migration bloquée: ${failed.name}` : "Preflight migration OK",
    checks,
  };
}

export type MigrationAdapter = {
  preview: () => Promise<{ pending: string[]; detail: string }>;
  apply: (input: {
    environment: "LOCAL" | "STAGING" | "PRODUCTION";
    typedPhrase: string;
  }) => Promise<{ ok: boolean; detail: string }>;
};

export function createSafeMigrationAdapter(
  env: NodeJS.ProcessEnv = process.env,
): MigrationAdapter {
  return {
    async preview() {
      return {
        pending: [],
        detail: "Migration preview — list from prisma migrate status not auto-invented",
      };
    },
    async apply({ environment, typedPhrase }) {
      if (typedPhrase !== "MIGRATE PRODUCTION" && environment === "PRODUCTION") {
        return { ok: false, detail: "Typed phrase mismatch" };
      }
      if (environment === "PRODUCTION" && !isProductionActionsEnvEnabled(env)) {
        return { ok: false, detail: "X200_PRODUCTION_ACTIONS_ENABLED=false" };
      }
      if (env.CI === "true" || env.X200_FORCE_MIGRATION_ADAPTER_MOCK === "true") {
        return { ok: false, detail: "MIGRATION_MOCK — refuses real migrate" };
      }
      // No free-form prisma CLI from UI. Production apply remains human/runbook.
      return {
        ok: false,
        detail: "APPLY_MIGRATION requires explicit host runbook — adapter refuses auto-apply",
      };
    },
  };
}

export function buildMigrationSnapshot(env: "LOCAL" | "STAGING" | "PRODUCTION"): MigrationSnapshot {
  return {
    pending: [],
    applied: [],
    environment: env,
    risk: env === "PRODUCTION" ? "CRITICAL" : "MEDIUM",
  };
}
