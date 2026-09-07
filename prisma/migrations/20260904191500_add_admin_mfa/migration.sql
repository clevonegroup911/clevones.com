-- CreateTable
CREATE TABLE "UserMfaSecret" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ciphertext" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "authTag" BYTEA NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "pending" BOOLEAN NOT NULL DEFAULT true,
    "pendingExpiresAt" TIMESTAMP(3),
    "lastUsedStep" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMfaSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "callbackUrl" TEXT NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaRateLimit" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectHash" TEXT NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "windowEndsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfaRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaRecoveryCode" (
    "id" TEXT NOT NULL,
    "secretId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMfaSecret_userId_key" ON "UserMfaSecret"("userId");

-- CreateIndex
CREATE INDEX "MfaChallenge_userId_idx" ON "MfaChallenge"("userId");

-- CreateIndex
CREATE INDEX "MfaChallenge_expiresAt_idx" ON "MfaChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "MfaChallenge_userId_consumedAt_idx" ON "MfaChallenge"("userId", "consumedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MfaRateLimit_subjectType_subjectHash_key" ON "MfaRateLimit"("subjectType", "subjectHash");

-- CreateIndex
CREATE INDEX "MfaRateLimit_windowEndsAt_idx" ON "MfaRateLimit"("windowEndsAt");

-- CreateIndex
CREATE INDEX "MfaRecoveryCode_secretId_usedAt_idx" ON "MfaRecoveryCode"("secretId", "usedAt");

-- AddForeignKey
ALTER TABLE "UserMfaSecret" ADD CONSTRAINT "UserMfaSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaChallenge" ADD CONSTRAINT "MfaChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaRecoveryCode" ADD CONSTRAINT "MfaRecoveryCode_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "UserMfaSecret"("id") ON DELETE CASCADE ON UPDATE CASCADE;
