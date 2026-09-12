import assert from "node:assert/strict";
import { test } from "node:test";

import { createPaymentGateway } from "@/lib/payments/gateway";

test("gateway creates order → invoice → linked sandbox payment", async () => {
  const gateway = createPaymentGateway();
  const { order, invoice } = await gateway.createOrderWithInvoice({
    userId: "user-1",
    serviceCode: "CMS_PLAN",
    title: "Plan CMS mensuel",
    amountCents: 5000,
    currency: "usd",
    idempotencyKey: "order-1",
  });

  assert.equal(order.status, "INVOICED");
  assert.equal(invoice.status, "AWAITING_PAYMENT");
  assert.equal(invoice.amountCents, 5000);

  const linked = await gateway.linkSandboxPayment({
    invoiceId: invoice.id,
    method: "CARD",
    idempotencyKey: "pay-1",
  });
  assert.equal(linked.payment.status, "PENDING");
  assert.equal(linked.invoice.paymentId, linked.payment.id);
  assert.equal(linked.payment.metadata.source, "clevone_gateway_sandbox");
});

test("gateway activateFromClevoneEvent is idempotent and settles invoice", async () => {
  const gateway = createPaymentGateway();
  const { invoice } = await gateway.createOrderWithInvoice({
    serviceCode: "DOC_PACK",
    title: "Pack documents",
    amountCents: 2500,
    currency: "cdf",
    idempotencyKey: "order-2",
  });
  const { payment } = await gateway.linkSandboxPayment({
    invoiceId: invoice.id,
    method: "M_PESA",
    idempotencyKey: "pay-2",
  });

  const first = await gateway.activateFromClevoneEvent({
    idempotencyKey: "clevone-evt-1",
    paymentId: payment.id,
  });
  assert.equal(first.order.status, "ACTIVE");
  assert.ok(first.order.activatedAt);
  assert.equal(first.invoice.status, "SETTLED");
  assert.ok(first.receipt);
  assert.equal(first.payment?.status, "CAPTURED");
  assert.ok(
    first.events.some((event) => event.eventType === "SERVICE_ACTIVATED"),
  );
  assert.ok(
    first.events.some((event) => event.eventType === "RECEIPT_ISSUED"),
  );

  const second = await gateway.activateFromClevoneEvent({
    idempotencyKey: "clevone-evt-1",
    paymentId: payment.id,
  });
  assert.equal(second.order.id, first.order.id);
  assert.equal(second.receipt?.id, first.receipt?.id);
  assert.equal(
    [...gateway.store.receipts.values()].length,
    1,
    "receipt must not be duplicated",
  );
  assert.ok(
    gateway.store.audit.some(
      (row) => row.action === "GATEWAY_ACTIVATION_IDEMPOTENT_HIT",
    ),
  );
});

test("gateway order create is idempotent", async () => {
  const gateway = createPaymentGateway();
  const first = await gateway.createOrderWithInvoice({
    serviceCode: "A",
    title: "A",
    amountCents: 100,
    currency: "usd",
    idempotencyKey: "same-key",
  });
  const second = await gateway.createOrderWithInvoice({
    serviceCode: "A",
    title: "A",
    amountCents: 100,
    currency: "usd",
    idempotencyKey: "same-key",
  });
  assert.equal(first.order.id, second.order.id);
  assert.equal(first.invoice.id, second.invoice.id);
  assert.equal(gateway.store.orders.size, 1);
});

test("gateway never requires PSP keys and stays sandbox-only", async () => {
  const gateway = createPaymentGateway();
  assert.equal(gateway.provider.name, "sandbox");
  const { invoice } = await gateway.createOrderWithInvoice({
    serviceCode: "B",
    title: "B",
    amountCents: 300,
    currency: "usd",
    idempotencyKey: "sandbox-check",
  });
  const { payment } = await gateway.linkSandboxPayment({
    invoiceId: invoice.id,
    method: "CARD",
    idempotencyKey: "sandbox-pay",
  });
  assert.match(payment.providerRef, /^sandbox_/);
  assert.equal(payment.metadata.source, "clevone_gateway_sandbox");
  // No env/PSP fields on the chain.
  const chain = await gateway.getChainByOrderId(invoice.orderId);
  assert.ok(chain);
  assert.equal(
    JSON.stringify(chain).includes("sk_live"),
    false,
  );
});
