import assert from "node:assert/strict";
import { test } from "node:test";

import {
  signPaymentGatewayPayload,
  verifyPaymentGatewaySignature,
} from "@/lib/payments/gateway-signature";

test("gateway HMAC verifies exact payload", () => {
  const payload = JSON.stringify({ reference: "DIB16FDFOBB", amountCents: 55000 });
  const signature = signPaymentGatewayPayload(payload, "test-secret");

  assert.equal(
    verifyPaymentGatewaySignature(payload, signature, "test-secret"),
    true,
  );
});

test("gateway HMAC rejects tampered payload", () => {
  const payload = JSON.stringify({ reference: "DIB16FDFOBB", amountCents: 55000 });
  const signature = signPaymentGatewayPayload(payload, "test-secret");

  assert.equal(
    verifyPaymentGatewaySignature(
      JSON.stringify({ reference: "DIB16FDFOBB", amountCents: 1 }),
      signature,
      "test-secret",
    ),
    false,
  );
});

test("gateway HMAC rejects missing or wrong signatures", () => {
  const payload = "{}";
  assert.equal(verifyPaymentGatewaySignature(payload, null, "test-secret"), false);
  assert.equal(
    verifyPaymentGatewaySignature(payload, "sha256=deadbeef", "test-secret"),
    false,
  );
});
