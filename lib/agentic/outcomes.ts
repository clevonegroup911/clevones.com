import type { BusinessOrchestrationResult } from "@/lib/agentic/orchestrator";
import type { CommercialQualifyResult } from "@/lib/agentic/commercial-agent";
import type { DmsClassifyResult } from "@/lib/agentic/dms-agent";
import type { FinanceSliceResult } from "@/lib/agentic/finance-slice";

export const AGENTIC_OUTCOME_CODES = [
  "invoice_reconciled_candidate",
  "finance_pending_human",
  "lead_qualified_candidate",
  "lead_pending_human",
  "document_classified",
  "document_pending_human",
  "orchestration_blocked",
  "orchestration_denied",
  "noop",
] as const;

export type AgenticOutcomeCode = (typeof AGENTIC_OUTCOME_CODES)[number];

export type AgenticOutcome = {
  code: AgenticOutcomeCode;
  source: "finance" | "commercial" | "dms" | "orchestration";
  moneyMoved: false;
  emailSent: false;
  exported: false;
  detail: string;
};

export function deriveFinanceOutcome(result: FinanceSliceResult): AgenticOutcome {
  const base = {
    moneyMoved: false as const,
    emailSent: false as const,
    exported: false as const,
    source: "finance" as const,
  };
  if (result.moneyMoved) {
    // Defensive: finance path must never report money movement.
    return { ...base, code: "finance_pending_human", detail: "invariant_money_moved" };
  }
  if (result.approvalRequired || result.gateway?.status === "pending_approval") {
    return { ...base, code: "finance_pending_human", detail: result.decision?.status ?? "pending" };
  }
  if (result.decision?.status === "MATCHED" || result.decision?.status === "VERIFIED") {
    return {
      ...base,
      code: "invoice_reconciled_candidate",
      detail: result.decision.status,
    };
  }
  return { ...base, code: "finance_pending_human", detail: result.decision?.status ?? "no_decision" };
}

export function deriveCommercialOutcome(result: CommercialQualifyResult): AgenticOutcome {
  const base = {
    moneyMoved: false as const,
    emailSent: false as const,
    exported: false as const,
    source: "commercial" as const,
  };
  if (result.emailSent || result.mailQueued) {
    return { ...base, code: "lead_pending_human", detail: "invariant_email" };
  }
  if (result.approvalRequired || result.gatewayDraft?.status === "pending_approval") {
    return { ...base, code: "lead_pending_human", detail: result.qualification };
  }
  if (result.qualification === "WARM" || result.qualification === "HOT") {
    return { ...base, code: "lead_qualified_candidate", detail: result.qualification };
  }
  return { ...base, code: "lead_pending_human", detail: result.qualification };
}

export function deriveDmsOutcome(result: DmsClassifyResult): AgenticOutcome {
  const base = {
    moneyMoved: false as const,
    emailSent: false as const,
    exported: false as const,
    source: "dms" as const,
  };
  if (result.contentEchoed || result.bytesEchoed || result.exported) {
    return { ...base, code: "document_pending_human", detail: "invariant_leak" };
  }
  if (result.approvalRequired || result.gatewayClassify?.status === "pending_approval") {
    return { ...base, code: "document_pending_human", detail: result.label ?? "pending" };
  }
  if (result.label && result.label !== "UNCLASSIFIED") {
    return { ...base, code: "document_classified", detail: result.label };
  }
  return { ...base, code: "document_pending_human", detail: result.label ?? "unclassified" };
}

export function deriveOrchestrationOutcome(
  result: BusinessOrchestrationResult,
): AgenticOutcome {
  const base = {
    moneyMoved: false as const,
    emailSent: false as const,
    exported: false as const,
    source: "orchestration" as const,
  };
  if (result.moneyMoved) {
    return { ...base, code: "orchestration_blocked", detail: "invariant_money" };
  }
  if (result.status === "blocked_pending_human") {
    return { ...base, code: "orchestration_blocked", detail: result.classification.risk };
  }
  if (result.status === "denied") {
    return { ...base, code: "orchestration_denied", detail: result.classification.taskClass };
  }
  if (result.finance) {
    return deriveFinanceOutcome(result.finance);
  }
  if (result.status === "pending_approval") {
    return { ...base, code: "noop", detail: "pending_approval" };
  }
  if (result.status === "completed") {
    return { ...base, code: "noop", detail: result.classification.taskClass };
  }
  return { ...base, code: "noop", detail: result.status };
}
