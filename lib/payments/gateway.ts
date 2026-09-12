import { randomUUID } from "node:crypto";

import { createSandboxPaymentProvider } from "@/lib/payments/sandbox";
import type {
  PaymentMethod,
  PaymentProvider,
  PaymentRecord,
  PaymentStatus,
} from "@/lib/payments/types";

export type ServiceOrderStatus =
  | "DRAFT"
  | "PENDING"
  | "INVOICED"
  | "ACTIVE"
  | "CANCELLED";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "SETTLED"
  | "VOID";

export type ReceiptStatus = "ISSUED" | "VOID";

export type ClevoneEventType =
  | "ORDER_CREATED"
  | "INVOICE_ISSUED"
  | "PAYMENT_LINKED"
  | "PAYMENT_CAPTURED"
  | "SERVICE_ACTIVATED"
  | "RECEIPT_ISSUED";

export type GatewayAuditEntry = {
  at: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
};

export type ServiceOrderRecord = {
  id: string;
  userId?: string;
  serviceCode: string;
  title: string;
  description: string;
  amountCents: number;
  currency: string;
  status: ServiceOrderStatus;
  idempotencyKey: string;
  metadata: Record<string, string>;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceRecord = {
  id: string;
  orderId: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt?: string;
  settledAt?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReceiptRecord = {
  id: string;
  invoiceId: string;
  paymentId: string;
  receiptNumber: string;
  status: ReceiptStatus;
  issuedAt: string;
  createdAt: string;
};

export type ClevoneGatewayEventRecord = {
  id: string;
  eventType: ClevoneEventType;
  idempotencyKey: string;
  orderId?: string;
  invoiceId?: string;
  paymentId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type GatewayStore = {
  orders: Map<string, ServiceOrderRecord>;
  ordersByIdempotency: Map<string, string>;
  invoices: Map<string, InvoiceRecord>;
  invoicesByOrder: Map<string, string>;
  receipts: Map<string, ReceiptRecord>;
  receiptsByInvoice: Map<string, string>;
  events: Map<string, ClevoneGatewayEventRecord>;
  eventsByIdempotency: Map<string, string>;
  audit: GatewayAuditEntry[];
};

export type CreateOrderInput = {
  userId?: string;
  serviceCode: string;
  title: string;
  description?: string;
  amountCents: number;
  currency: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
};

export type LinkPaymentInput = {
  invoiceId: string;
  method: PaymentMethod;
  idempotencyKey: string;
  customerRef?: string;
};

export type ActivateFromClevoneEventInput = {
  /** Stable key for the CLEVONE capture/activation event. */
  idempotencyKey: string;
  paymentId: string;
  /** Optional explicit capture status; defaults to CAPTURED. */
  status?: Extract<PaymentStatus, "CAPTURED" | "AUTHORIZED">;
};

export type PaymentChain = {
  order: ServiceOrderRecord;
  invoice: InvoiceRecord;
  payment: PaymentRecord | null;
  receipt: ReceiptRecord | null;
  events: ClevoneGatewayEventRecord[];
};

function now(): string {
  return new Date().toISOString();
}

function createStore(): GatewayStore {
  return {
    orders: new Map(),
    ordersByIdempotency: new Map(),
    invoices: new Map(),
    invoicesByOrder: new Map(),
    receipts: new Map(),
    receiptsByInvoice: new Map(),
    events: new Map(),
    eventsByIdempotency: new Map(),
    audit: [],
  };
}

function invoiceNumberFor(orderId: string): string {
  return `INV-${orderId.slice(0, 8).toUpperCase()}`;
}

function receiptNumberFor(invoiceId: string): string {
  return `RCT-${invoiceId.slice(0, 8).toUpperCase()}`;
}

function pushAudit(
  store: GatewayStore,
  action: string,
  entityType: string,
  entityId: string,
  detail: string,
): void {
  store.audit.push({
    at: now(),
    action,
    entityType,
    entityId,
    detail,
  });
}

/**
 * CLEVONE Payment Gateway (sandbox).
 * Chaîne: utilisateur → commande/service → facture → paiement lié →
 * événement CLEVONE → activation idempotente → reçu/facture acquittée → audit.
 *
 * Aucun appel réseau PSP. Aucune clé réelle.
 */
export function createPaymentGateway(options?: {
  store?: GatewayStore;
  provider?: PaymentProvider & { store?: unknown };
}) {
  const store = options?.store ?? createStore();
  const provider =
    options?.provider ?? createSandboxPaymentProvider();

  function emitEvent(input: {
    eventType: ClevoneEventType;
    idempotencyKey: string;
    orderId?: string;
    invoiceId?: string;
    paymentId?: string;
    payload?: Record<string, unknown>;
  }): ClevoneGatewayEventRecord {
    const existingId = store.eventsByIdempotency.get(input.idempotencyKey);
    if (existingId) {
      const existing = store.events.get(existingId);
      if (existing) {
        pushAudit(
          store,
          "GATEWAY_EVENT_IDEMPOTENT_HIT",
          "ClevoneGatewayEvent",
          existing.id,
          input.idempotencyKey,
        );
        return existing;
      }
    }

    const event: ClevoneGatewayEventRecord = {
      id: randomUUID(),
      eventType: input.eventType,
      idempotencyKey: input.idempotencyKey,
      orderId: input.orderId,
      invoiceId: input.invoiceId,
      paymentId: input.paymentId,
      payload: input.payload ?? {},
      createdAt: now(),
    };
    store.events.set(event.id, event);
    store.eventsByIdempotency.set(input.idempotencyKey, event.id);
    pushAudit(
      store,
      `GATEWAY_${input.eventType}`,
      "ClevoneGatewayEvent",
      event.id,
      input.idempotencyKey,
    );
    return event;
  }

  const gateway = {
    store,
    provider,

    /** Créer commande + facture émise (AWAITING_PAYMENT). Idempotent sur order key. */
    async createOrderWithInvoice(input: CreateOrderInput): Promise<{
      order: ServiceOrderRecord;
      invoice: InvoiceRecord;
    }> {
      if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
        throw new Error("invalid_amount");
      }
      if (!input.serviceCode.trim() || !input.title.trim()) {
        throw new Error("invalid_order");
      }

      const existingOrderId = store.ordersByIdempotency.get(input.idempotencyKey);
      if (existingOrderId) {
        const order = store.orders.get(existingOrderId);
        const invoiceId = store.invoicesByOrder.get(existingOrderId);
        const invoice = invoiceId ? store.invoices.get(invoiceId) : undefined;
        if (order && invoice) {
          pushAudit(
            store,
            "GATEWAY_ORDER_IDEMPOTENT_HIT",
            "ServiceOrder",
            order.id,
            input.idempotencyKey,
          );
          return { order, invoice };
        }
      }

      const ts = now();
      const order: ServiceOrderRecord = {
        id: randomUUID(),
        userId: input.userId,
        serviceCode: input.serviceCode.trim(),
        title: input.title.trim(),
        description: (input.description ?? "").trim(),
        amountCents: input.amountCents,
        currency: input.currency.toUpperCase(),
        status: "INVOICED",
        idempotencyKey: input.idempotencyKey,
        metadata: input.metadata ?? {},
        createdAt: ts,
        updatedAt: ts,
      };
      store.orders.set(order.id, order);
      store.ordersByIdempotency.set(input.idempotencyKey, order.id);

      const invoice: InvoiceRecord = {
        id: randomUUID(),
        orderId: order.id,
        invoiceNumber: invoiceNumberFor(order.id),
        amountCents: order.amountCents,
        currency: order.currency,
        status: "AWAITING_PAYMENT",
        issuedAt: ts,
        createdAt: ts,
        updatedAt: ts,
      };
      store.invoices.set(invoice.id, invoice);
      store.invoicesByOrder.set(order.id, invoice.id);

      emitEvent({
        eventType: "ORDER_CREATED",
        idempotencyKey: `evt:order:${order.idempotencyKey}`,
        orderId: order.id,
        invoiceId: invoice.id,
        payload: { serviceCode: order.serviceCode },
      });
      emitEvent({
        eventType: "INVOICE_ISSUED",
        idempotencyKey: `evt:invoice:${invoice.invoiceNumber}`,
        orderId: order.id,
        invoiceId: invoice.id,
        payload: { invoiceNumber: invoice.invoiceNumber },
      });

      pushAudit(store, "GATEWAY_ORDER_CREATED", "ServiceOrder", order.id, order.serviceCode);
      pushAudit(
        store,
        "GATEWAY_INVOICE_ISSUED",
        "Invoice",
        invoice.id,
        invoice.invoiceNumber,
      );

      return { order, invoice };
    },

    /** Lier un paiement sandbox à la facture (pas de rail réel). */
    async linkSandboxPayment(input: LinkPaymentInput): Promise<{
      invoice: InvoiceRecord;
      payment: PaymentRecord;
    }> {
      const invoice = store.invoices.get(input.invoiceId);
      if (!invoice) {
        throw new Error("invoice_not_found");
      }
      if (invoice.status === "SETTLED" || invoice.status === "VOID") {
        throw new Error("invoice_not_linkable");
      }

      if (invoice.paymentId) {
        const existing = await provider.getPayment(invoice.paymentId);
        if (existing) {
          pushAudit(
            store,
            "GATEWAY_PAYMENT_LINK_IDEMPOTENT_HIT",
            "Invoice",
            invoice.id,
            existing.id,
          );
          return { invoice, payment: existing };
        }
      }

      const payment = await provider.createPayment({
        amountCents: invoice.amountCents,
        currency: invoice.currency,
        method: input.method,
        idempotencyKey: input.idempotencyKey,
        customerRef: input.customerRef,
        metadata: {
          invoiceId: invoice.id,
          orderId: invoice.orderId,
          source: "clevone_gateway_sandbox",
        },
      });

      invoice.paymentId = payment.id;
      invoice.status = "AWAITING_PAYMENT";
      invoice.updatedAt = now();
      store.invoices.set(invoice.id, invoice);

      emitEvent({
        eventType: "PAYMENT_LINKED",
        idempotencyKey: `evt:paylink:${payment.idempotencyKey}`,
        orderId: invoice.orderId,
        invoiceId: invoice.id,
        paymentId: payment.id,
        payload: { method: payment.method, provider: "sandbox" },
      });
      pushAudit(store, "GATEWAY_PAYMENT_LINKED", "Payment", payment.id, invoice.id);

      return { invoice, payment };
    },

    /**
     * Traite un événement CLEVONE authentifié (sandbox) :
     * capture → activation idempotente → reçu / facture acquittée.
     */
    async activateFromClevoneEvent(
      input: ActivateFromClevoneEventInput,
    ): Promise<PaymentChain> {
      const targetStatus = input.status ?? "CAPTURED";
      const existingEventId = store.eventsByIdempotency.get(input.idempotencyKey);
      if (existingEventId) {
        const existing = store.events.get(existingEventId);
        if (existing?.paymentId) {
          const chain = await gateway.getChainByPaymentId(existing.paymentId);
          if (chain) {
            pushAudit(
              store,
              "GATEWAY_ACTIVATION_IDEMPOTENT_HIT",
              "ClevoneGatewayEvent",
              existing.id,
              input.idempotencyKey,
            );
            return chain;
          }
        }
      }

      const payment = await provider.getPayment(input.paymentId);
      if (!payment) {
        throw new Error("payment_not_found");
      }

      const invoice = [...store.invoices.values()].find(
        (row) => row.paymentId === payment.id,
      );
      if (!invoice) {
        throw new Error("invoice_for_payment_not_found");
      }
      const order = store.orders.get(invoice.orderId);
      if (!order) {
        throw new Error("order_not_found");
      }

      // Capture via sandbox webhook stub — jamais un PSP réel.
      if (payment.status !== "CAPTURED" && payment.status !== "AUTHORIZED") {
        await provider.handleWebhook(
          JSON.stringify({
            paymentId: payment.id,
            status: targetStatus,
            type: "clevone.payment.captured",
          }),
          "sandbox-signature",
        );
      }

      const captured = (await provider.getPayment(payment.id))!;
      emitEvent({
        eventType: "PAYMENT_CAPTURED",
        idempotencyKey: `${input.idempotencyKey}:captured`,
        orderId: order.id,
        invoiceId: invoice.id,
        paymentId: captured.id,
        payload: { status: captured.status, source: "clevone_sandbox" },
      });

      // Activation idempotente du service.
      if (order.status !== "ACTIVE") {
        order.status = "ACTIVE";
        order.activatedAt = now();
        order.updatedAt = order.activatedAt;
        store.orders.set(order.id, order);
        emitEvent({
          eventType: "SERVICE_ACTIVATED",
          idempotencyKey: `evt:activate:${order.id}`,
          orderId: order.id,
          invoiceId: invoice.id,
          paymentId: captured.id,
          payload: { activatedAt: order.activatedAt },
        });
        pushAudit(
          store,
          "GATEWAY_SERVICE_ACTIVATED",
          "ServiceOrder",
          order.id,
          order.activatedAt,
        );
      }

      invoice.status = "PAID";
      invoice.updatedAt = now();

      let receipt = store.receiptsByInvoice.has(invoice.id)
        ? store.receipts.get(store.receiptsByInvoice.get(invoice.id)!)
        : undefined;

      if (!receipt) {
        const ts = now();
        receipt = {
          id: randomUUID(),
          invoiceId: invoice.id,
          paymentId: captured.id,
          receiptNumber: receiptNumberFor(invoice.id),
          status: "ISSUED",
          issuedAt: ts,
          createdAt: ts,
        };
        store.receipts.set(receipt.id, receipt);
        store.receiptsByInvoice.set(invoice.id, receipt.id);
        emitEvent({
          eventType: "RECEIPT_ISSUED",
          idempotencyKey: `evt:receipt:${receipt.receiptNumber}`,
          orderId: order.id,
          invoiceId: invoice.id,
          paymentId: captured.id,
          payload: { receiptNumber: receipt.receiptNumber },
        });
        pushAudit(
          store,
          "GATEWAY_RECEIPT_ISSUED",
          "Receipt",
          receipt.id,
          receipt.receiptNumber,
        );
      }

      invoice.status = "SETTLED";
      invoice.settledAt = receipt.issuedAt;
      invoice.updatedAt = now();
      store.invoices.set(invoice.id, invoice);
      pushAudit(
        store,
        "GATEWAY_INVOICE_SETTLED",
        "Invoice",
        invoice.id,
        invoice.invoiceNumber,
      );

      // Marqueur d'idempotence de bout en bout pour cet événement CLEVONE.
      emitEvent({
        eventType: "SERVICE_ACTIVATED",
        idempotencyKey: input.idempotencyKey,
        orderId: order.id,
        invoiceId: invoice.id,
        paymentId: captured.id,
        payload: { chain: "complete", source: "clevone_sandbox" },
      });

      return {
        order,
        invoice,
        payment: captured,
        receipt,
        events: [...store.events.values()].filter(
          (event) =>
            event.orderId === order.id ||
            event.invoiceId === invoice.id ||
            event.paymentId === captured.id,
        ),
      };
    },

    async getChainByOrderId(orderId: string): Promise<PaymentChain | null> {
      const order = store.orders.get(orderId);
      if (!order) {
        return null;
      }
      const invoiceId = store.invoicesByOrder.get(orderId);
      const invoice = invoiceId ? store.invoices.get(invoiceId) : undefined;
      if (!invoice) {
        return null;
      }
      const payment = invoice.paymentId
        ? await provider.getPayment(invoice.paymentId)
        : null;
      const receiptId = store.receiptsByInvoice.get(invoice.id);
      const receipt = receiptId ? store.receipts.get(receiptId) ?? null : null;
      const events = [...store.events.values()].filter(
        (event) =>
          event.orderId === order.id ||
          event.invoiceId === invoice.id ||
          (payment && event.paymentId === payment.id),
      );
      return { order, invoice, payment, receipt, events };
    },

    async getChainByPaymentId(paymentId: string): Promise<PaymentChain | null> {
      const invoice = [...store.invoices.values()].find(
        (row) => row.paymentId === paymentId,
      );
      if (!invoice) {
        return null;
      }
      return gateway.getChainByOrderId(invoice.orderId);
    },
  };

  return gateway;
}

export type PaymentGateway = ReturnType<typeof createPaymentGateway>;
