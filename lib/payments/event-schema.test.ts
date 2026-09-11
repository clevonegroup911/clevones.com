import assert from "node:assert/strict";
import { test } from "node:test";

import { parseGatewayPaymentEvent } from "@/lib/payments/event-schema";

test("normalizes an authenticated relay event payload", () => {
  const event = parseGatewayPaymentEvent({
    eventId: "sms-20260911-150049-DIB16FDFOBB",
    source: "M_PESA_SMS",
    reference: "DIB16FDFOBB",
    amountCents: 55000,
    currency: "usd",
    payerRef: "+243818888695",
    occurredAt: "2026-09-11T15:00:49+02:00",
  });

  assert.equal(event.source, "M_PESA_SMS");
  assert.equal(event.currency, "USD");
  assert.equal(event.reference, "DIB16FDFOBB");
  assert.equal(event.amountCents, 55000);
});

test("rejects client uploads on the trusted gateway event channel", () => {
  assert.throws(
    () =>
      parseGatewayPaymentEvent({
        eventId: "bad-1",
        source: "CLIENT_UPLOAD",
        reference: "DIB16FDFOBB",
        amountCents: 55000,
        currency: "USD",
        occurredAt: "2026-09-11T15:00:49Z",
      }),
    /invalid_source/,
  );
});

test("rejects invalid money and timestamp fields", () => {
  assert.throws(
    () =>
      parseGatewayPaymentEvent({
        eventId: "bad-2",
        source: "RAWBANK_EMAIL",
        reference: "1590026300057",
        amountCents: -1,
        currency: "CDF",
        occurredAt: "not-a-date",
      }),
    /invalid_amountCents/,
  );
});
