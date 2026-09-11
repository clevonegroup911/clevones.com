import { createHash, randomUUID } from "node:crypto";

import type {
  CreatePaymentInput,
  PaymentAttemptRecord,
  PaymentProvider,
  PaymentRecord,
  PaymentStatus,
  WebhookEvent,
} from "@/lib/payments/types";

type Store = {
  payments: Map<string, PaymentRecord>;
  byIdempotency: Map<string, string>;
  attempts: PaymentAttemptRecord[];
  webhooks: WebhookEvent[];
  audit: Array<{ at: string; action: string; paymentId: string; detail: string }>;
};

function createStore(): Store {
  return {
    payments: new Map(),
    byIdempotency: new Map(),
    attempts: [],
    webhooks: [],
    audit: [],
  };
}

function now(): string {
  return new Date().toISOString();
}

/**
 * Sandbox/stub PaymentProvider supporting CARD, M_PESA and RAWBANK transfer rails.
 * No network. No real keys. Idempotent create + abstract webhook.
 */
export function createSandboxPaymentProvider(store: Store = createStore()): PaymentProvider & {
  store: Store;
} {
  const provider: PaymentProvider & { store: Store } = {
    name: "sandbox",
    store,
    async createPayment(input: CreatePaymentInput): Promise<PaymentRecord> {
      if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
        throw new Error("invalid_amount");
      }
      if (!["CARD", "M_PESA", "RAWBANK_CDF", "RAWBANK_USD"].includes(input.method)) {
        throw new Error("unsupported_method");
      }

      const existingId = store.byIdempotency.get(input.idempotencyKey);
      if (existingId) {
        const existing = store.payments.get(existingId);
        if (existing) {
          store.audit.push({
            at: now(),
            action: "PAYMENT_IDEMPOTENT_HIT",
            paymentId: existing.id,
            detail: input.idempotencyKey,
          });
          return existing;
        }
      }

      const id = randomUUID();
      const record: PaymentRecord = {
        id,
        amountCents: input.amountCents,
        currency: input.currency.toUpperCase(),
        method: input.method,
        status: "PENDING",
        idempotencyKey: input.idempotencyKey,
        providerRef: `sandbox_${input.method.toLowerCase()}_${id.slice(0, 8)}`,
        customerRef: input.customerRef,
        metadata: input.metadata ?? {},
        createdAt: now(),
        updatedAt: now(),
      };
      store.payments.set(id, record);
      store.byIdempotency.set(input.idempotencyKey, id);
      store.attempts.push({
        id: randomUUID(),
        paymentId: id,
        status: "PENDING",
        providerMessage: "sandbox_created",
        createdAt: now(),
      });
      store.audit.push({
        at: now(),
        action: "PAYMENT_CREATED",
        paymentId: id,
        detail: `${input.method}:${input.amountCents}`,
      });
      return record;
    },
    async getPayment(id: string) {
      return store.payments.get(id) ?? null;
    },
    async handleWebhook(rawBody: string, signatureHeader?: string): Promise<WebhookEvent> {
      // Stub signature check: require a non-secret sandbox marker, never a real key.
      if (signatureHeader && signatureHeader !== "sandbox-signature") {
        throw new Error("invalid_webhook_signature");
      }
      const parsed = JSON.parse(rawBody) as {
        paymentId?: string;
        status?: PaymentStatus;
        type?: string;
      };
      if (!parsed.paymentId || !parsed.status) {
        throw new Error("invalid_webhook_payload");
      }
      const payment = store.payments.get(parsed.paymentId);
      if (!payment) {
        throw new Error("payment_not_found");
      }
      payment.status = parsed.status;
      payment.updatedAt = now();
      store.attempts.push({
        id: randomUUID(),
        paymentId: payment.id,
        status: parsed.status,
        providerMessage: "sandbox_webhook",
        createdAt: now(),
      });
      const event: WebhookEvent = {
        id: createHash("sha256").update(rawBody).digest("hex").slice(0, 32),
        type: parsed.type || "payment.status_updated",
        paymentId: payment.id,
        payload: parsed as Record<string, unknown>,
        receivedAt: now(),
      };
      store.webhooks.push(event);
      store.audit.push({
        at: now(),
        action: "PAYMENT_WEBHOOK",
        paymentId: payment.id,
        detail: parsed.status,
      });
      return event;
    },
  };
  return provider;
}
