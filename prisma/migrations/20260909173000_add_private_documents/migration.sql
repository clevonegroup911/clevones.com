CREATE TYPE "DocumentAccessLevel" AS ENUM ('PRIVATE', 'INTERNAL', 'RESTRICTED');
CREATE TYPE "DocumentCategory" AS ENUM ('CONTRACT', 'DELIVERABLE', 'EVIDENCE', 'OTHER');

CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "accessLevel" "DocumentAccessLevel" NOT NULL DEFAULT 'PRIVATE',
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");
CREATE INDEX "Document_ownerId_idx" ON "Document"("ownerId");
CREATE INDEX "Document_category_idx" ON "Document"("category");
CREATE INDEX "Document_accessLevel_idx" ON "Document"("accessLevel");
CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");
CREATE INDEX "Document_title_idx" ON "Document"("title");

ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
