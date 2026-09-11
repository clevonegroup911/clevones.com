import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_PREFIX = "sha256=";

export function signPaymentGatewayPayload(rawBody: string, secret: string): string {
  if (!secret) throw new Error("payment_gateway_secret_missing");
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  return `${SIGNATURE_PREFIX}${digest}`;
}

export function verifyPaymentGatewaySignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
): boolean {
  if (!secret || !signatureHeader?.startsWith(SIGNATURE_PREFIX)) return false;

  const expected = signPaymentGatewayPayload(rawBody, secret);
  const received = Buffer.from(signatureHeader, "utf8");
  const wanted = Buffer.from(expected, "utf8");

  if (received.length !== wanted.length) return false;
  return timingSafeEqual(received, wanted);
}
