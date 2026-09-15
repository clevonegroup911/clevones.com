import type { ActionRisk, HumanActionType } from "@/lib/x200/actions/types";

const RISK_BY_ACTION: Record<HumanActionType, ActionRisk> = {
  APPROVE_HUMAN_GATE: "HIGH",
  MARK_READY_FOR_REVIEW: "MEDIUM",
  MERGE_PR: "HIGH",
  DEPLOY_PRODUCTION: "CRITICAL",
  PREVIEW_MIGRATION: "LOW",
  CREATE_BACKUP: "MEDIUM",
  VERIFY_BACKUP: "LOW",
  APPLY_MIGRATION: "CRITICAL",
  RESTORE_BACKUP: "CRITICAL",
  ROLLBACK: "CRITICAL",
  ENTER_MAINTENANCE: "HIGH",
  RESTART_APPLICATION: "HIGH",
  RESTART_AUTOPILOT: "MEDIUM",
  PAUSE_AUTOMATION: "MEDIUM",
  RESUME_AUTOMATION: "MEDIUM",
  COLLECT_DIAGNOSTICS: "LOW",
  RUN_HEALTH_CHECKS: "LOW",
  EMERGENCY_STOP: "HIGH",
  CREATE_RELEASE_CANDIDATE: "MEDIUM",
  FREEZE_RELEASE: "HIGH",
  UNFREEZE_RELEASE: "HIGH",
  MARK_RELEASE_READY: "MEDIUM",
  ENABLE_PAYMENT_LIVE: "CRITICAL",
  ROTATE_CREDENTIALS: "CRITICAL",
  DELETE_TEST_BACKUP: "HIGH",
};

export type PolicyRequirements = {
  risk: ActionRisk;
  requireConfirmation: boolean;
  requireReason: boolean;
  requireMfa: boolean;
  requireTypedPhrase: boolean;
  requireCooldown: boolean;
  typedPhrase: string | null;
  approvalTtlMs: number;
};

const APPROVAL_TTL_MS = 10 * 60 * 1000;

export function riskForAction(action: HumanActionType): ActionRisk {
  return RISK_BY_ACTION[action];
}

export function policyForAction(
  action: HumanActionType,
  options: { shortSha?: string | null } = {},
): PolicyRequirements {
  const risk = riskForAction(action);
  const shortSha = options.shortSha?.slice(0, 7) ?? null;

  switch (risk) {
    case "LOW":
      return {
        risk,
        requireConfirmation: true,
        requireReason: false,
        requireMfa: false,
        requireTypedPhrase: false,
        requireCooldown: false,
        typedPhrase: null,
        approvalTtlMs: APPROVAL_TTL_MS,
      };
    case "MEDIUM":
      return {
        risk,
        requireConfirmation: true,
        requireReason: true,
        requireMfa: false,
        requireTypedPhrase: false,
        requireCooldown: false,
        typedPhrase: null,
        approvalTtlMs: APPROVAL_TTL_MS,
      };
    case "HIGH":
      return {
        risk,
        requireConfirmation: true,
        requireReason: true,
        requireMfa: true,
        requireTypedPhrase: false,
        requireCooldown: false,
        typedPhrase: null,
        approvalTtlMs: APPROVAL_TTL_MS,
      };
    case "CRITICAL": {
      let typedPhrase: string | null = null;
      if (action === "DEPLOY_PRODUCTION") {
        typedPhrase = shortSha
          ? `DEPLOY PRODUCTION ${shortSha}`
          : "DEPLOY PRODUCTION";
      } else if (action === "APPLY_MIGRATION") {
        typedPhrase = "MIGRATE PRODUCTION";
      } else if (action === "RESTORE_BACKUP") {
        typedPhrase = "RESTORE PRODUCTION";
      } else if (action === "ROLLBACK") {
        typedPhrase = shortSha ? `ROLLBACK ${shortSha}` : "ROLLBACK";
      } else if (action === "ENABLE_PAYMENT_LIVE") {
        typedPhrase = "ENABLE PAYMENT LIVE";
      } else if (action === "ROTATE_CREDENTIALS") {
        typedPhrase = "ROTATE CREDENTIALS";
      } else {
        typedPhrase = `CONFIRM ${action}`;
      }
      return {
        risk,
        requireConfirmation: true,
        requireReason: true,
        requireMfa: true,
        requireTypedPhrase: true,
        requireCooldown: true,
        typedPhrase,
        approvalTtlMs: APPROVAL_TTL_MS,
      };
    }
  }
}

export function isHumanActionsEnvEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envFlagTrue(env, "X200_HUMAN_ACTIONS_ENABLED");
}

export function isProductionActionsEnvEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envFlagTrue(env, "X200_PRODUCTION_ACTIONS_ENABLED");
}

export function isControlActionsEnvEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envFlagTrue(env, "X200_CONTROL_ACTIONS_ENABLED");
}

function envFlagTrue(env: NodeJS.ProcessEnv, key: string): boolean {
  const raw = env[key]?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}
