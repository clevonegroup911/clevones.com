"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { actorKindFromRole, trackEvent } from "@/lib/analytics";
import { adminRoutes } from "@/lib/auth";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  assertUniquePageSlug,
  createContentPage,
  setEntryStatus,
  setPageStatus,
  upsertContentEntry,
} from "@/lib/cms/content";
import { prisma } from "@/lib/db/prisma";
import {
  contentStatusSchema,
  createContentPageSchema,
  formatZodFieldErrors,
  upsertContentEntrySchema,
} from "@/lib/validation";

export type CmsActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createCmsPageAction(
  _prev: CmsActionState,
  formData: FormData,
): Promise<CmsActionState> {
  const actor = await requireAdmin();
  const parsed = createContentPageSchema.safeParse({
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    slug: formString(formData, "slug"),
  });
  if (!parsed.success) {
    return {
      error: "Formulaire invalide.",
      fieldErrors: formatZodFieldErrors(parsed.error),
    };
  }

  const unique = await assertUniquePageSlug(parsed.data.slug);
  if (!unique) {
    return {
      error: "Ce slug existe déjà.",
      fieldErrors: { slug: "Slug déjà utilisé." },
    };
  }

  const page = await createContentPage({
    ...parsed.data,
    actorId: actor.id,
  });

  const ctx = await getRequestAuditContext();
  await writeAuditLog({
    actorId: actor.id,
    action: auditActions.CMS_PAGE_CREATED,
    entityType: "ContentPage",
    entityId: page.id,
    metadata: { slug: page.slug },
    ...ctx,
  });
  await trackEvent({
    name: "admin_mutation",
    category: "ADMIN",
    path: adminRoutes.cms,
    actorKind: actorKindFromRole(actor.role),
  });

  revalidatePath(adminRoutes.cms);
  redirect(`${adminRoutes.cms}/${page.id}`);
}

export async function upsertCmsEntryAction(
  _prev: CmsActionState,
  formData: FormData,
): Promise<CmsActionState> {
  const actor = await requireAdmin();
  const parsed = upsertContentEntrySchema.safeParse({
    pageId: formString(formData, "pageId"),
    locale: formString(formData, "locale"),
    title: formString(formData, "title"),
    summary: formString(formData, "summary"),
    body: formString(formData, "body"),
  });
  if (!parsed.success) {
    return {
      error: "Formulaire invalide.",
      fieldErrors: formatZodFieldErrors(parsed.error),
    };
  }

  const page = await prisma.contentPage.findUnique({
    where: { id: parsed.data.pageId },
  });
  if (!page) {
    return { error: "Page introuvable." };
  }

  const entry = await upsertContentEntry({
    ...parsed.data,
    actorId: actor.id,
  });

  const ctx = await getRequestAuditContext();
  await writeAuditLog({
    actorId: actor.id,
    action: auditActions.CMS_ENTRY_UPSERTED,
    entityType: "ContentEntry",
    entityId: entry.id,
    metadata: { pageId: page.id, locale: entry.locale },
    ...ctx,
  });
  await trackEvent({
    name: "admin_mutation",
    category: "ADMIN",
    path: `${adminRoutes.cms}/${page.id}`,
    actorKind: actorKindFromRole(actor.role),
  });

  revalidatePath(`${adminRoutes.cms}/${page.id}`);
  return { ok: true };
}

export async function changeCmsStatusAction(
  _prev: CmsActionState,
  formData: FormData,
): Promise<CmsActionState> {
  const actor = await requireAdmin();
  const parsed = contentStatusSchema.safeParse({
    id: formString(formData, "id"),
    status: formString(formData, "status"),
    kind: formString(formData, "kind"),
  });
  if (!parsed.success) {
    return {
      error: "Statut invalide.",
      fieldErrors: formatZodFieldErrors(parsed.error),
    };
  }

  const ctx = await getRequestAuditContext();

  if (parsed.data.kind === "page") {
    const page = await setPageStatus(parsed.data.id, parsed.data.status, actor.id);
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.CMS_PAGE_STATUS_CHANGED,
      entityType: "ContentPage",
      entityId: page.id,
      metadata: { status: page.status },
      ...ctx,
    });
    await trackEvent({
      name: "admin_mutation",
      category: "ADMIN",
      path: `${adminRoutes.cms}/${page.id}`,
      actorKind: actorKindFromRole(actor.role),
    });
    revalidatePath(adminRoutes.cms);
    revalidatePath(`${adminRoutes.cms}/${page.id}`);
    return { ok: true };
  }

  const entry = await setEntryStatus(parsed.data.id, parsed.data.status, actor.id);
  await writeAuditLog({
    actorId: actor.id,
    action: auditActions.CMS_ENTRY_STATUS_CHANGED,
    entityType: "ContentEntry",
    entityId: entry.id,
    metadata: { status: entry.status, locale: entry.locale },
    ...ctx,
  });
  await trackEvent({
    name: "admin_mutation",
    category: "ADMIN",
    path: `${adminRoutes.cms}/${entry.pageId}`,
    actorKind: actorKindFromRole(actor.role),
  });
  revalidatePath(`${adminRoutes.cms}/${entry.pageId}`);
  return { ok: true };
}
