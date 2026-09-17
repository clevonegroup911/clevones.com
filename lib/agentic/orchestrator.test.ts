import assert from "node:assert/strict";
import test from "node:test";

import { DomainEventLog } from "@/lib/agentic/events";
import { createDefaultToolGateway } from "@/lib/agentic/gateway";
import { financeAgentOrThrow } from "@/lib/agentic/finance-slice";
import {
  classifyBusinessEvent,
  createBusinessOrchestrator,
  runBusinessOrchestration,
} from "@/lib/agentic/orchestrator";

function baseEvent(overrides: {
  eventType: string;
  idempotencyKey: string;
  contentLayer?: "SYSTEM" | "DEVELOPER" | "USER" | "EXTERNAL";
  payload?: Record<string, unknown>;
}) {
  return {
    eventType: overrides.eventType,
    idempotencyKey: overrides.idempotencyKey,
    correlationId: `corr-${overrides.idempotencyKey}`,
    source: "clevone.internal" as const,
    actor: { type: "system" as const, id: "test" },
    risk: "MEDIUM" as const,
    timestamp: new Date().toISOString(),
    payload: overrides.payload ?? {},
    contentLayer: overrides.contentLayer ?? ("SYSTEM" as const),
  };
}

test("classify maps payment.proof_uploaded to finance.reconcile MEDIUM", () => {
  const c = classifyBusinessEvent("payment.proof_uploaded", "EXTERNAL");
  assert.equal(c.taskClass, "finance.reconcile");
  assert.equal(c.risk, "MEDIUM");
  assert.equal(c.contentSensitivity, "confidential");
});

test("unknown event type is HIGH and blocked_pending_human without tool execution", async () => {
  const events = new DomainEventLog();
  const gateway = createDefaultToolGateway();
  const before = gateway.audit.list().length;

  const result = await runBusinessOrchestration(
    {
      event: baseEvent({
        eventType: "invoice.created",
        idempotencyKey: "orch-unknown-1",
        contentLayer: "SYSTEM",
      }),
    },
    { events, gateway },
  );

  assert.equal(result.status, "blocked_pending_human");
  assert.equal(result.classification.risk, "HIGH");
  assert.equal(result.routing, null);
  assert.equal(result.gateway, null);
  assert.equal(result.moneyMoved, false);
  assert.ok(result.steps.some((s) => s.name === "blocked_pending_human" && s.ok));
  assert.equal(gateway.audit.list().length, before);
  assert.ok(events.get("orch-unknown-1"));
});

test("payment.proof_uploaded delegates to finance slice without money movement", async () => {
  const events = new DomainEventLog();
  const gateway = createDefaultToolGateway();
  const agent = financeAgentOrThrow();

  const pending = await runBusinessOrchestration(
    {
      event: baseEvent({
        eventType: "payment.proof_uploaded",
        idempotencyKey: "orch-fin-1",
        contentLayer: "EXTERNAL",
      }),
      finance: {
        paymentId: "pay_o1",
        proofId: "prf_o1",
        proofSource: "CLIENT_UPLOAD",
        authenticated: false,
        reference: "REF-ORCH-1",
        amountCents: 5000,
        currency: "USD",
        expectedAmountCents: 5000,
        expectedCurrency: "USD",
      },
    },
    { events, gateway },
  );

  assert.equal(pending.status, "pending_approval");
  assert.equal(pending.finance?.gateway?.status, "pending_approval");
  assert.equal(pending.moneyMoved, false);

  const done = await runBusinessOrchestration(
    {
      event: baseEvent({
        eventType: "payment.proof_uploaded",
        idempotencyKey: "orch-fin-1",
        contentLayer: "EXTERNAL",
      }),
      finance: {
        paymentId: "pay_o1",
        proofId: "prf_o1",
        proofSource: "CLIENT_UPLOAD",
        authenticated: false,
        reference: "REF-ORCH-1",
        amountCents: 5000,
        currency: "USD",
        expectedAmountCents: 5000,
        expectedCurrency: "USD",
        approval: {
          token: "apr_orch_1",
          tool: "payments.reconcile.recommend",
          agentId: agent.id,
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        },
      },
    },
    { events, gateway },
  );

  assert.equal(done.finance?.eventStatus, "duplicate");
  assert.equal(done.routing?.agent?.id, "CLEVONE_FINANCE_AGENT");
  assert.equal(done.finance?.gateway?.status, "executed");
  assert.equal(done.moneyMoved, false);
  assert.equal(done.finance?.verifiedActivated, false);
  assert.ok(done.steps.map((s) => s.name).includes("classify"));
  assert.ok(done.steps.map((s) => s.name).includes("select"));
  assert.ok(done.steps.map((s) => s.name).includes("execute"));
  assert.ok(done.steps.map((s) => s.name).includes("verify"));
  assert.ok(done.steps.map((s) => s.name).includes("audit"));
});

test("document.uploaded selects DMS agent and classifies with approval", async () => {
  const gateway = createDefaultToolGateway();
  const pending = await runBusinessOrchestration(
    {
      event: baseEvent({
        eventType: "document.uploaded",
        idempotencyKey: "orch-doc-1",
        contentLayer: "SYSTEM",
        payload: { documentId: "doc_1", title: "Policy" },
      }),
    },
    { gateway },
  );

  assert.equal(pending.classification.taskClass, "documents.classify");
  assert.equal(pending.routing?.agent?.id, "CLEVONE_DMS_AGENT");
  assert.equal(pending.gateway?.status, "pending_approval");
  assert.equal(pending.status, "pending_approval");
  assert.equal(pending.moneyMoved, false);

  const done = await runBusinessOrchestration(
    {
      event: baseEvent({
        eventType: "document.uploaded",
        idempotencyKey: "orch-doc-1",
        contentLayer: "SYSTEM",
        payload: { documentId: "doc_1", title: "Policy" },
      }),
      approval: {
        token: "apr_orch_dms_1",
        tool: "documents.classify",
        agentId: "CLEVONE_DMS_AGENT",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    },
    { gateway },
  );
  assert.equal(done.gateway?.status, "executed");
  assert.equal(done.gateway?.code, "DOCUMENT_CLASSIFY");
  assert.equal(done.status, "completed");
  assert.equal(done.gateway?.output?.contentEchoed, false);
});

test("idempotent conflict returns conflict status", async () => {
  const events = new DomainEventLog();
  const orch = createBusinessOrchestrator({ events });
  const first = await orch.run({
    event: baseEvent({
      eventType: "document.uploaded",
      idempotencyKey: "orch-idem-1",
      payload: { documentId: "a" },
    }),
  });
  assert.ok(first.status === "pending_approval" || first.status === "completed");

  const second = await orch.run({
    event: baseEvent({
      eventType: "document.uploaded",
      idempotencyKey: "orch-idem-1",
      payload: { documentId: "b" },
    }),
  });
  assert.equal(second.status, "conflict");
});

test("task.completed routes admin agent; LOW tools still need approval for admin limits", async () => {
  const result = await runBusinessOrchestration({
    event: baseEvent({
      eventType: "task.completed",
      idempotencyKey: "orch-admin-1",
      contentLayer: "SYSTEM",
    }),
  });
  assert.equal(result.classification.risk, "LOW");
  assert.equal(result.routing?.agent?.id, "CLEVONE_ADMIN_AGENT");
  assert.equal(result.gateway?.status, "pending_approval");
  assert.equal(result.status, "pending_approval");
  assert.equal(result.moneyMoved, false);
});
