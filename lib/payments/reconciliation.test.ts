import assert from "node:assert/strict";
import { test } from "node:test";

import { reconcilePayment } from "@/lib/payments/reconciliation";

const clientProof = {
  source: "CLIENT_UPLOAD" as const,
  reference: "DIB16FDFOBB",
  amountCents: 55_000,
  currency: "USD",
  invoiceRef: "CLV-2026-00124",
  payerRef: "+243818888695",
  authenticated: false,
};

test("client proof alone never verifies a payment", () => {
  const result = reconcilePayment({
    clientEvidence: clientProof,
    systemEvents: [],
  });

  assert.equal(result.status, "PENDING_VERIFICATION");
  assert.equal(result.score, 0);
});

test("matching authenticated M-PESA notification verifies payment", () => {
  const result = reconcilePayment({
    clientEvidence: clientProof,
    systemEvents: [
      {
        source: "M_PESA_SMS",
        reference: "DIB16FDFOBB",
        amountCents: 55_000,
        currency: "usd",
        invoiceRef: "CLV-2026-00124",
        payerRef: "+243818888695",
        authenticated: true,
      },
    ],
  });

  assert.equal(result.status, "VERIFIED");
  assert.ok(result.score >= 90);
  assert.equal(result.matchedEventSource, "M_PESA_SMS");
});

test("matching RAWBANK email notification verifies payment", () => {
  const result = reconcilePayment({
    clientEvidence: {
      ...clientProof,
      reference: "1590026300057",
      amountCents: 171_105_80,
      currency: "CDF",
    },
    systemEvents: [
      {
        source: "RAWBANK_EMAIL",
        reference: "1590026300057",
        amountCents: 171_105_80,
        currency: "CDF",
        invoiceRef: "CLV-2026-00124",
        authenticated: true,
      },
    ],
  });

  assert.equal(result.status, "VERIFIED");
  assert.equal(result.matchedEventSource, "RAWBANK_EMAIL");
});

test("amount mismatch requires human review", () => {
  const result = reconcilePayment({
    clientEvidence: clientProof,
    systemEvents: [
      {
        source: "M_PESA_SMS",
        reference: "DIB16FDFOBB",
        amountCents: 54_000,
        currency: "USD",
        invoiceRef: "CLV-2026-00124",
        authenticated: true,
      },
    ],
  });

  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.ok(result.reasons.includes("amount_mismatch"));
});

test("previously verified reference is blocked as duplicate", () => {
  const result = reconcilePayment({
    clientEvidence: clientProof,
    systemEvents: [],
    previouslyVerifiedReferences: ["dib16fdfobb"],
  });

  assert.equal(result.status, "DUPLICATE_SUSPECTED");
  assert.ok(result.reasons.includes("reference_already_verified"));
});

test("unauthenticated forwarded notification cannot verify payment", () => {
  const result = reconcilePayment({
    clientEvidence: clientProof,
    systemEvents: [
      {
        source: "RAWBANK_EMAIL",
        reference: "DIB16FDFOBB",
        amountCents: 55_000,
        currency: "USD",
        invoiceRef: "CLV-2026-00124",
        authenticated: false,
      },
    ],
  });

  assert.equal(result.status, "PENDING_VERIFICATION");
});
