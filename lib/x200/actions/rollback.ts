import "server-only";

import { isProductionActionsEnvEnabled } from "@/lib/x200/actions/policy";

export type RollbackPreview = {
  currentSha: string | null;
  previousGoodSha: string | null;
  lastSuccessfulDeployment: string | null;
  dbCompatibility: "UNKNOWN" | "COMPATIBLE" | "INCOMPATIBLE";
  migrationCompatibility: "UNKNOWN" | "COMPATIBLE" | "INCOMPATIBLE";
};

export type RollbackPreflight = {
  ok: boolean;
  code: string;
  message: string;
  preview: RollbackPreview;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

export function preflightRollback(input: {
  currentSha: string | null;
  targetSha: string | null;
  typedPhrase: string;
  mfaVerified: boolean;
  dbCompatible: boolean | null;
  migrationCompatible: boolean | null;
}): RollbackPreflight {
  const checks: RollbackPreflight["checks"] = [];
  const add = (name: string, ok: boolean, detail: string) =>
    checks.push({ name, ok, detail });

  add("current_sha", Boolean(input.currentSha), input.currentSha ?? "missing");
  add("target_sha", Boolean(input.targetSha), input.targetSha ?? "missing");
  add(
    "typed_phrase",
    Boolean(
      input.targetSha &&
        input.typedPhrase === `ROLLBACK ${input.targetSha.slice(0, 7)}`,
    ),
    input.typedPhrase,
  );
  add("mfa", input.mfaVerified === true, "mfa");
  add(
    "db_compatibility",
    input.dbCompatible !== false,
    String(input.dbCompatible),
  );
  add(
    "migration_compatibility",
    input.migrationCompatible !== false,
    String(input.migrationCompatible),
  );
  add(
    "production_flag",
    isProductionActionsEnvEnabled(),
    "X200_PRODUCTION_ACTIONS_ENABLED",
  );

  const failed = checks.find((c) => !c.ok);
  return {
    ok: !failed,
    code: failed ? "ROLLBACK_BLOCKED" : "ROLLBACK_READY",
    message: failed ? `Rollback bloqué: ${failed.name}` : "Preflight rollback OK",
    preview: {
      currentSha: input.currentSha,
      previousGoodSha: input.targetSha,
      lastSuccessfulDeployment: input.targetSha,
      dbCompatibility:
        input.dbCompatible === true
          ? "COMPATIBLE"
          : input.dbCompatible === false
            ? "INCOMPATIBLE"
            : "UNKNOWN",
      migrationCompatibility:
        input.migrationCompatible === true
          ? "COMPATIBLE"
          : input.migrationCompatible === false
            ? "INCOMPATIBLE"
            : "UNKNOWN",
    },
    checks,
  };
}

export type RollbackAdapter = {
  rollback: (targetSha: string) => Promise<{ ok: boolean; detail: string }>;
};

export function createSafeRollbackAdapter(
  env: NodeJS.ProcessEnv = process.env,
): RollbackAdapter {
  return {
    async rollback(targetSha) {
      if (!targetSha || !/^[0-9a-f]{7,40}$/i.test(targetSha)) {
        return { ok: false, detail: "Invalid target SHA" };
      }
      if (env.CI === "true" || !isProductionActionsEnvEnabled(env)) {
        return { ok: false, detail: "ROLLBACK refused — CI/production gate" };
      }
      return {
        ok: false,
        detail: "ROLLBACK requires host runbook — adapter refuses blind rollback",
      };
    },
  };
}
