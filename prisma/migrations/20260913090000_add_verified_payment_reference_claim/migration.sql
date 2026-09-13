-- Additive only: global anti-replay claim for verified payment references (T041).
-- CI / local ephemeral DB only — do not migrate production from this task.

CREATE TABLE "VerifiedPaymentReferenceClaim" (
    "id" TEXT NOT NULL,
    "normalizedReference" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "decisionId" TEXT,
    "eventKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedPaymentReferenceClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerifiedPaymentReferenceClaim_normalizedReference_key" ON "VerifiedPaymentReferenceClaim"("normalizedReference");

CREATE INDEX "VerifiedPaymentReferenceClaim_paymentId_idx" ON "VerifiedPaymentReferenceClaim"("paymentId");

CREATE INDEX "VerifiedPaymentReferenceClaim_decisionId_idx" ON "VerifiedPaymentReferenceClaim"("decisionId");
