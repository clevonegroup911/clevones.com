import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isReconcileClevoneEventType,
  parseClevoneReconcilePayload,
  reconcileEventTypeForSource,
} from "@/lib/payments/clevone-events";
import { createReconciliationService } from "@/lib/payments/reconciliation";
import {
  adminClevoneEventSchema,
  adminReconcileSchema,
} from "@/lib/payments/schemas";

test("admin CLEVONE event schema defaults to sandbox source", () => {
  const parsed = adminClevoneEventSchema.safeParse({
    paymentId: "pay-1",
    reference: "REF-1",
    amountCents: 1000,
    currency: "usd",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.source, "CLEVONE_SANDBOX");
    assert.equal(parsed.data.currency, "usd");
  }
  const bad = adminClevoneEventSchema.safeParse({
    paymentId: "pay-1",
    reference: "",
    amountCents: 1000,
    currency: "USD",
  });
  assert.equal(bad.success, false);
});

test("admin reconcile schema requires paymentId", () => {
  const ok = adminReconcileSchema.safeParse({ paymentId: "pay-9" });
  assert.equal(ok.success, true);
  const bad = adminReconcileSchema.safeParse({});
  assert.equal(bad.success, false);
});

test("reconcile event type helpers map sources", () => {
  assert.equal(
    reconcileEventTypeForSource("CLEVONE_SANDBOX"),
    "RECONCILE_CLEVONE_SANDBOX",
  );
  assert.equal(isReconcileClevoneEventType("PAYMENT_CAPTURED"), false);
  assert.equal(isReconcileClevoneEventType("RECONCILE_CLEVONE_OFFICIAL"), true);
  const payload = parseClevoneReconcilePayload({
    reference: "R1",
    amountCents: 50,
    currency: "cdf",
    source: "CLEVONE_SANDBOX",
    authenticated: true,
  });
  assert.ok(payload);
  assert.equal(payload?.currency, "CDF");
  assert.equal(parseClevoneReconcilePayload({ authenticated: false }), null);
});

test("hydratePersistedState enables VERIFIED after reload; client alone stays PENDING", async () => {
  const writer = createReconciliationService();
  const proof = await writer.storeClientProof({
    paymentId: "pay-hydrate",
    invoiceId: "inv-hydrate",
    fileName: "p.png",
    mimeType: "image/png",
    bytes: Buffer.from("hydrate"),
    reference: "REF-HYD",
    amountCents: 2200,
    currency: "usd",
  });
  writer.registerClevoneEvent({
    eventKey: "evt-hydrate",
    paymentId: "pay-hydrate",
    invoiceId: "inv-hydrate",
    reference: "REF-HYD",
    amountCents: 2200,
    currency: "usd",
    authenticated: true,
    source: "CLEVONE_SANDBOX",
  });

  const alone = createReconciliationService();
  alone.hydratePersistedState({
    proofs: [proof],
    events: [],
    decisions: [],
  });
  const pending = alone.reconcile({
    idempotencyKey: "hyd-alone",
    paymentId: "pay-hydrate",
    invoiceId: "inv-hydrate",
    clientProofId: proof.id,
    expectedAmountCents: 2200,
    expectedCurrency: "USD",
  });
  assert.equal(pending.status, "PENDING");
  assert.equal(alone.allowsCapture(pending), false);

  const reloaded = createReconciliationService();
  reloaded.hydratePersistedState({
    proofs: [proof],
    events: [
      {
        eventKey: "evt-hydrate",
        paymentId: "pay-hydrate",
        invoiceId: "inv-hydrate",
        reference: "REF-HYD",
        amountCents: 2200,
        currency: "usd",
        authenticated: true,
        source: "CLEVONE_SANDBOX",
      },
    ],
    decisions: [],
  });
  const verified = reloaded.reconcile({
    idempotencyKey: "hyd-match",
    paymentId: "pay-hydrate",
    invoiceId: "inv-hydrate",
    clientProofId: proof.id,
    expectedAmountCents: 2200,
    expectedCurrency: "USD",
  });
  assert.equal(verified.status, "VERIFIED");
  assert.equal(reloaded.allowsCapture(verified), true);

  const mismatchStore = createReconciliationService();
  mismatchStore.hydratePersistedState({
    proofs: [proof],
    events: [
      {
        eventKey: "evt-mismatch",
        paymentId: "pay-hydrate",
        invoiceId: "inv-hydrate",
        reference: "REF-HYD",
        amountCents: 9999,
        currency: "usd",
        authenticated: true,
        source: "CLEVONE_SANDBOX",
      },
    ],
  });
  const review = mismatchStore.reconcile({
    idempotencyKey: "hyd-mismatch",
    paymentId: "pay-hydrate",
    invoiceId: "inv-hydrate",
    clientProofId: proof.id,
    expectedAmountCents: 2200,
    expectedCurrency: "USD",
  });
  assert.equal(review.status, "HUMAN_REVIEW");
  assert.ok(review.reviewDueAt);
  const due = Date.parse(review.reviewDueAt);
  assert.ok(due - Date.now() <= 24 * 60 * 60 * 1000);
});
