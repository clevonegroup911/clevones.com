-- CreateEnum
CREATE TYPE "PaymentProofSource" AS ENUM ('CLIENT_UPLOAD', 'CLEVONE_SANDBOX', 'CLEVONE_OFFICIAL');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'MATCHED', 'VERIFIED', 'HUMAN_REVIEW', 'DUPLICATE_SUSPECTED', 'REJECTED');

-- CreateTable
CREATE TABLE "PaymentProof" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "source" "PaymentProofSource" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "reference" TEXT,
    "amountCents" INTEGER,
    "currency" TEXT,
    "authenticated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationDecision" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "status" "ReconciliationStatus" NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "reasons" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "clientProofId" TEXT,
    "matchedEventKey" TEXT,
    "reviewDueAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProof_storageKey_key" ON "PaymentProof"("storageKey");

-- CreateIndex
CREATE INDEX "PaymentProof_paymentId_createdAt_idx" ON "PaymentProof"("paymentId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentProof_invoiceId_idx" ON "PaymentProof"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentProof_reference_idx" ON "PaymentProof"("reference");

-- CreateIndex
CREATE INDEX "PaymentProof_source_idx" ON "PaymentProof"("source");

-- CreateIndex
CREATE UNIQUE INDEX "ReconciliationDecision_idempotencyKey_key" ON "ReconciliationDecision"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ReconciliationDecision_paymentId_createdAt_idx" ON "ReconciliationDecision"("paymentId", "createdAt");

-- CreateIndex
CREATE INDEX "ReconciliationDecision_status_createdAt_idx" ON "ReconciliationDecision"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ReconciliationDecision_invoiceId_idx" ON "ReconciliationDecision"("invoiceId");
