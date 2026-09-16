import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import {
  appendHumanActionAudit,
  findIdempotencyHit,
  recordIdempotency,
} from "@/lib/x200/actions/audit";
import { consumeApproval, issueApproval } from "@/lib/x200/actions/approvals";
import { createSafeBackupAdapter, preflightRestore } from "@/lib/x200/actions/backup";
import { createDeployAdapter, preflightDeploy } from "@/lib/x200/actions/deploy";
import {
  activateEmergencyStop,
  createIncident,
} from "@/lib/x200/actions/incident";
import {
  createGhMergeAdapter,
  markPrReadyForReview,
  preflightMerge,
  type ReadyForReviewAdapter,
} from "@/lib/x200/actions/merge";
import {
  acceptMockMfaProof,
  consumePrivilegedChallenge,
  issuePrivilegedChallenge,
} from "@/lib/x200/actions/mfa-challenge";
import {
  createSafeMigrationAdapter,
  preflightMigration,
} from "@/lib/x200/actions/migration";
import {
  isHumanActionsEnvEnabled,
  isProductionActionsEnvEnabled,
  policyForAction,
  riskForAction,
} from "@/lib/x200/actions/policy";
import { createSafeRollbackAdapter, preflightRollback } from "@/lib/x200/actions/rollback";
import { computeDrift } from "@/lib/x200/actions/drift";
import { HUMAN_ACTION_TYPES } from "@/lib/x200/actions/types";
import type {
  ActionPreview,
  ActionReceipt,
  HumanActionEnvironment,
  HumanActionType,
} from "@/lib/x200/actions/types";
import type {
  GitSnapshot,
  GithubSnapshot,
  HumanGateSnapshot,
  ProductCompleteSnapshot,
  AutopilotLiveState,
} from "@/lib/x200/types";
import { isEmergencyStopActive } from "@/lib/x200/actions/incident";

export const humanActionRequestSchema = z
  .object({
    action: z.enum(HUMAN_ACTION_TYPES),
    idempotencyKey: z.string().min(8).max(128),
    reason: z.string().min(3).max(500).optional(),
    typedPhrase: z.string().max(120).optional(),
    approvalId: z.string().uuid().optional(),
    mfaCode: z.string().max(32).optional(),
    mfaProofToken: z.string().max(128).optional(),
    challengeId: z.string().uuid().optional(),
    mergeMode: z.enum(["merge", "squash"]).optional(),
    expectedSha: z.string().regex(/^[0-9a-f]{7,40}$/i).optional(),
    targetSha: z.string().regex(/^[0-9a-f]{7,40}$/i).optional(),
    backupId: z.string().min(1).max(128).optional(),
    environment: z.enum(["LOCAL", "STAGING", "PRODUCTION"]).optional(),
    secondConfirmation: z.boolean().optional(),
    incidentSeverity: z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]).optional(),
    incidentNotes: z.string().max(500).optional(),
    previewOnly: z.boolean().optional(),
  })
  .strict();

export type HumanActionRequest = z.infer<typeof humanActionRequestSchema>;

export const FORBIDDEN_ACTION_KEYS = [
  "command",
  "args",
  "shell",
  "script",
  "cwd",
  "env",
  "sql",
  "rm",
] as const;

export type HumanActionContext = {
  actorId: string;
  actorEmail: string;
  actorRole: "SUPER_ADMIN" | "ADMIN";
  git: Pick<GitSnapshot, "head" | "branch" | "dirty" | "status">;
  github: Pick<
    GithubSnapshot,
    | "prNumber"
    | "prDraft"
    | "prState"
    | "prMergeable"
    | "prHeadSha"
    | "ciLatestConclusion"
    | "status"
  >;
  humanGate: Pick<
    HumanGateSnapshot,
    "present" | "reason" | "taskId" | "requiredAction"
  >;
  productComplete: Pick<ProductCompleteSnapshot, "head">;
  fedora: Pick<AutopilotLiveState, "autopilotLiveState" | "ageMs" | "agentRunning">;
  mainHead?: string | null;
  deployedProductionSha?: string | null;
  backupVerified?: boolean;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Test-only injectable ready adapter — never used for live false success. */
  readyForReviewAdapter?: ReadyForReviewAdapter;
};

export type HumanActionOutcome = {
  ok: boolean;
  status: number;
  code: string;
  message: string;
  preview: ActionPreview | null;
  receipt: ActionReceipt | null;
  approvalId: string | null;
  challengeId: string | null;
  expectedSha: string | null;
  currentSha: string | null;
};

export function buildActionPreview(
  action: HumanActionType,
  ctx: HumanActionContext,
): ActionPreview {
  const env: HumanActionEnvironment =
    action.includes("PRODUCTION") ||
    action === "APPLY_MIGRATION" ||
    action === "RESTORE_BACKUP" ||
    action === "ROLLBACK" ||
    action === "DEPLOY_PRODUCTION" ||
    action === "ENABLE_PAYMENT_LIVE"
      ? "PRODUCTION"
      : "LOCAL";
  const policy = policyForAction(action, {
    shortSha: ctx.git.head ?? ctx.github.prHeadSha,
  });
  return {
    action,
    target:
      action === "MERGE_PR" || action === "MARK_READY_FOR_REVIEW"
        ? `PR #${ctx.github.prNumber ?? "?"}`
        : action === "APPROVE_HUMAN_GATE"
          ? ctx.humanGate.taskId ?? "HUMAN_GATE"
          : action,
    environment: env,
    prNumber: ctx.github.prNumber,
    exactSha: ctx.github.prHeadSha ?? ctx.git.head,
    currentRemoteSha: ctx.github.prHeadSha,
    expectedChanges: [`Execute controlled action ${action}`],
    risks: [`Risk=${policy.risk}`, ...(policy.requireMfa ? ["MFA required"] : [])],
    rollback:
      env === "PRODUCTION"
        ? "Use ROLLBACK / restore runbook if postchecks fail"
        : null,
    preconditions: [
      "SUPER_ADMIN",
      ...(policy.requireReason ? ["reason"] : []),
      ...(policy.requireMfa ? ["MFA/re-auth"] : []),
      ...(policy.requireTypedPhrase ? [`typed: ${policy.typedPhrase}`] : []),
      ...(policy.requireSecondConfirmation ? ["second confirmation"] : []),
    ],
    approvalRequirement: policy.risk,
    typedPhrase: policy.typedPhrase,
    humanGate: ctx.humanGate.present
      ? ctx.humanGate.requiredAction ?? ctx.humanGate.reason ?? "present"
      : "not required",
    mfaRequired: policy.requireMfa,
    typedConfirmationRequired: policy.requireTypedPhrase,
    source: "human-actions executor (previewOnly — no mutation)",
    verificationStatus: "PREVIEW_ONLY",
  };
}

export async function executeHumanAction(
  request: HumanActionRequest,
  ctx: HumanActionContext,
): Promise<HumanActionOutcome> {
  const env = ctx.env ?? process.env;
  const cwd = ctx.cwd ?? process.cwd();
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const actionId = randomUUID();
  const preview = buildActionPreview(request.action, ctx);

  if (ctx.actorRole !== "SUPER_ADMIN") {
    return fail(403, "ACTION_NOT_ALLOWED", "SUPER_ADMIN requis", preview);
  }

  if (request.previewOnly) {
    return {
      ok: true,
      status: 200,
      code: "PREVIEW",
      message: "Preview ready — no action executed.",
      preview,
      receipt: null,
      approvalId: null,
      challengeId: null,
      expectedSha: preview.exactSha,
      currentSha: ctx.github.prHeadSha ?? ctx.git.head,
    };
  }

  if (!isHumanActionsEnvEnabled(env)) {
    return fail(
      403,
      "HUMAN_ACTIONS_DISABLED",
      "X200_HUMAN_ACTIONS_ENABLED=false",
      preview,
    );
  }

  if (await isEmergencyStopActive(cwd)) {
    if (request.action !== "COLLECT_DIAGNOSTICS" && request.action !== "RUN_HEALTH_CHECKS") {
      return fail(
        403,
        "EMERGENCY_STOP_ACTIVE",
        "Emergency stop actif — mutations X200 désactivées",
        preview,
      );
    }
  }

  const idempo = await findIdempotencyHit(request.idempotencyKey, { cwd });
  if (idempo) {
    return fail(
      409,
      "IDEMPOTENCY_CONFLICT",
      `Duplicate idempotencyKey — prior actionId=${idempo.actionId} result=${idempo.result}`,
      preview,
    );
  }

  const policy = policyForAction(request.action, {
    shortSha: preview.exactSha,
  });

  if (policy.requireReason && !request.reason?.trim()) {
    return fail(400, "REASON_REQUIRED", "Justification requise", preview);
  }

  if (policy.requireSecondConfirmation && request.secondConfirmation !== true) {
    return fail(
      400,
      "SECOND_CONFIRMATION_REQUIRED",
      "Second confirmation required for this critical action",
      preview,
    );
  }

  if (
    policy.requireTypedPhrase &&
    policy.typedPhrase &&
    request.typedPhrase !== policy.typedPhrase
  ) {
    return fail(
      400,
      "TYPED_PHRASE_MISMATCH",
      `Phrase requise: ${policy.typedPhrase}`,
      preview,
    );
  }

  // MFA / privileged challenge for HIGH/CRITICAL
  let challengeId: string | null = null;
  if (policy.requireMfa) {
    if (request.challengeId && request.mfaProofToken) {
      const consumed = await consumePrivilegedChallenge({
        challengeId: request.challengeId,
        actorId: ctx.actorId,
        action: request.action,
        mfaProofToken: request.mfaProofToken,
        cwd,
      });
      if (!consumed.ok) {
        return fail(401, consumed.code, "Challenge MFA invalide/expiré", preview);
      }
      challengeId = request.challengeId;
    } else if (request.mfaCode && acceptMockMfaProof(request.mfaCode, env)) {
      // Dev/test single-shot mock MFA — still audited via challenge records.
      const proof = `mock:${request.mfaCode}`;
      const issued = await issuePrivilegedChallenge({
        actorId: ctx.actorId,
        action: request.action,
        mfaProofToken: proof,
        cwd,
      });
      await consumePrivilegedChallenge({
        challengeId: issued.challengeId,
        actorId: ctx.actorId,
        action: request.action,
        mfaProofToken: proof,
        cwd,
      });
      challengeId = issued.challengeId;
    } else if (request.mfaProofToken) {
      const issued = await issuePrivilegedChallenge({
        actorId: ctx.actorId,
        action: request.action,
        mfaProofToken: request.mfaProofToken,
        cwd,
      });
      await consumePrivilegedChallenge({
        challengeId: issued.challengeId,
        actorId: ctx.actorId,
        action: request.action,
        mfaProofToken: request.mfaProofToken,
        cwd,
      });
      challengeId = issued.challengeId;
    } else {
      return fail(
        401,
        "MFA_REQUIRED",
        "MFA / re-auth requis pour cette action (X200 privileged action challenge)",
        preview,
      );
    }
  }

  // Approve human gate is special: issues approval, never bypasses.
  if (request.action === "APPROVE_HUMAN_GATE") {
    if (!ctx.humanGate.present) {
      return fail(400, "NO_HUMAN_GATE", "Aucun Human Gate actif", preview);
    }
    const issued = await issueApproval(
      {
        actorId: ctx.actorId,
        actorEmail: ctx.actorEmail,
        gateType: ctx.humanGate.requiredAction ?? "HUMAN_GATE",
        taskId: ctx.humanGate.taskId,
        action: request.action,
        reason: request.reason ?? "approved",
        expectedSha: ctx.git.head,
        environment: "LOCAL",
      },
      { cwd },
    );

    const receipt = await finalizeReceipt({
      actionId,
      idempotencyKey: request.idempotencyKey,
      actor: ctx.actorEmail,
      action: request.action,
      environment: "LOCAL",
      startedAt,
      startedMs,
      result: "SUCCESS",
      before: { humanGate: true },
      after: { approvalId: issued.approvalId, bypass: false },
      refs: { expectedSha: ctx.git.head },
      code: "APPROVAL_ISSUED",
      message:
        "Human Gate approval recorded — does NOT bypass; controlled action still required",
      cwd,
    });

    return {
      ok: true,
      status: 200,
      code: "APPROVAL_ISSUED",
      message: receipt.message,
      preview,
      receipt,
      approvalId: issued.approvalId,
      challengeId,
      expectedSha: ctx.git.head,
      currentSha: ctx.git.head,
    };
  }

  // For other HIGH/CRITICAL mutating actions, require consumable approval when SHA-bound.
  const needsConsumedApproval =
    riskForAction(request.action) === "CRITICAL" ||
    request.action === "MERGE_PR";

  if (needsConsumedApproval && request.action !== "EMERGENCY_STOP") {
    if (!request.approvalId) {
      // Auto-issue short approval after MFA for the exact action+sha, then require explicit second call
      // OR accept approvalId from prior APPROVE / explicit approve step.
      const issued = await issueApproval(
        {
          actorId: ctx.actorId,
          actorEmail: ctx.actorEmail,
          gateType: request.action,
          taskId: ctx.humanGate.taskId,
          action: request.action,
          reason: request.reason ?? request.action,
          expectedSha:
            request.expectedSha ?? ctx.github.prHeadSha ?? ctx.git.head,
          environment: preview.environment,
        },
        { cwd },
      );
      return {
        ok: false,
        status: 401,
        code: "APPROVAL_REQUIRED",
        message:
          "Approval issued — resubmit with approvalId to CONFIRM & EXECUTE",
        preview,
        receipt: null,
        approvalId: issued.approvalId,
        challengeId,
        expectedSha: issued.expectedSha,
        currentSha: ctx.github.prHeadSha ?? ctx.git.head,
      };
    }

    const currentSha =
      request.expectedSha ?? ctx.github.prHeadSha ?? ctx.git.head;
    const consumed = await consumeApproval(
      {
        approvalId: request.approvalId,
        action: request.action,
        expectedSha: currentSha,
        environment: preview.environment,
        taskId: ctx.humanGate.taskId,
      },
      { cwd },
    );
    if (!consumed.ok) {
      return {
        ok: false,
        status: consumed.code === "STALE_APPROVAL" ? 409 : 403,
        code: consumed.code,
        message: consumed.message,
        preview,
        receipt: null,
        approvalId: request.approvalId,
        challengeId,
        expectedSha: consumed.approval?.expectedSha ?? null,
        currentSha,
      };
    }
  }

  // Dispatch fixed adapters
  let resultOk = false;
  let code = "OK";
  let message = "Action completed";
  const before: Record<string, unknown> = {
    head: ctx.git.head,
    pr: ctx.github.prNumber,
  };
  const after: Record<string, unknown> = {};

  switch (request.action) {
    case "MARK_READY_FOR_REVIEW": {
      if (ctx.github.prNumber == null) {
        return fail(400, "NO_PR", "PR introuvable", preview);
      }
      if (ctx.github.prDraft !== true) {
        return fail(400, "NOT_DRAFT", "PR n'est pas draft", preview);
      }
      const expectedSha =
        request.expectedSha ?? ctx.github.prHeadSha ?? ctx.git.head;
      const ready = await markPrReadyForReview({
        prNumber: ctx.github.prNumber,
        expectedSha,
        beforeDraft: ctx.github.prDraft,
        env,
        cwd,
        adapter: ctx.readyForReviewAdapter,
      });
      resultOk = ready.ok && ready.remoteVerified === true && ready.afterDraft === false;
      code = ready.code;
      message = ready.detail;
      before.prNumber = ctx.github.prNumber;
      before.beforeDraft = ready.beforeDraft;
      before.expectedSha = expectedSha;
      after.prNumber = ready.prNumber;
      after.beforeDraft = ready.beforeDraft;
      after.afterDraft = ready.afterDraft;
      after.remoteVerified = ready.remoteVerified;
      after.remoteState = ready.remoteState;
      after.remoteHeadSha = ready.remoteHeadSha;
      after.adapterMode = ready.adapterMode;
      break;
    }
    case "MERGE_PR": {
      const mode = request.mergeMode ?? "squash";
      const pre = preflightMerge({
        github: ctx.github,
        git: ctx.git,
        humanGate: ctx.humanGate,
        actorRole: ctx.actorRole,
        mode,
      });
      if (!pre.ok) {
        return fail(400, pre.code, pre.message, preview);
      }
      if (!ctx.github.prNumber || !pre.expectedSha) {
        return fail(400, "MERGE_BLOCKED", "PR/SHA manquant", preview);
      }
      const adapter = createGhMergeAdapter(env, cwd);
      const merged = await adapter.mergePr({
        prNumber: ctx.github.prNumber,
        mode,
        expectedSha: pre.expectedSha,
      });
      resultOk = merged.ok;
      code = merged.ok ? "MERGED" : "MERGE_FAILED";
      message = merged.detail;
      after.detail = merged.detail;
      break;
    }
    case "DEPLOY_PRODUCTION": {
      if (!isProductionActionsEnvEnabled(env)) {
        return fail(
          403,
          "PRODUCTION_DISABLED",
          "X200_PRODUCTION_ACTIONS_ENABLED=false",
          preview,
        );
      }
      const drift = computeDrift({
        localHead: ctx.git.head,
        prHead: ctx.github.prHeadSha,
        mainHead: ctx.mainHead ?? null,
        deployedProductionSha: ctx.deployedProductionSha ?? null,
        productCompleteHead: ctx.productComplete.head,
      });
      const pre = preflightDeploy({
        branch: ctx.git.branch,
        dirty: ctx.git.dirty,
        deploySha: request.expectedSha ?? ctx.git.head,
        ciSuccess: ctx.github.ciLatestConclusion === "success",
        backupVerified: ctx.backupVerified === true,
        secretsConfigured: Boolean(env.DATABASE_URL && env.AUTH_SECRET),
        healthBefore: true,
        rollbackTarget: ctx.deployedProductionSha ?? ctx.git.head,
        drift,
      });
      if (!pre.ok) {
        return fail(400, pre.code, pre.message, preview);
      }
      const deploy = createDeployAdapter(env, cwd);
      const out = await deploy.deployProduction({
        sha: pre.preview.sha!,
        typedPhrase: request.typedPhrase!,
      });
      resultOk = out.ok;
      code = out.code;
      message = out.detail;
      after.deploy = out.code;
      break;
    }
    case "PREVIEW_MIGRATION": {
      const mig = createSafeMigrationAdapter(env);
      const out = await mig.preview();
      resultOk = true;
      code = "MIGRATION_PREVIEW";
      message = out.detail;
      after.pending = out.pending;
      break;
    }
    case "CREATE_BACKUP": {
      const bak = createSafeBackupAdapter(env, cwd);
      const out = await bak.createBackup();
      resultOk = out.ok;
      code = out.ok ? "BACKUP_CREATED" : "BACKUP_FAILED";
      message = out.detail;
      after.backupId = out.backupId;
      break;
    }
    case "VERIFY_BACKUP": {
      if (!request.backupId) {
        return fail(400, "BACKUP_ID_REQUIRED", "backupId requis", preview);
      }
      const bak = createSafeBackupAdapter(env, cwd);
      const out = await bak.verifyBackup(request.backupId);
      resultOk = out.ok;
      code = out.ok ? "BACKUP_VERIFIED" : "BACKUP_VERIFY_FAILED";
      message = out.detail;
      break;
    }
    case "APPLY_MIGRATION": {
      const pre = preflightMigration({
        environment: "PRODUCTION",
        backupVerified: ctx.backupVerified === true,
        pendingCount: 1,
      });
      if (!pre.ok) {
        return fail(400, pre.code, pre.message, preview);
      }
      const mig = createSafeMigrationAdapter(env);
      const out = await mig.apply({
        environment: "PRODUCTION",
        typedPhrase: request.typedPhrase ?? "",
      });
      resultOk = out.ok;
      code = out.ok ? "MIGRATION_APPLIED" : "MIGRATION_BLOCKED";
      message = out.detail;
      break;
    }
    case "RESTORE_BACKUP": {
      if (!request.backupId) {
        return fail(400, "BACKUP_ID_REQUIRED", "backupId requis", preview);
      }
      const pre = preflightRestore({
        backupId: request.backupId,
        typedPhrase: request.typedPhrase ?? "",
        secondConfirmation: request.secondConfirmation === true,
        currentBackupBeforeRestore: ctx.backupVerified === true,
        mfaVerified: policy.requireMfa,
      });
      if (!pre.ok) {
        return fail(400, pre.code, pre.message, preview);
      }
      const bak = createSafeBackupAdapter(env, cwd);
      const out = await bak.restore(request.backupId);
      resultOk = out.ok;
      code = out.ok ? "RESTORED" : "RESTORE_BLOCKED";
      message = out.detail;
      break;
    }
    case "ROLLBACK": {
      const pre = preflightRollback({
        currentSha: ctx.git.head,
        targetSha: request.targetSha ?? null,
        typedPhrase: request.typedPhrase ?? "",
        mfaVerified: true,
        dbCompatible: null,
        migrationCompatible: null,
      });
      if (!pre.ok) {
        return fail(400, pre.code, pre.message, preview);
      }
      const rb = createSafeRollbackAdapter(env);
      const out = await rb.rollback(request.targetSha!);
      resultOk = out.ok;
      code = out.ok ? "ROLLBACK_OK" : "ROLLBACK_BLOCKED";
      message = out.detail;
      break;
    }
    case "EMERGENCY_STOP": {
      const stop = await activateEmergencyStop({
        actor: ctx.actorEmail,
        reason: request.reason ?? "emergency stop",
        cwd,
      });
      resultOk = stop.ok;
      code = "EMERGENCY_STOP_ACTIVE";
      message = "AUTOPILOT/cycles/mutations paused — state preserved";
      after.path = stop.path;
      break;
    }
    case "ENTER_MAINTENANCE":
    case "PAUSE_AUTOMATION":
    case "RESUME_AUTOMATION":
    case "COLLECT_DIAGNOSTICS":
    case "RUN_HEALTH_CHECKS":
    case "RESTART_AUTOPILOT":
    case "RESTART_APPLICATION":
    case "CREATE_RELEASE_CANDIDATE":
    case "FREEZE_RELEASE":
    case "UNFREEZE_RELEASE":
    case "MARK_RELEASE_READY": {
      // Safe incident / release bookkeeping — no arbitrary shell.
      if (
        request.action === "ENTER_MAINTENANCE" ||
        request.incidentSeverity
      ) {
        await createIncident({
          severity: request.incidentSeverity ?? "SEV3",
          notes: request.incidentNotes ?? request.action,
          owner: ctx.actorEmail,
          cwd,
        });
      }
      resultOk = true;
      code = "RECORDED";
      message = `${request.action} recorded (no destructive side effects)`;
      after.action = request.action;
      break;
    }
    case "ENABLE_PAYMENT_LIVE": {
      resultOk = false;
      code = "NOT_AVAILABLE";
      message =
        "Payment live mode NOT_AVAILABLE — live PSP not connected in this repository";
      break;
    }
    case "ROTATE_CREDENTIALS": {
      resultOk = false;
      code = "ROTATION_UNAVAILABLE";
      message = "Secret rotation provider not configured";
      break;
    }
    case "DELETE_TEST_BACKUP": {
      if (!request.backupId) {
        return fail(400, "BACKUP_ID_REQUIRED", "backupId requis", preview);
      }
      if (request.backupId.includes("..") || request.backupId.includes("/")) {
        return fail(400, "INVALID_BACKUP_ID", "backupId invalide", preview);
      }
      resultOk = false;
      code = "DELETE_REFUSED";
      message = "DELETE_TEST_BACKUP adapter refuses auto-delete outside explicit host ops";
      after.backupId = request.backupId;
      break;
    }
    default:
      return fail(400, "UNSUPPORTED_ACTION", "Action non supportée", preview);
  }

  const receipt = await finalizeReceipt({
    actionId,
    idempotencyKey: request.idempotencyKey,
    actor: ctx.actorEmail,
    action: request.action,
    environment: preview.environment,
    startedAt,
    startedMs,
    result: resultOk ? "SUCCESS" : "FAILED",
    before,
    after,
    refs: {
      expectedSha: request.expectedSha ?? preview.exactSha,
      pr: ctx.github.prNumber != null ? String(ctx.github.prNumber) : null,
    },
    code,
    message,
    cwd,
  });

  return {
    ok: resultOk,
    status: resultOk ? 200 : 400,
    code,
    message,
    preview,
    receipt,
    approvalId: request.approvalId ?? null,
    challengeId,
    expectedSha: preview.exactSha,
    currentSha: ctx.github.prHeadSha ?? ctx.git.head,
  };
}

function fail(
  status: number,
  code: string,
  message: string,
  preview: ActionPreview,
): HumanActionOutcome {
  return {
    ok: false,
    status,
    code,
    message,
    preview,
    receipt: null,
    approvalId: null,
    challengeId: null,
    expectedSha: preview.exactSha,
    currentSha: preview.exactSha,
  };
}

async function finalizeReceipt(input: {
  actionId: string;
  idempotencyKey: string;
  actor: string;
  action: HumanActionType;
  environment: HumanActionEnvironment;
  startedAt: string;
  startedMs: number;
  result: ActionReceipt["result"];
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  refs: Record<string, string | null>;
  code: string;
  message: string;
  cwd: string;
}): Promise<ActionReceipt> {
  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - input.startedMs;
  const receipt = await appendHumanActionAudit(
    {
      actionId: input.actionId,
      idempotencyKey: input.idempotencyKey,
      actor: input.actor,
      action: input.action,
      environment: input.environment,
      startedAt: input.startedAt,
      finishedAt,
      durationMs,
      result: input.result,
      before: input.before,
      after: input.after,
      refs: input.refs,
      code: input.code,
      message: input.message,
    },
    { cwd: input.cwd },
  );
  await recordIdempotency(
    {
      idempotencyKey: input.idempotencyKey,
      actionId: input.actionId,
      action: input.action,
      result: input.result,
      finishedAt,
    },
    { cwd: input.cwd },
  );
  return receipt;
}
