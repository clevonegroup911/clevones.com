-- CreateEnum
CREATE TYPE "AnalyticsCategory" AS ENUM ('PAGE', 'FORM', 'ADMIN', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "AnalyticsActorKind" AS ENUM ('ANONYMOUS', 'USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AnalyticsCategory" NOT NULL,
    "path" TEXT NOT NULL,
    "locale" TEXT,
    "actorKind" "AnalyticsActorKind" NOT NULL DEFAULT 'ANONYMOUS',
    "day" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_category_createdAt_idx" ON "AnalyticsEvent"("category", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_day_idx" ON "AnalyticsEvent"("name", "day");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_day_idx" ON "AnalyticsEvent"("day");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_path_day_idx" ON "AnalyticsEvent"("path", "day");
