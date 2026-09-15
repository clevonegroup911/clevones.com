import "server-only";

import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { isProductionActionsEnvEnabled } from "@/lib/x200/actions/policy";

const execFileAsync = promisify(execFile);

export type BackupInfo = {
  latestBackupId: string | null;
  timestamp: string | null;
  size: string | null;
  database: string;
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "MISSING" | "UNKNOWN";
  retention: string | null;
};

export type BackupPreflight = {
  ok: boolean;
  code: string;
  message: string;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

export function preflightRestore(input: {
  backupId: string;
  typedPhrase: string;
  secondConfirmation: boolean;
  currentBackupBeforeRestore: boolean;
  mfaVerified: boolean;
}): BackupPreflight {
  const checks: BackupPreflight["checks"] = [];
  const add = (name: string, ok: boolean, detail: string) =>
    checks.push({ name, ok, detail });

  add("exact_backup_id", Boolean(input.backupId && !input.backupId.includes("..")), input.backupId);
  add("typed_phrase", input.typedPhrase === "RESTORE PRODUCTION", input.typedPhrase);
  add("second_confirmation", input.secondConfirmation === true, "second");
  add("current_backup", input.currentBackupBeforeRestore === true, "pre-restore backup");
  add("mfa", input.mfaVerified === true, "mfa");
  add(
    "production_flag",
    isProductionActionsEnvEnabled(),
    "X200_PRODUCTION_ACTIONS_ENABLED",
  );

  const failed = checks.find((c) => !c.ok);
  return {
    ok: !failed,
    code: failed ? "RESTORE_BLOCKED" : "RESTORE_READY",
    message: failed ? `Restore bloqué: ${failed.name}` : "Preflight restore OK",
    checks,
  };
}

export type BackupAdapter = {
  createBackup: () => Promise<{ ok: boolean; backupId: string | null; detail: string }>;
  verifyBackup: (backupId: string) => Promise<{ ok: boolean; detail: string }>;
  restorePreview: (backupId: string) => Promise<{ ok: boolean; detail: string }>;
  restore: (backupId: string) => Promise<{ ok: boolean; detail: string }>;
};

export function createSafeBackupAdapter(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): BackupAdapter {
  return {
    async createBackup() {
      if (env.CI === "true" || env.X200_FORCE_BACKUP_ADAPTER_MOCK === "true") {
        return { ok: true, backupId: "mock-backup", detail: "BACKUP_MOCK" };
      }
      if (env.X200_HUMAN_ACTIONS_ENABLED !== "true") {
        return { ok: false, backupId: null, detail: "HUMAN_ACTIONS disabled" };
      }
      try {
        const script = path.join(cwd, "scripts", "backup-postgres.sh");
        const { stdout, stderr } = await execFileAsync("bash", [script], {
          cwd,
          timeout: 120_000,
          encoding: "utf8",
        });
        return {
          ok: true,
          backupId: "created",
          detail: `${stdout}\n${stderr}`.trim().slice(0, 800),
        };
      } catch (error) {
        return {
          ok: false,
          backupId: null,
          detail: error instanceof Error ? error.message.slice(0, 800) : "backup failed",
        };
      }
    },
    async verifyBackup(backupId) {
      if (!backupId || backupId.includes("..") || backupId.includes("/")) {
        return { ok: false, detail: "Invalid backupId" };
      }
      if (env.CI === "true" || env.X200_FORCE_BACKUP_ADAPTER_MOCK === "true") {
        return { ok: true, detail: "VERIFY_MOCK" };
      }
      try {
        const script = path.join(cwd, "scripts", "verify-backup.sh");
        const { stdout, stderr } = await execFileAsync("bash", [script, backupId], {
          cwd,
          timeout: 60_000,
          encoding: "utf8",
        });
        return { ok: true, detail: `${stdout}\n${stderr}`.trim().slice(0, 800) };
      } catch (error) {
        return {
          ok: false,
          detail: error instanceof Error ? error.message.slice(0, 800) : "verify failed",
        };
      }
    },
    async restorePreview(backupId) {
      return {
        ok: Boolean(backupId),
        detail: `Restore preview for backupId=${backupId} — no mutation`,
      };
    },
    async restore(backupId) {
      if (env.CI === "true" || !isProductionActionsEnvEnabled(env)) {
        return {
          ok: false,
          detail: "RESTORE refused — production flag/CI gate",
        };
      }
      // Never auto-restore from Control Center without dedicated runbook script.
      return {
        ok: false,
        detail: `RESTORE of ${backupId} requires host runbook — adapter refuses auto-restore`,
      };
    },
  };
}

export function emptyBackupInfo(): BackupInfo {
  return {
    latestBackupId: null,
    timestamp: null,
    size: null,
    database: "postgres",
    verificationStatus: "UNKNOWN",
    retention: null,
  };
}
