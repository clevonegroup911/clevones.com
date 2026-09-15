import { DomainEventLog } from "@/lib/agentic/events";
import {
  createDefaultToolGateway,
  type ToolGateway,
  type ToolGatewayApproval,
  type ToolInvokeResult,
} from "@/lib/agentic/gateway";
import { proofUploadedEnvelope } from "@/lib/agentic/payment-events";
import {
  createDefaultAgentRegistry,
  type AgentRegistry,
} from "@/lib/agentic/registry";
import type { AgentDefinition, AgentRoutingDecision } from "@/lib/agentic/types";
import {
  createReconciliationService,
  type PaymentProofRecord,
  type ReconciliationDecisionRecord,
  type ClevoneOfficialEvent,
} from "@/lib/payments/reconciliation";

export type FinanceSliceInput = {
  idempotencyKey: string;
  paymentId: string;
  proofId: string;
  proofSource: "CLIENT_UPLOAD" | "CLEVONE_SANDBOX" | "CLEVONE_OFFICIAL";
  authenticated: boolean;
  reference?: string;
  amountCents?: number;
  currency?: string;
  invoiceId?: string;
  /** Optional official/sandbox event for scoring — never invents VERIFIED alone. */
  clevoneEvent?: ClevoneOfficialEvent;
  expectedAmountCents: number;
  expectedCurrency: string;
  /** Required when recommend tool needs MEDIUM approval. */
  approval?: ToolGatewayApproval | null;
};

export type FinanceSliceResult = {
  eventStatus: "recorded" | "duplicate" | "conflict";
  correlationId: string;
  routing: AgentRoutingDecision;
  gateway: ToolInvokeResult | null;
  decision: ReconciliationDecisionRecord | null;
  approvalRequired: boolean;
  moneyMoved: false;
  verifiedActivated: false;
};

function syntheticProof(input: FinanceSliceInput): PaymentProofRecord {
  return {
    id: input.proofId,
    paymentId: input.paymentId,
    invoiceId: input.invoiceId,
    source: input.proofSource,
    storageKey: `agentic/synthetic/${input.proofId}`,
    fileName: "proof.stub",
    mimeType: "application/octet-stream",
    sizeBytes: 0,
    checksumSha256: "0".repeat(64),
    reference: input.reference,
    amountCents: input.amountCents,
    currency: input.currency?.toUpperCase(),
    authenticated: input.authenticated,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Vertical slice: payment.proof_uploaded → select finance agent → recommend.
 * Does not call persist/activation. Never moves money.
 */
export async function runFinanceProofUploadedSlice(
  input: FinanceSliceInput,
  options?: {
    events?: DomainEventLog;
    registry?: AgentRegistry;
    gateway?: ToolGateway;
  },
): Promise<FinanceSliceResult> {
  const events = options?.events ?? new DomainEventLog();
  const registry = options?.registry ?? createDefaultAgentRegistry();
  const gateway = options?.gateway ?? createDefaultToolGateway();

  const envelopeInput = proofUploadedEnvelope({
    idempotencyKey: input.idempotencyKey,
    paymentId: input.paymentId,
    proofId: input.proofId,
    source: input.proofSource,
    authenticated: input.authenticated,
  });
  const recorded = events.record(envelopeInput);
  if (recorded.status === "conflict") {
    return {
      eventStatus: "conflict",
      correlationId: recorded.event.correlationId,
      routing: { agent: null, reason: "EVENT_CONFLICT", approvalRequired: true, rejected: [] },
      gateway: null,
      decision: null,
      approvalRequired: true,
      moneyMoved: false,
      verifiedActivated: false,
    };
  }

  const routing = registry.select({
    taskType: "payment.proof_uploaded",
    requiredCapabilities: ["extract", "reconcile"],
    requiredTools: ["payments.reconcile.recommend"],
    risk: "MEDIUM",
    contentSensitivity: input.proofSource === "CLIENT_UPLOAD" ? "confidential" : "internal",
    contentLayer: envelopeInput.contentLayer,
  });

  const agent = routing.agent;
  if (!agent) {
    return {
      eventStatus: recorded.status,
      correlationId: recorded.event.correlationId,
      routing,
      gateway: null,
      decision: null,
      approvalRequired: true,
      moneyMoved: false,
      verifiedActivated: false,
    };
  }

  const gatewayResult = await gateway.invoke({
    agent,
    tool: "payments.reconcile.recommend",
    correlationId: recorded.event.correlationId,
    approval: input.approval ?? null,
    input: {
      paymentId: input.paymentId,
      proofId: input.proofId,
      reference: input.reference ?? null,
      amountCents: input.amountCents ?? null,
      currency: input.currency ?? null,
    },
  });

  if (gatewayResult.status !== "executed") {
    return {
      eventStatus: recorded.status,
      correlationId: recorded.event.correlationId,
      routing,
      gateway: gatewayResult,
      decision: null,
      approvalRequired: true,
      moneyMoved: false,
      verifiedActivated: false,
    };
  }

  const reconciliation = createReconciliationService();
  reconciliation.hydratePersistedState({
    proofs: [syntheticProof(input)],
    events: input.clevoneEvent ? [input.clevoneEvent] : [],
  });
  const decision = reconciliation.reconcile({
    idempotencyKey: `agentic:${input.idempotencyKey}`,
    paymentId: input.paymentId,
    invoiceId: input.invoiceId,
    clientProofId: input.proofId,
    expectedAmountCents: input.expectedAmountCents,
    expectedCurrency: input.expectedCurrency,
  });

  const approvalRequired =
    decision.status === "HUMAN_REVIEW"
    || decision.status === "PENDING"
    || decision.status === "DUPLICATE_SUSPECTED"
    || decision.status === "REJECTED"
    || routing.approvalRequired
    || gatewayResult.evaluation.approval_required;

  return {
    eventStatus: recorded.status,
    correlationId: recorded.event.correlationId,
    routing,
    gateway: gatewayResult,
    decision,
    approvalRequired,
    moneyMoved: false,
    verifiedActivated: false,
  };
}

export function financeAgentOrThrow(registry = createDefaultAgentRegistry()): AgentDefinition {
  const agent = registry.get("CLEVONE_FINANCE_AGENT");
  if (!agent) {
    throw new Error("CLEVONE_FINANCE_AGENT missing");
  }
  return agent;
}
