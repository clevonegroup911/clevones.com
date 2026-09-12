import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canAccessAdminPayments,
  canAccessClientPayments,
} from "@/lib/payments/access";
import { createReconciliationService } from "@/lib/payments/reconciliation";
import { paymentProofUploadSchema } from "@/lib/payments/schemas";

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
});
