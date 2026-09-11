import type { PaymentEventSource } from "@/lib/payments/types";

const ALLOWED_SOURCES = new Set<PaymentEventSource>([
  "M_PESA_SMS",
  "RAWBANK_SMS",
  "RAWBANK_EMAIL",
  "M_PESA_API",
  "RAWBANK_API",
]);

export type GatewayPaymentEvent = {
  eventId: string;
  source: Exclude<PaymentEventSource, "CLIENT_UPLOAD" | "MANUAL_ADMIN">;
  reference: string;
  amountCents: number;
  currency: string;
  invoiceRef?: string;
  payerRef?: string;
  beneficiaryRef?: string;
  occurredAt: string;
};

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`invalid_${field}`);
  }
  return value.trim();
}

export function parseGatewayPaymentEvent(value: unknown): GatewayPaymentEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid_payment_event");
  }

  const input = value as Record<string, unknown>;
  const source = readRequiredString(input.source, "source") as PaymentEventSource;
  if (!ALLOWED_SOURCES.has(source)) {
    throw new Error("invalid_source");
  }

  const amountCents = input.amountCents;
  if (!Number.isSafeInteger(amountCents) || Number(amountCents) <= 0) {
    throw new Error("invalid_amountCents");
  }

  const occurredAt = readRequiredString(input.occurredAt, "occurredAt");
  if (Number.isNaN(Date.parse(occurredAt))) {
    throw new Error("invalid_occurredAt");
  }

  const currency = readRequiredString(input.currency, "currency").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("invalid_currency");
  }

  const event: GatewayPaymentEvent = {
    eventId: readRequiredString(input.eventId, "eventId"),
    source: source as GatewayPaymentEvent["source"],
    reference: readRequiredString(input.reference, "reference"),
    amountCents: Number(amountCents),
    currency,
    occurredAt: new Date(occurredAt).toISOString(),
  };

  for (const key of ["invoiceRef", "payerRef", "beneficiaryRef"] as const) {
    const candidate = input[key];
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      event[key] = readRequiredString(candidate, key);
    }
  }

  return event;
}
