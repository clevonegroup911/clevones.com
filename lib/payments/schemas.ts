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

export type PaymentProofUploadInput = z.infer<typeof paymentProofUploadSchema>;
export type AdminSandboxCreateInput = z.infer<typeof adminSandboxCreateSchema>;
