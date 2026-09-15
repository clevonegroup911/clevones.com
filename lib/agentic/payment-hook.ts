import { runFinanceAgentTask } from "@/lib/agentic/finance-agent";
import type { FinanceSliceResult } from "@/lib/agentic/finance-slice";

export type AgenticProofRecommendHookInput = {
  paymentId: string;
  proofId: string;
  invoiceId?: string;
  reference?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  expectedAmountCents: number;
  expectedCurrency: string;
  /** Override for tests; production uses AGENTIC_PROOF_RECOMMEND_HOOK=1 */
  enabled?: boolean;
};

export type AgenticProofRecommendHookResult = {
  ran: boolean;
  skippedReason: string | null;
  finance: FinanceSliceResult | null;
  moneyMoved: false;
  verifiedActivated: false;
};

/**
 * Optional recommend-only hook after a client proof is stored.
 * Disabled unless AGENTIC_PROOF_RECOMMEND_HOOK=1 (or enabled:true in tests).
 * Never activates VERIFIED and never moves money.
 */
export async function maybeRunAgenticProofRecommend(
  input: AgenticProofRecommendHookInput,
): Promise<AgenticProofRecommendHookResult> {
  const enabled =
    input.enabled
    ?? process.env.AGENTIC_PROOF_RECOMMEND_HOOK === "1";

  if (!enabled) {
    return {
      ran: false,
      skippedReason: "HOOK_DISABLED",
      finance: null,
      moneyMoved: false,
      verifiedActivated: false,
    };
  }

  const finance = await runFinanceAgentTask({
    eventType: "payment.proof_uploaded",
    idempotencyKey: `agentic-hook:${input.proofId}`,
    paymentId: input.paymentId,
    proofId: input.proofId,
    proofSource: "CLIENT_UPLOAD",
    authenticated: false,
    reference: input.reference ?? undefined,
    amountCents: input.amountCents ?? undefined,
    currency: input.currency ?? undefined,
    invoiceId: input.invoiceId,
    expectedAmountCents: input.expectedAmountCents,
    expectedCurrency: input.expectedCurrency,
  });

  return {
    ran: true,
    skippedReason: null,
    finance: {
      ...finance,
      moneyMoved: false,
      verifiedActivated: false,
    },
    moneyMoved: false,
    verifiedActivated: false,
  };
}
