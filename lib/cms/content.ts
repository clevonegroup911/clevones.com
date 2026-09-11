import type { ContentLocale, ContentStatus, Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type CmsClient = PrismaClient | Prisma.TransactionClient;

export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const CONTENT_LOCALES = ["fr", "en"] as const;

export function slugifyTitle(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function assertUniquePageSlug(
  slug: string,
  excludeId?: string,
  client: CmsClient = prisma,
): Promise<boolean> {
  const existing = await client.contentPage.findUnique({ where: { slug } });
  if (!existing) {
    return true;
  }
  return Boolean(excludeId && existing.id === excludeId);
}

export type CreatePageInput = {
  slug: string;
  title: string;
  description?: string;
  actorId: string;
};

export async function createContentPage(
  input: CreatePageInput,
  client: CmsClient = prisma,
) {
  return client.contentPage.create({
    data: {
      slug: input.slug,
      title: input.title,
      description: input.description ?? "",
      status: "DRAFT",
      createdById: input.actorId,
      updatedById: input.actorId,
    },
  });
}

export type UpsertEntryInput = {
  pageId: string;
  locale: ContentLocale;
  title: string;
  summary?: string;
  body?: string;
  actorId: string;
};

export async function upsertContentEntry(
  input: UpsertEntryInput,
  client: CmsClient = prisma,
) {
  return client.contentEntry.upsert({
    where: {
      pageId_locale: {
        pageId: input.pageId,
        locale: input.locale,
      },
    },
    create: {
      pageId: input.pageId,
      locale: input.locale,
      title: input.title,
      summary: input.summary ?? "",
      body: input.body ?? "",
      status: "DRAFT",
      createdById: input.actorId,
      updatedById: input.actorId,
    },
    update: {
      title: input.title,
      summary: input.summary ?? "",
      body: input.body ?? "",
      updatedById: input.actorId,
    },
  });
}

export async function setPageStatus(
  pageId: string,
  status: ContentStatus,
  actorId: string,
  client: CmsClient = prisma,
) {
  return client.contentPage.update({
    where: { id: pageId },
    data: {
      status,
      updatedById: actorId,
      publishedAt: status === "PUBLISHED" ? new Date() : undefined,
    },
  });
}

export async function setEntryStatus(
  entryId: string,
  status: ContentStatus,
  actorId: string,
  client: CmsClient = prisma,
) {
  return client.contentEntry.update({
    where: { id: entryId },
    data: {
      status,
      updatedById: actorId,
      publishedAt: status === "PUBLISHED" ? new Date() : undefined,
    },
  });
}

export async function getPageWithEntries(pageId: string, client: CmsClient = prisma) {
  return client.contentPage.findUnique({
    where: { id: pageId },
    include: { entries: { orderBy: { locale: "asc" } } },
  });
}

export async function listContentPages(client: CmsClient = prisma) {
  return client.contentPage.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      entries: {
        select: { id: true, locale: true, status: true, title: true },
        orderBy: { locale: "asc" },
      },
    },
  });
}

/** Preview payload for admins — includes DRAFT content. */
export async function previewPage(slug: string, locale: ContentLocale, client: CmsClient = prisma) {
  const page = await client.contentPage.findUnique({
    where: { slug },
    include: {
      entries: {
        where: { locale },
      },
    },
  });
  if (!page) {
    return null;
  }
  return {
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      description: page.description,
      status: page.status,
    },
    entry: page.entries[0] ?? null,
  };
}
