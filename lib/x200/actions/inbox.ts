import type {
  HumanActionEnvironment,
  HumanActionItem,
  HumanActionType,
  ActionRisk,
} from "@/lib/x200/actions/types";
import { riskForAction } from "@/lib/x200/actions/policy";
import type {
  GitSnapshot,
  GithubSnapshot,
  HumanGateSnapshot,
  ControlCenterTask,
} from "@/lib/x200/types";

function item(partial: Omit<HumanActionItem, "risk" | "preconditions" | "status"> & {
  risk?: ActionRisk;
  preconditions?: string[];
  status?: HumanActionItem["status"];
}): HumanActionItem {
  return {
    ...partial,
    risk: partial.risk ?? riskForAction(partial.type),
    preconditions: partial.preconditions ?? [],
    status: partial.status ?? "WAITING",
  };
}

/**
 * Derive HUMAN ACTIONS inbox from live Control Center signals.
 * Does not invent production events — only surfaces detectable gates.
 */
export function buildHumanActionInbox(input: {
  humanGate: Pick<
    HumanGateSnapshot,
    "present" | "reason" | "taskId" | "requiredAction" | "createdAt"
  >;
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
  git: Pick<GitSnapshot, "head" | "branch" | "dirty">;
  currentTask: ControlCenterTask | null;
  paymentsLiveAvailable: boolean;
  nowIso?: string;
}): HumanActionItem[] {
  const now = input.nowIso ?? new Date().toISOString();
  const inbox: HumanActionItem[] = [];

  if (input.humanGate.present) {
    inbox.push(
      item({
        id: `gate-${input.humanGate.taskId ?? "unknown"}`,
        type: "APPROVE_HUMAN_GATE",
        environment: "LOCAL",
        reason:
          input.humanGate.reason ??
          input.humanGate.requiredAction ??
          "Human Gate file present",
        blockingTaskId: input.humanGate.taskId,
        requestedBy: "system",
        createdAt: input.humanGate.createdAt ?? now,
        preconditions: [
          "SUPER_ADMIN",
          "Justification required",
          "MFA / re-auth",
          "Never bypass — approval then controlled action",
        ],
        status: "READY",
      }),
    );
  }

  if (
    input.github.status === "OK" &&
    input.github.prNumber != null &&
    input.github.prDraft === true &&
    input.github.ciLatestConclusion === "success"
  ) {
    const taskOk =
      !input.currentTask ||
      input.currentTask.status === "EN_CONTRÔLE" ||
      input.currentTask.status === "TERMINÉE";
    inbox.push(
      item({
        id: `ready-pr-${input.github.prNumber}`,
        type: "MARK_READY_FOR_REVIEW",
        environment: "LOCAL",
        reason: `Draft PR #${input.github.prNumber} with CI success`,
        blockingTaskId: input.currentTask?.id ?? null,
        requestedBy: "system",
        createdAt: now,
        preconditions: [
          "Draft PR",
          "CI SUCCESS",
          taskOk ? "Task EN_CONTRÔLE/TERMINÉE or none" : "Task status blocker",
          "No blockers",
        ],
        status: taskOk ? "READY" : "WAITING",
      }),
    );
  }

  if (
    input.github.status === "OK" &&
    input.github.prNumber != null &&
    input.github.prDraft === false &&
    input.github.prState === "open"
  ) {
    const mergeable = input.github.prMergeable === "MERGEABLE" || input.github.prMergeable === "true";
    const ciOk = input.github.ciLatestConclusion === "success";
    const clean = input.git.dirty === false;
    inbox.push(
      item({
        id: `merge-pr-${input.github.prNumber}`,
        type: "MERGE_PR",
        environment: "LOCAL",
        reason: `PR #${input.github.prNumber} open for merge consideration`,
        blockingTaskId: input.currentTask?.id ?? null,
        requestedBy: "system",
        createdAt: now,
        preconditions: [
          "SUPER_ADMIN",
          "PR open / not draft",
          mergeable ? "mergeable=true" : "mergeable≠true",
          ciOk ? "CI SUCCESS" : "CI not success",
          clean ? "branch clean" : "branch dirty",
          "Exact HEAD known",
          "Explicit approval + MFA",
        ],
        status:
          mergeable && ciOk && clean && input.github.prHeadSha
            ? "READY"
            : "WAITING",
      }),
    );
  }

  // Always surface production-gated actions as WAITING awareness items (not auto-ready).
  const prodAwareness: Array<{
    type: HumanActionType;
    reason: string;
    environment: HumanActionEnvironment;
  }> = [
    {
      type: "DEPLOY_PRODUCTION",
      reason: "Production deploy requires preflight, backup, MFA, typed confirmation",
      environment: "PRODUCTION",
    },
    {
      type: "APPLY_MIGRATION",
      reason: "Production migration requires BACKUP_VERIFIED + approval",
      environment: "PRODUCTION",
    },
    {
      type: "RESTORE_BACKUP",
      reason: "Restore is CRITICAL — double confirmation + MFA",
      environment: "PRODUCTION",
    },
    {
      type: "ROLLBACK",
      reason: "Rollback requires target SHA, DB compatibility, MFA",
      environment: "PRODUCTION",
    },
  ];

  for (const entry of prodAwareness) {
    inbox.push(
      item({
        id: `aware-${entry.type.toLowerCase()}`,
        type: entry.type,
        environment: entry.environment,
        reason: entry.reason,
        blockingTaskId: null,
        requestedBy: "system",
        createdAt: now,
        preconditions: ["X200_PRODUCTION_ACTIONS_ENABLED", "Preflight", "MFA", "Typed phrase"],
        status: "WAITING",
      }),
    );
  }

  if (!input.paymentsLiveAvailable) {
    inbox.push(
      item({
        id: "payment-live-unavailable",
        type: "ENABLE_PAYMENT_LIVE",
        environment: "PRODUCTION",
        reason: "Payment live mode NOT_AVAILABLE — no live provider connected",
        blockingTaskId: null,
        requestedBy: "system",
        createdAt: now,
        preconditions: ["Live PSP credentials", "Webhook verification", "Approval", "MFA"],
        status: "WAITING",
        risk: "CRITICAL",
      }),
    );
  }

  return inbox;
}
