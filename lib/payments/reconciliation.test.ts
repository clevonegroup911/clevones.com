import assert from "node:assert/strict";
import { test } from "node:test";

import { createReconciliationService } from "@/lib/payments/reconciliation";

test("client proof alone never verifies or allows capture", async () => {
  const service = createReconciliationService();
  const proof = await service.storeClientProof({
    paymentId: "pay-1",
    invoiceId: "inv-1",
    fileName: "receipt.png",
    mimeType: "image/png",
    bytes: Buffer.from("fake-proof"),
    reference: "REF-001",
    amountCents: 5000,
    currency: "usd",
  });
  assert.equal(proof.authenticated, false);
  assert.equal(proof.source, "CLIENT_UPLOAD");
  assert.match(proof.storageKey, /./);
  assert.ok(!proof.storageKey.includes("public/"));

  const decision = service.reconcile({
    idempotencyKey: "dec-1",
    paymentId: "pay-1",
    invoiceId: "inv-1",
    clientProofId: proof.id,
    expectedAmountCents: 5000,
    expectedCurrency: "USD",
  });
  assert.equal(decision.status, "PENDING");
  assert.ok(decision.reasons.includes("client_proof_alone_insufficient"));
  assert.equal(service.allowsCapture(decision), false);
});

test("authenticated CLEVONE event can verify and is idempotent", async () => {
  const service = createReconciliationService();
  service.registerClevoneEvent({
    eventKey: "evt-clevone-1",
    paymentId: "pay-2",
    invoiceId: "inv-2",
    reference: "REF-200",
    amountCents: 2500,
    currency: "cdf",
    authenticated: true,
    source: "CLEVONE_SANDBOX",
  });

  const first = service.reconcile({
    idempotencyKey: "dec-2",
    paymentId: "pay-2",
    invoiceId: "inv-2",
    expectedAmountCents: 2500,
    expectedCurrency: "CDF",
  });
  assert.equal(first.status, "VERIFIED");
  assert.equal(service.allowsCapture(first), true);
  assert.ok(first.reasons.includes("clevone_authenticated_event"));

  const second = service.reconcile({
    idempotencyKey: "dec-2",
    paymentId: "pay-2",
    invoiceId: "inv-2",
    expectedAmountCents: 2500,
    expectedCurrency: "CDF",
  });
  assert.equal(second.id, first.id);
  assert.ok(
    service.store.audit.some((row) => row.action === "RECONCILE_IDEMPOTENT_HIT"),
  );
});

test("amount mismatch with CLEVONE event goes to HUMAN_REVIEW within 24h", async () => {
  const service = createReconciliationService();
  const proof = await service.storeClientProof({
    paymentId: "pay-3",
    invoiceId: "inv-3",
    fileName: "slip.pdf",
    mimeType: "application/pdf",
    bytes: Buffer.from("%PDF-fake"),
    reference: "REF-300",
    amountCents: 1000,
    currency: "usd",
  });
  service.registerClevoneEvent({
    eventKey: "evt-clevone-3",
    paymentId: "pay-3",
    invoiceId: "inv-3",
    reference: "REF-300",
    amountCents: 9999,
    currency: "usd",
    authenticated: true,
    source: "CLEVONE_OFFICIAL",
  });

  const decision = service.reconcile({
    idempotencyKey: "dec-3",
    paymentId: "pay-3",
    invoiceId: "inv-3",
    clientProofId: proof.id,
    expectedAmountCents: 1000,
    expectedCurrency: "USD",
  });
  assert.equal(decision.status, "HUMAN_REVIEW");
  assert.ok(decision.reasons.includes("amount_mismatch"));
  assert.ok(decision.reviewDueAt);
  const due = Date.parse(decision.reviewDueAt);
  const delta = due - Date.now();
  assert.ok(delta > 23 * 60 * 60 * 1000 && delta <= 24 * 60 * 60 * 1000);
  assert.equal(service.allowsCapture(decision), false);
});

test("matching client proof + CLEVONE event verifies; duplicate reference blocked", async () => {
  const service = createReconciliationService();
  const proof = await service.storeClientProof({
    paymentId: "pay-4",
    fileName: "ok.png",
    mimeType: "image/png",
    bytes: Buffer.from("ok"),
    reference: "REF-400",
    amountCents: 4000,
    currency: "usd",
  });
  service.registerClevoneEvent({
    eventKey: "evt-4",
    paymentId: "pay-4",
    reference: "REF-400",
    amountCents: 4000,
    currency: "usd",
    authenticated: true,
    source: "CLEVONE_SANDBOX",
  });
  const verified = service.reconcile({
    idempotencyKey: "dec-4a",
    paymentId: "pay-4",
    clientProofId: proof.id,
    expectedAmountCents: 4000,
    expectedCurrency: "USD",
  });
  assert.equal(verified.status, "VERIFIED");

  const dupProof = await service.storeClientProof({
    paymentId: "pay-5",
    fileName: "dup.png",
    mimeType: "image/png",
    bytes: Buffer.from("dup"),
    reference: "REF-400",
    amountCents: 4000,
    currency: "usd",
  });
  service.registerClevoneEvent({
    eventKey: "evt-5",
    paymentId: "pay-5",
    reference: "REF-400",
    amountCents: 4000,
    currency: "usd",
    authenticated: true,
    source: "CLEVONE_SANDBOX",
  });
  const dup = service.reconcile({
    idempotencyKey: "dec-4b",
    paymentId: "pay-5",
    clientProofId: dupProof.id,
    expectedAmountCents: 4000,
    expectedCurrency: "USD",
  });
  assert.equal(dup.status, "DUPLICATE_SUSPECTED");
});
