import assert from "node:assert/strict";
import { test } from "node:test";

import { createPaymentGateway } from "@/lib/payments/gateway";
import { createReconciliationService } from "@/lib/payments/reconciliation";
import {
  adminActivateVerifiedSchema,
  adminReviewResolveSchema,
} from "@/lib/payments/schemas";
import { canAccessAdminPayments } from "@/lib/payments/access";

test("USER cannot resolve HUMAN_REVIEW admin actions", () => {
  assert.equal(canAccessAdminPayments("USER"), false);
  assert.equal(canAccessAdminPayments("ADMIN"), true);
});

test("review resolve and activate schemas validate actions", () => {
  const approve = adminReviewResolveSchema.safeParse({
    decisionId: "dec-1",
    action: "approve",
  });
  assert.equal(approve.success, true);
  const reject = adminReviewResolveSchema.safeParse({
    decisionId: "dec-1",
    action: "reject",
  });
  assert.equal(reject.success, true);
  const bad = adminReviewResolveSchema.safeParse({
    decisionId: "dec-1",
    action: "maybe",
  });
  assert.equal(bad.success, false);
  const activate = adminActivateVerifiedSchema.safeParse({
    paymentId: "pay-1",
  });
  assert.equal(activate.success, true);
});

test("resolveHumanReview approve → VERIFIED ; reject → REJECTED", () => {
  const service = createReconciliationService();
  service.registerClevoneEvent({
    eventKey: "evt-hr",
    paymentId: "pay-hr",
    reference: "REF-HR",
    amountCents: 100,
    currency: "USD",
    authenticated: true,
    source: "CLEVONE_SANDBOX",
  });
  // Force HUMAN_REVIEW via amount mismatch path without client proof.
  const review = service.reconcile({
    idempotencyKey: "hr-1",
    paymentId: "pay-hr",
    expectedAmountCents: 999,
    expectedCurrency: "USD",
  });
  assert.equal(review.status, "HUMAN_REVIEW");
  assert.ok(review.reviewDueAt);

  const approved = service.resolveHumanReview({
    decisionId: review.id,
    action: "approve",
    actorId: "admin-1",
  });
  assert.equal(approved.status, "VERIFIED");
  assert.equal(service.allowsCapture(approved), true);
  assert.equal(approved.reviewDueAt, undefined);
  assert.ok(approved.reasons.includes("admin_human_review_approved"));

  const service2 = createReconciliationService();
  service2.registerClevoneEvent({
    eventKey: "evt-hr2",
    paymentId: "pay-hr2",
    reference: "REF-HR2",
    amountCents: 50,
    currency: "USD",
    authenticated: true,
    source: "CLEVONE_SANDBOX",
  });
  const review2 = service2.reconcile({
    idempotencyKey: "hr-2",
    paymentId: "pay-hr2",
    expectedAmountCents: 1,
    expectedCurrency: "USD",
  });
  const rejected = service2.resolveHumanReview({
    decisionId: review2.id,
    action: "reject",
    actorId: "admin-1",
  });
  assert.equal(rejected.status, "REJECTED");
  assert.equal(service2.allowsCapture(rejected), false);
  assert.ok(rejected.reasons.includes("admin_human_review_rejected"));
});

test("VERIFIED path can activate gateway chain idempotently (not seed settle)", async () => {
  const gateway = createPaymentGateway();
  const { invoice } = await gateway.createOrderWithInvoice({
    serviceCode: "ACT",
    title: "Activation after verify",
    amountCents: 1500,
    currency: "USD",
    idempotencyKey: "act-order-1",
  });
  const linked = await gateway.linkSandboxPayment({
    invoiceId: invoice.id,
    method: "CARD",
    idempotencyKey: "act-pay-1",
  });

  const service = createReconciliationService();
  service.registerClevoneEvent({
    eventKey: "evt-act",
    paymentId: linked.payment.id,
    invoiceId: invoice.id,
    reference: "REF-ACT",
    amountCents: 1500,
    currency: "USD",
    authenticated: true,
    source: "CLEVONE_SANDBOX",
  });
  const decision = service.reconcile({
    idempotencyKey: "act-dec-1",
    paymentId: linked.payment.id,
    invoiceId: invoice.id,
    expectedAmountCents: 1500,
    expectedCurrency: "USD",
  });
  assert.equal(decision.status, "VERIFIED");
  assert.equal(service.allowsCapture(decision), true);

  const first = await gateway.activateFromClevoneEvent({
    idempotencyKey: `activate-verified:${decision.id}`,
    paymentId: linked.payment.id,
  });
  assert.equal(first.order.status, "ACTIVE");
  assert.equal(first.invoice.status, "SETTLED");
  assert.ok(first.receipt?.receiptNumber);

  const second = await gateway.activateFromClevoneEvent({
    idempotencyKey: `activate-verified:${decision.id}`,
    paymentId: linked.payment.id,
  });
  assert.equal(second.receipt?.id, first.receipt?.id);
  assert.equal(second.order.status, "ACTIVE");
});
