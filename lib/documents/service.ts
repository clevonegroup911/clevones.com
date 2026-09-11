import type {
  DocumentAccessLevel,
  DocumentCategory,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import {
  canAccessDocument,
  documentListFilterForActor,
  type DocumentActor,
} from "@/lib/documents/access";
import { prisma } from "@/lib/db/prisma";
import {
  buildStorageKey,
  deletePrivateObject,
  putPrivateObject,
  readPrivateObject,
} from "@/lib/documents/storage";

export type DocumentsClient = PrismaClient | Prisma.TransactionClient;

export class DocumentAccessError extends Error {
  readonly code = "DOCUMENT_ACCESS_DENIED";
  readonly reason: string;

  constructor(reason: string) {
    super(`Document access denied: ${reason}`);
    this.name = "DocumentAccessError";
    this.reason = reason;
  }
}

export type UploadDocumentInput = {
  title: string;
  description?: string;
  category: DocumentCategory;
  accessLevel: DocumentAccessLevel;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  ownerId: string;
  uploadedById: string;
};

async function actorHasGrant(
  documentId: string,
  userId: string,
  client: DocumentsClient,
): Promise<boolean> {
  const grant = await client.documentGrant.findUnique({
    where: { documentId_userId: { documentId, userId } },
    select: { canRead: true },
  });
  return Boolean(grant?.canRead);
}

export async function uploadDocument(
  input: UploadDocumentInput,
  client: DocumentsClient = prisma,
) {
  const key = buildStorageKey(input.fileName);
  const stored = await putPrivateObject(key, input.bytes);
  try {
    return await client.document.create({
      data: {
        title: input.title,
        description: input.description ?? "",
        category: input.category,
        accessLevel: input.accessLevel,
        storageKey: stored.key,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: stored.sizeBytes,
        checksumSha256: stored.checksumSha256,
        ownerId: input.ownerId,
        uploadedById: input.uploadedById,
      },
    });
  } catch (error) {
    await deletePrivateObject(stored.key);
    throw error;
  }
}

export async function listDocumentsForActor(
  actor: DocumentActor,
  options: { query?: string; includeDeleted?: boolean } = {},
  client: DocumentsClient = prisma,
) {
  const query = options.query?.trim();
  const filter = documentListFilterForActor(actor);
  const textFilter = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { fileName: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  if (filter.mode === "all") {
    return client.document.findMany({
      where: {
        deletedAt: options.includeDeleted ? undefined : null,
        ...textFilter,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  return client.document.findMany({
    where: {
      deletedAt: options.includeDeleted ? undefined : null,
      AND: [
        {
          OR: [
            { ownerId: actor.id },
            ...(filter.includeInternal ? [{ accessLevel: "INTERNAL" as const }] : []),
            { grants: { some: { userId: actor.id, canRead: true as const } } },
          ],
        },
        textFilter,
      ],
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** @deprecated Prefer listDocumentsForActor */
export async function listDocuments(
  options: { query?: string; includeDeleted?: boolean } = {},
  client: DocumentsClient = prisma,
) {
  return client.document.findMany({
    where: {
      deletedAt: options.includeDeleted ? undefined : null,
      ...(options.query?.trim()
        ? {
            OR: [
              { title: { contains: options.query.trim(), mode: "insensitive" } },
              { fileName: { contains: options.query.trim(), mode: "insensitive" } },
              { description: { contains: options.query.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getActiveDocument(id: string, client: DocumentsClient = prisma) {
  return client.document.findFirst({
    where: { id, deletedAt: null },
  });
}

export async function assertCanAccessDocument(
  actor: DocumentActor,
  documentId: string,
  action: "read" | "delete",
  client: DocumentsClient = prisma,
) {
  const document = await getActiveDocument(documentId, client);
  if (!document) {
    return null;
  }
  const hasGrant = await actorHasGrant(document.id, actor.id, client);
  const decision = canAccessDocument(actor, document, action, { hasGrant });
  if (!decision.allowed) {
    throw new DocumentAccessError(decision.reason);
  }
  return document;
}

export async function softDeleteDocument(
  id: string,
  client: DocumentsClient = prisma,
) {
  return client.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function readDocumentBytes(storageKey: string): Promise<Buffer> {
  return readPrivateObject(storageKey);
}
