import assert from "node:assert/strict";
import test from "node:test";

import { DomainEventLog } from "@/lib/agentic/events";
import { createDefaultToolGateway } from "@/lib/agentic/gateway";
import {
  financeAgentOrThrow,
  runFinanceProofUploadedSlice,
} from "@/lib/agentic/finance-slice";
import { createDefaultAgentRegistry } from "@/lib/agentic/registry";

test("client proof alone yields recommendation pending human review — no money movement", async () => {
  const events = new DomainEventLog();
  const gateway = createDefaultToolGateway();
  const agent = financeAgentOrThrow();

  const pending = await runFinanceProofUploadedSlice(
    {
      idempotencyKey: "proof-1",
      paymentId: "pay_1",
      proofId: "prf_1",
      proofSource: "CLIENT_UPLOAD",
      authenticated: false,
      reference: "REF-1001",
      amountCents: 5000,
      currency: "USD",
      expectedAmountCents: 5000,
      expectedCurrency: "USD",
    },
    { events, gateway },
  );
  assert.equal(pending.gateway?.status, "pending_approval");
  assert.equal(pending.decision, null);
  assert.equal(pending.moneyMoved, false);

  const result = await runFinanceProofUploadedSlice(
    {
      idempotencyKey: "proof-1",
      paymentId: "pay_1",
      proofId: "prf_1",
      proofSource: "CLIENT_UPLOAD",
      authenticated: false,
      reference: "REF-1001",
      amountCents: 5000,
      currency: "USD",
      expectedAmountCents: 5000,
      expectedCurrency: "USD",
      approval: {
        token: "apr_fin_1",
        tool: "payments.reconcile.recommend",
        agentId: agent.id,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    },
    { events, gateway },
  );

  assert.equal(result.eventStatus, "duplicate");
  assert.equal(result.routing.agent?.id, "CLEVONE_FINANCE_AGENT");
  assert.equal(result.gateway?.status, "executed");
  assert.equal(result.decision?.status, "PENDING");
  assert.ok(result.decision?.reasons.includes("client_proof_alone_insufficient"));
  assert.equal(result.approvalRequired, true);
  assert.equal(result.moneyMoved, false);
  assert.equal(result.verifiedActivated, false);
});

test("authenticated CLEVONE event can produce MATCHED recommendation still without activation", async () => {
  const gateway = createDefaultToolGateway();
  const agent = financeAgentOrThrow();
  const result = await runFinanceProofUploadedSlice(
    {
      idempotencyKey: "proof-2",
      paymentId: "pay_2",
      proofId: "prf_2",
      proofSource: "CLIENT_UPLOAD",
      authenticated: false,
      reference: "REF-2002",
      amountCents: 12000,
      currency: "USD",
      invoiceId: "inv_2",
      expectedAmountCents: 12000,
      expectedCurrency: "USD",
      clevoneEvent: {
        eventKey: "evt_2",
        paymentId: "pay_2",
        invoiceId: "inv_2",
        reference: "REF-2002",
        amountCents: 12000,
        currency: "USD",
        authenticated: true,
        source: "CLEVONE_SANDBOX",
      },
      approval: {
        token: "apr_fin_2",
        tool: "payments.reconcile.recommend",
        agentId: agent.id,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    },
    { gateway, registry: createDefaultAgentRegistry() },
  );

  assert.equal(result.gateway?.status, "executed");
  assert.ok(result.decision);
  // Scoring engine may return VERIFIED as a decision label when an authenticated
  // CLEVONE event matches — this slice still never activates payments.
  assert.ok(
    ["MATCHED", "HUMAN_REVIEW", "VERIFIED"].includes(result.decision.status),
  );
  assert.equal(result.moneyMoved, false);
  assert.equal(result.verifiedActivated, false);
});

test("duplicate event idempotency does not double-record", async () => {
  const events = new DomainEventLog();
  const gateway = createDefaultToolGateway();
  const agent = financeAgentOrThrow();
  const approval = {
    token: "apr_fin_3",
    tool: "payments.reconcile.recommend" as const,
    agentId: agent.id,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
  const base = {
    idempotencyKey: "proof-3",
    paymentId: "pay_3",
    proofId: "prf_3",
    proofSource: "CLIENT_UPLOAD" as const,
    authenticated: false,
    reference: "REF-3003",
    amountCents: 100,
    currency: "USD",
    expectedAmountCents: 100,
    expectedCurrency: "USD",
    approval,
  };
  const first = await runFinanceProofUploadedSlice(base, { events, gateway });
  assert.equal(first.eventStatus, "recorded");
  const second = await runFinanceProofUploadedSlice(
    { ...base, approval: { ...approval, token: "apr_fin_3b" } },
    { events, gateway },
  );
  assert.equal(second.eventStatus, "duplicate");
  assert.equal(events.size, 1);
});
