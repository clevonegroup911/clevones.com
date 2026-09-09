import type {
  DocumentAccessLevel,
  DocumentCategory,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  buildStorageKey,
  deletePrivateObject,
  putPrivateObject,
  readPrivateObject,
} from "@/lib/documents/storage";

export type DocumentsClient = PrismaClient | Prisma.TransactionClient;

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

export async function listDocuments(options: {
  query?: string;
  includeDeleted?: boolean;
} = {}, client: DocumentsClient = prisma) {
  const query = options.query?.trim();
  return client.document.findMany({
    where: {
      deletedAt: options.includeDeleted ? undefined : null,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { fileName: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
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
