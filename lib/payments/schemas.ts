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

export type PaymentProofUploadInput = z.infer<typeof paymentProofUploadSchema>;
