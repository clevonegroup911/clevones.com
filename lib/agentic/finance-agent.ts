import type { DomainEventLog } from "@/lib/agentic/events";
import type { ToolGateway, ToolGatewayApproval } from "@/lib/agentic/gateway";
import type { AgentRegistry } from "@/lib/agentic/registry";
import type { FinanceSliceInput, FinanceSliceResult } from "@/lib/agentic/finance-slice";
import {
  createReconciliationService,
  type ClevoneOfficialEvent,
  type PaymentProofRecord,
  type ReconciliationDecisionRecord,
} from "@/lib/payments/reconciliation";

export type FinanceRecommendInput = {
  idempotencyKey: string;
  paymentId: string;
  proofId: string;
  proofSource: "CLIENT_UPLOAD" | "CLEVONE_SANDBOX" | "CLEVONE_OFFICIAL";
  authenticated: boolean;
  reference?: string;
  amountCents?: number;
  currency?: string;
  invoiceId?: string;
  clevoneEvent?: ClevoneOfficialEvent;
  expectedAmountCents: number;
  expectedCurrency: string;
};

export type FinanceRecommendResult = {
  decision: ReconciliationDecisionRecord;
  structuredReasons: string[];
  moneyMoved: false;
  verifiedActivated: false;
};

function syntheticProof(input: FinanceRecommendInput): PaymentProofRecord {
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
 * Deterministic recommendation scorer used by the Finance Agent worker.
 * Never activates VERIFIED or moves money.
 */
export function recommendFinanceReconciliation(
  input: FinanceRecommendInput,
): FinanceRecommendResult {
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

  const structuredReasons = [
    ...decision.reasons,
    `status:${decision.status}`,
    input.clevoneEvent ? "has_clevone_event" : "client_proof_path",
    input.authenticated ? "authenticated_proof" : "unauthenticated_proof",
  ];

  return {
    decision,
    structuredReasons,
    moneyMoved: false,
    verifiedActivated: false,
  };
}

export type FinanceAgentTaskInput = FinanceSliceInput & {
  eventType?: "payment.proof_uploaded" | "payment.reconciliation_failed";
};

/**
 * Finance Agent worker entry: proof_uploaded and reconciliation_failed share recommend-only path.
 */
export async function runFinanceAgentTask(
  input: FinanceAgentTaskInput,
  options?: {
    events?: DomainEventLog;
    registry?: AgentRegistry;
    gateway?: ToolGateway;
  },
): Promise<FinanceSliceResult & { structuredReasons: string[] }> {
  const eventType = input.eventType ?? "payment.proof_uploaded";
  void eventType;

  const { runFinanceProofUploadedSlice } = await import("@/lib/agentic/finance-slice");
  const slice = await runFinanceProofUploadedSlice(input, options);
  const structuredReasons =
    slice.decision != null
      ? [
          ...slice.decision.reasons,
          `status:${slice.decision.status}`,
          "no_money_moved",
        ]
      : slice.gateway?.status === "pending_approval"
        ? ["awaiting_human_approval"]
        : ["no_decision"];

  return {
    ...slice,
    moneyMoved: false,
    verifiedActivated: false,
    structuredReasons,
  };
}

export type { ToolGatewayApproval };
