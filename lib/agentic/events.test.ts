import assert from "node:assert/strict";
import test from "node:test";

import {
  DomainEventConflictError,
  DomainEventLog,
  digestPayload,
  isDomainEventType,
} from "@/lib/agentic/events";
import { envelopeFromClevoneGatewayEvent } from "@/lib/agentic/payment-events";

test("known business event types include payment.proof_uploaded", () => {
  assert.equal(isDomainEventType("payment.proof_uploaded"), true);
  assert.equal(isDomainEventType("not.a.real.event"), false);
});

test("same idempotencyKey + same payload is duplicate, no second effect", () => {
  const log = new DomainEventLog();
  const input = {
    eventType: "payment.proof_uploaded",
    idempotencyKey: "proof:abc",
    correlationId: "pay-1",
    source: "client.upload" as const,
    actor: { type: "user" as const, id: "u1" },
    risk: "LOW" as const,
    timestamp: "2026-09-15T12:00:00.000Z",
    payload: { paymentId: "pay-1", proofId: "pr-1" },
    contentLayer: "EXTERNAL" as const,
  };
  const first = log.record(input);
  const second = log.record(input);
  assert.equal(first.status, "recorded");
  assert.equal(second.status, "duplicate");
  assert.equal(log.size, 1);
});

test("same idempotencyKey + different payload is conflict and history unchanged", () => {
  const log = new DomainEventLog();
  const base = {
    eventType: "payment.received",
    idempotencyKey: "evt-1",
    correlationId: "inv-1",
    source: "clevone.sandbox" as const,
    actor: { type: "system" as const, id: "gateway" },
    risk: "MEDIUM" as const,
    timestamp: "2026-09-15T12:00:00.000Z",
    payload: { amountCents: 1500, currency: "USD" },
    contentLayer: "BUSINESS" as const,
  };
  log.record(base);
  const before = log.get("evt-1");
  const result = log.record({
    ...base,
    payload: { amountCents: 9999, currency: "USD" },
  });
  assert.equal(result.status, "conflict");
  assert.deepEqual(log.get("evt-1"), before);
  assert.throws(
    () =>
      log.recordOrThrow({
        ...base,
        payload: { amountCents: 1, currency: "USD" },
      }),
    (error: unknown) => error instanceof DomainEventConflictError,
  );
});

test("payload digest is key-order independent", () => {
  assert.equal(
    digestPayload({ b: 1, a: 2 }),
    digestPayload({ a: 2, b: 1 }),
  );
});

test("ClevoneGatewayEvent adapter does not invent a second payment store", () => {
  const log = new DomainEventLog();
  const mapped = envelopeFromClevoneGatewayEvent({
    idempotencyKey: "gw-1",
    eventType: "RECONCILE_CLEVONE_SANDBOX",
    payload: {
      reference: "REF-1",
      amountCents: 1500,
      currency: "USD",
      source: "CLEVONE_SANDBOX",
      authenticated: true,
    },
    paymentId: "pay-1",
    invoiceId: "inv-1",
  });
  assert.equal(mapped.eventType, "payment.received");
  assert.equal(mapped.contentLayer, "BUSINESS");
  log.record(mapped);
  log.record(mapped);
  assert.equal(log.size, 1);
});
