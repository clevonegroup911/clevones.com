import { z } from "zod";

export const paymentProofUploadSchema = z.object({
  paymentId: z.string().min(1).max(64),
  invoiceId: z.string().min(1).max(64).optional(),
  reference: z.string().min(1).max(120).optional(),
  amountCents: z.coerce.number().int().positive().optional(),
  currency: z.string().min(3).max(8).optional(),
});

export const adminPaymentListQuerySchema = z.object({
  status: z
    .enum([
      "PENDING",
      "MATCHED",
      "VERIFIED",
      "HUMAN_REVIEW",
      "DUPLICATE_SUSPECTED",
      "REJECTED",
      "ALL",
    ])
    .default("ALL"),
});

/** Admin-only sandbox chain creation (no PSP / no network). */
export const adminSandboxCreateSchema = z.object({
  serviceCode: z.string().min(1).max(64).default("SANDBOX_DEMO"),
  title: z.string().min(1).max(160).default("Démo gateway sandbox"),
  amountCents: z.coerce.number().int().positive().max(100_000_000).default(2500),
  currency: z.string().min(3).max(8).default("USD"),
  method: z.enum(["CARD", "M_PESA"]).default("CARD"),
  /** When true, activate via CLEVONE sandbox event → receipt SETTLED. */
  settle: z.coerce.boolean().default(false),
  /** Optional target user; defaults to the acting admin. */
  userId: z.string().min(1).max(64).optional(),
});

/** Admin: enregistrer un événement CLEVONE sandbox authentifié (pas de webhook réseau). */
export const adminClevoneEventSchema = z.object({
  paymentId: z.string().min(1).max(64),
  invoiceId: z.string().min(1).max(64).optional(),
  reference: z.string().min(1).max(120),
  amountCents: z.coerce.number().int().positive().max(100_000_000),
  currency: z.string().min(3).max(8),
  /** Clé d’idempotence de l’événement ; générée côté serveur si absente. */
  eventKey: z.string().min(1).max(160).optional(),
  source: z
    .enum(["CLEVONE_SANDBOX", "CLEVONE_OFFICIAL"])
    .default("CLEVONE_SANDBOX"),
});

/** Admin: rapprochement HTTP depuis le store Prisma (preuves + événements). */
export const adminReconcileSchema = z.object({
  paymentId: z.string().min(1).max(64),
  invoiceId: z.string().min(1).max(64).optional(),
  /** Preuve client ciblée ; sinon dernière CLIENT_UPLOAD du paiement. */
  clientProofId: z.string().min(1).max(64).optional(),
  /** Si omis : admin-reconcile:{paymentId}:{clientProofId|none}:{eventKeysHash} */
  idempotencyKey: z.string().min(1).max(200).optional(),
});

export type PaymentProofUploadInput = z.infer<typeof paymentProofUploadSchema>;
export type AdminSandboxCreateInput = z.infer<typeof adminSandboxCreateSchema>;
export type AdminClevoneEventInput = z.infer<typeof adminClevoneEventSchema>;
export type AdminReconcileInput = z.infer<typeof adminReconcileSchema>;
