import assert from "node:assert/strict";
import test from "node:test";

import {
  recommendFinanceReconciliation,
  runFinanceAgentTask,
} from "@/lib/agentic/finance-agent";
import { createDefaultToolGateway } from "@/lib/agentic/gateway";
import { financeAgentOrThrow } from "@/lib/agentic/finance-slice";

test("recommendFinanceReconciliation never moves money and structures reasons", () => {
  const result = recommendFinanceReconciliation({
    idempotencyKey: "rec-1",
    paymentId: "pay_r1",
    proofId: "prf_r1",
    proofSource: "CLIENT_UPLOAD",
    authenticated: false,
    reference: "REF-R1",
    amountCents: 1000,
    currency: "USD",
    expectedAmountCents: 1000,
    expectedCurrency: "USD",
  });
  assert.equal(result.moneyMoved, false);
  assert.equal(result.verifiedActivated, false);
  assert.ok(result.structuredReasons.includes("client_proof_path"));
  assert.ok(result.structuredReasons.some((r) => r.startsWith("status:")));
});

test("runFinanceAgentTask handles reconciliation_failed via same recommend path", async () => {
  const gateway = createDefaultToolGateway();
  const agent = financeAgentOrThrow();
  const pending = await runFinanceAgentTask(
    {
      eventType: "payment.reconciliation_failed",
      idempotencyKey: "fail-1",
      paymentId: "pay_f1",
      proofId: "prf_f1",
      proofSource: "CLIENT_UPLOAD",
      authenticated: false,
      reference: "REF-F1",
      amountCents: 2000,
      currency: "USD",
      expectedAmountCents: 2000,
      expectedCurrency: "USD",
    },
    { gateway },
  );
  assert.equal(pending.gateway?.status, "pending_approval");
  assert.deepEqual(pending.structuredReasons, ["awaiting_human_approval"]);

  const done = await runFinanceAgentTask(
    {
      eventType: "payment.reconciliation_failed",
      idempotencyKey: "fail-1",
      paymentId: "pay_f1",
      proofId: "prf_f1",
      proofSource: "CLIENT_UPLOAD",
      authenticated: false,
      reference: "REF-F1",
      amountCents: 2000,
      currency: "USD",
      expectedAmountCents: 2000,
      expectedCurrency: "USD",
      approval: {
        token: "apr_fail_1",
        tool: "payments.reconcile.recommend",
        agentId: agent.id,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    },
    { gateway },
  );
  assert.equal(done.moneyMoved, false);
  assert.equal(done.verifiedActivated, false);
  assert.ok(done.structuredReasons.includes("no_money_moved"));
});
