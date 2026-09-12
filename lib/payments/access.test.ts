import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canAccessAdminPayments,
  canAccessClientPayments,
} from "@/lib/payments/access";
import { createReconciliationService } from "@/lib/payments/reconciliation";
import {
  adminClevoneEventSchema,
  adminPaymentListQuerySchema,
  adminReconcileSchema,
  adminSandboxCreateSchema,
  paymentProofUploadSchema,
} from "@/lib/payments/schemas";

test("USER cannot access admin payments but can access client surface", () => {
  assert.equal(canAccessAdminPayments("USER"), false);
  assert.equal(canAccessClientPayments("USER"), true);
  assert.equal(canAccessAdminPayments("ADMIN"), true);
  assert.equal(canAccessAdminPayments("SUPER_ADMIN"), true);
});

test("proof upload schema validates paymentId", () => {
  const ok = paymentProofUploadSchema.safeParse({ paymentId: "pay-1" });
  assert.equal(ok.success, true);
  const bad = paymentProofUploadSchema.safeParse({ paymentId: "" });
  assert.equal(bad.success, false);
});

test("admin payment list query schema accepts status filter", () => {
  const all = adminPaymentListQuerySchema.safeParse({});
  assert.equal(all.success, true);
  if (all.success) {
    assert.equal(all.data.status, "ALL");
  }
  const review = adminPaymentListQuerySchema.safeParse({
    status: "HUMAN_REVIEW",
  });
  assert.equal(review.success, true);
  const bad = adminPaymentListQuerySchema.safeParse({ status: "NOPE" });
  assert.equal(bad.success, false);
});

test("admin sandbox create schema defaults are sandbox-safe", () => {
  const parsed = adminSandboxCreateSchema.safeParse({});
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.settle, false);
    assert.equal(parsed.data.method, "CARD");
    assert.ok(parsed.data.amountCents > 0);
  }
});

test("portal proof upload path never elevates to VERIFIED alone", async () => {
  const service = createReconciliationService();
  const proof = await service.storeClientProof({
    paymentId: "pay-portal",
    fileName: "client.png",
    mimeType: "image/png",
    bytes: Buffer.from("client-only"),
    reference: "REF-PORTAL",
    amountCents: 1200,
    currency: "usd",
  });
  const decision = service.reconcile({
    idempotencyKey: `portal-proof:${proof.id}`,
    paymentId: "pay-portal",
    clientProofId: proof.id,
    expectedAmountCents: 1200,
    expectedCurrency: "USD",
  });
  assert.notEqual(decision.status, "VERIFIED");
  assert.equal(service.allowsCapture(decision), false);
  assert.equal(decision.status, "PENDING");
});

test("admin CLEVONE / reconcile schemas are ACL-ready and sandbox-safe", () => {
  const event = adminClevoneEventSchema.safeParse({
    paymentId: "pay-acl",
    reference: "REF-ACL",
    amountCents: 500,
    currency: "USD",
  });
  assert.equal(event.success, true);
  if (event.success) {
    assert.equal(event.data.source, "CLEVONE_SANDBOX");
  }
  const reconcile = adminReconcileSchema.safeParse({ paymentId: "pay-acl" });
  assert.equal(reconcile.success, true);
});
