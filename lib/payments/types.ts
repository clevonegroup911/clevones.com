export type PaymentMethod =
  | "CARD"
  | "M_PESA"
  | "RAWBANK_CDF"
  | "RAWBANK_USD";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "CANCELLED";

export type PaymentVerificationStatus =
  | "PENDING_VERIFICATION"
  | "MATCHED"
  | "VERIFIED"
  | "REVIEW_REQUIRED"
  | "DUPLICATE_SUSPECTED"
  | "REJECTED";

export type PaymentEventSource =
  | "CLIENT_UPLOAD"
  | "M_PESA_SMS"
  | "RAWBANK_SMS"
  | "RAWBANK_EMAIL"
  | "M_PESA_API"
  | "RAWBANK_API"
  | "MANUAL_ADMIN";

export type CreatePaymentInput = {
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  idempotencyKey: string;
  customerRef?: string;
  metadata?: Record<string, string>;
};

export type PaymentRecord = {
  id: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  idempotencyKey: string;
  providerRef: string;
  customerRef?: string;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type PaymentAttemptRecord = {
  id: string;
  paymentId: string;
  status: PaymentStatus;
  providerMessage: string;
  createdAt: string;
};

export type WebhookEvent = {
  id: string;
  type: string;
  paymentId: string;
  payload: Record<string, unknown>;
  receivedAt: string;
};

export type PaymentProvider = {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentRecord>;
  getPayment(id: string): Promise<PaymentRecord | null>;
  handleWebhook(rawBody: string, signatureHeader?: string): Promise<WebhookEvent>;
};
