import { prisma } from "@/lib/db/prisma";

export class DocumentGrantError extends Error {
  constructor(
    message: string,
    readonly code:
      | "DOCUMENT_NOT_FOUND"
      | "USER_NOT_FOUND"
      | "GRANT_EXISTS"
      | "GRANT_NOT_FOUND",
  ) {
    super(message);
    this.name = "DocumentGrantError";
  }
}

export type DocumentGrantRecord = {
  id: string;
  documentId: string;
  userId: string;
  canRead: boolean;
  canWrite: boolean;
  createdAt: Date;
};

export async function createDocumentGrant(input: {
  documentId: string;
  userId: string;
  canRead?: boolean;
  canWrite?: boolean;
}): Promise<DocumentGrantRecord> {
  const document = await prisma.document.findFirst({
    where: { id: input.documentId, deletedAt: null },
    select: { id: true },
  });
  if (!document) {
    throw new DocumentGrantError("Document introuvable.", "DOCUMENT_NOT_FOUND");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!user) {
    throw new DocumentGrantError("Utilisateur introuvable.", "USER_NOT_FOUND");
  }

  try {
    return await prisma.documentGrant.create({
      data: {
        documentId: input.documentId,
        userId: input.userId,
        canRead: input.canRead ?? true,
        canWrite: input.canWrite ?? false,
      },
      select: {
        id: true,
        documentId: true,
        userId: true,
        canRead: true,
        canWrite: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new DocumentGrantError("Grant déjà existant.", "GRANT_EXISTS");
    }
    throw error;
  }
}

export async function revokeDocumentGrant(input: {
  documentId: string;
  userId: string;
}): Promise<DocumentGrantRecord> {
  const existing = await prisma.documentGrant.findUnique({
    where: {
      documentId_userId: {
        documentId: input.documentId,
        userId: input.userId,
      },
    },
    select: {
      id: true,
      documentId: true,
      userId: true,
      canRead: true,
      canWrite: true,
      createdAt: true,
    },
  });
  if (!existing) {
    throw new DocumentGrantError("Grant introuvable.", "GRANT_NOT_FOUND");
  }

  await prisma.documentGrant.delete({
    where: { id: existing.id },
  });
  return existing;
}

export async function listDocumentGrants(documentId?: string) {
  return prisma.documentGrant.findMany({
    where: documentId ? { documentId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      documentId: true,
      userId: true,
      canRead: true,
      canWrite: true,
      createdAt: true,
      user: { select: { email: true, role: true, status: true } },
      document: { select: { title: true, fileName: true } },
    },
  });
}
