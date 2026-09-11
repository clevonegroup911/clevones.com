CREATE TYPE "AnalyticsEventName" AS ENUM ('PAGE_VIEW', 'FORM_SUBMIT', 'ADMIN_LOGIN', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'COMMERCIAL_ACTION');

CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" "AnalyticsEventName" NOT NULL,
    "path" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT '',
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");
CREATE INDEX "AnalyticsEvent_path_idx" ON "AnalyticsEvent"("path");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
