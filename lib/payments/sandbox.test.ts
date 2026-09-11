import assert from "node:assert/strict";
import { test } from "node:test";

import { createSandboxPaymentProvider } from "@/lib/payments/sandbox";

test("sandbox createPayment is idempotent", async () => {
  const provider = createSandboxPaymentProvider();
  const first = await provider.createPayment({
    amountCents: 1500,
    currency: "usd",
    method: "CARD",
    idempotencyKey: "key-1",
  });
  const second = await provider.createPayment({
    amountCents: 1500,
    currency: "usd",
    method: "CARD",
    idempotencyKey: "key-1",
  });
  assert.equal(first.id, second.id);
  assert.equal(provider.store.payments.size, 1);
  assert.ok(
    provider.store.audit.some((row) => row.action === "PAYMENT_IDEMPOTENT_HIT"),
  );
});

test("sandbox supports M_PESA and webhook status updates", async () => {
  const provider = createSandboxPaymentProvider();
  const payment = await provider.createPayment({
    amountCents: 2500,
    currency: "cdf",
    method: "M_PESA",
    idempotencyKey: "mpesa-1",
  });
  assert.equal(payment.method, "M_PESA");
  assert.equal(payment.status, "PENDING");

  const event = await provider.handleWebhook(
    JSON.stringify({ paymentId: payment.id, status: "CAPTURED", type: "payment.captured" }),
    "sandbox-signature",
  );
  assert.equal(event.paymentId, payment.id);
  const updated = await provider.getPayment(payment.id);
  assert.equal(updated?.status, "CAPTURED");
});

test("sandbox rejects invalid webhook signature marker", async () => {
  const provider = createSandboxPaymentProvider();
  const payment = await provider.createPayment({
    amountCents: 100,
    currency: "usd",
    method: "CARD",
    idempotencyKey: "sig-1",
  });
  await assert.rejects(
    () =>
      provider.handleWebhook(
        JSON.stringify({ paymentId: payment.id, status: "FAILED" }),
        "not-sandbox",
      ),
    /invalid_webhook_signature/,
  );
});
