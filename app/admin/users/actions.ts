"use server";

import { revalidatePath } from "next/cache";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { adminRoutes } from "@/lib/auth/routes";
import {
  createDocumentGrant,
  DocumentGrantError,
  revokeDocumentGrant,
} from "@/lib/documents/grants";
import {
  createManagedUser,
  createManagedUserSchema,
  disableManagedUser,
  ManagedUserError,
} from "@/lib/auth/managed-users";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formatZodFieldErrors } from "@/lib/validation/admin-auth";

export type AdminUsersActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
  message?: string;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createManagedUserAction(
  _prev: AdminUsersActionState,
  formData: FormData,
): Promise<AdminUsersActionState> {
  const actor = await requireAdmin();
  const parsed = createManagedUserSchema.safeParse({
    email: formString(formData, "email"),
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    password: formString(formData, "password"),
    role: formString(formData, "role"),
  });
  if (!parsed.success) {
    return {
      error: "Formulaire invalide.",
      fieldErrors: formatZodFieldErrors(parsed.error),
    };
  }

  try {
    const user = await createManagedUser(parsed.data);
    const ctx = await getRequestAuditContext();
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.USER_CREATED,
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role, status: user.status },
      ...ctx,
    });
    revalidatePath(adminRoutes.users);
    return { ok: true, message: `Compte ${user.email} créé.` };
  } catch (error) {
    if (error instanceof ManagedUserError) {
      return { error: error.message };
    }
    return { error: "Création impossible pour le moment." };
  }
}

export async function disableManagedUserAction(
  _prev: AdminUsersActionState,
  formData: FormData,
): Promise<AdminUsersActionState> {
  const actor = await requireAdmin();
  const userId = formString(formData, "userId");
  if (!userId) {
    return { error: "Identifiant manquant." };
  }

  try {
    const user = await disableManagedUser(userId);
    const ctx = await getRequestAuditContext();
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.USER_DISABLED,
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
      ...ctx,
    });
    revalidatePath(adminRoutes.users);
    return { ok: true, message: `Compte ${user.email} désactivé.` };
  } catch (error) {
    if (error instanceof ManagedUserError) {
      return { error: error.message };
    }
    return { error: "Désactivation impossible pour le moment." };
  }
}

export async function createDocumentGrantAction(
  _prev: AdminUsersActionState,
  formData: FormData,
): Promise<AdminUsersActionState> {
  const actor = await requireAdmin();
  const documentId = formString(formData, "documentId");
  const userId = formString(formData, "userId");
  const canRead = formString(formData, "canRead") === "true";
  const canWrite = formString(formData, "canWrite") === "true";
  if (!documentId || !userId) {
    return { error: "documentId et userId sont requis." };
  }

  try {
    const grant = await createDocumentGrant({
      documentId,
      userId,
      canRead,
      canWrite,
    });
    const ctx = await getRequestAuditContext();
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.DOCUMENT_GRANT_CREATED,
      entityType: "DocumentGrant",
      entityId: grant.id,
      metadata: {
        documentId: grant.documentId,
        userId: grant.userId,
        canRead: grant.canRead,
        canWrite: grant.canWrite,
      },
      ...ctx,
    });
    revalidatePath(adminRoutes.users);
    return { ok: true, message: "Grant créé." };
  } catch (error) {
    if (error instanceof DocumentGrantError) {
      return { error: error.message };
    }
    return { error: "Création du grant impossible." };
  }
}

export async function revokeDocumentGrantAction(
  _prev: AdminUsersActionState,
  formData: FormData,
): Promise<AdminUsersActionState> {
  const actor = await requireAdmin();
  const documentId = formString(formData, "documentId");
  const userId = formString(formData, "userId");
  if (!documentId || !userId) {
    return { error: "documentId et userId sont requis." };
  }

  try {
    const grant = await revokeDocumentGrant({ documentId, userId });
    const ctx = await getRequestAuditContext();
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.DOCUMENT_GRANT_REVOKED,
      entityType: "DocumentGrant",
      entityId: grant.id,
      metadata: { documentId: grant.documentId, userId: grant.userId },
      ...ctx,
    });
    revalidatePath(adminRoutes.users);
    return { ok: true, message: "Grant révoqué." };
  } catch (error) {
    if (error instanceof DocumentGrantError) {
      return { error: error.message };
    }
    return { error: "Révocation du grant impossible." };
  }
}
