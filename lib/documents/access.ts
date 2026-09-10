import type {
  Document,
  DocumentAccessLevel,
  UserRole,
} from "@prisma/client";

export type DocumentActor = {
  id: string;
  role: UserRole;
};

export type DocumentAccessAction = "list" | "read" | "upload" | "delete";

export type DocumentAccessDecision = {
  allowed: boolean;
  reason: string;
};

/**
 * Document ACL (T021).
 * SUPER_ADMIN: all
 * ADMIN: own documents, INTERNAL, or explicit grant
 * USER: grant or own only
 */
export function canAccessDocument(
  actor: DocumentActor,
  document: Pick<Document, "ownerId" | "accessLevel" | "deletedAt">,
  action: DocumentAccessAction,
  options: { hasGrant?: boolean } = {},
): DocumentAccessDecision {
  if (document.deletedAt && action !== "list") {
    return { allowed: false, reason: "document_deleted" };
  }

  if (actor.role === "SUPER_ADMIN") {
    return { allowed: true, reason: "super_admin" };
  }

  const isOwner = document.ownerId === actor.id;
  const hasGrant = options.hasGrant === true;
  const level = document.accessLevel as DocumentAccessLevel;

  if (actor.role === "ADMIN") {
    if (action === "upload") {
      return { allowed: true, reason: "admin_upload" };
    }
    if (isOwner) {
      return { allowed: true, reason: "owner" };
    }
    if (level === "INTERNAL" && (action === "list" || action === "read")) {
      return { allowed: true, reason: "internal_admin" };
    }
    if (hasGrant && (action === "list" || action === "read")) {
      return { allowed: true, reason: "grant" };
    }
    return { allowed: false, reason: "admin_scope_denied" };
  }

  // USER
  if (action === "upload") {
    return { allowed: true, reason: "user_upload_own" };
  }
  if (isOwner && (action === "list" || action === "read" || action === "delete")) {
    return { allowed: true, reason: "owner" };
  }
  if (hasGrant && (action === "list" || action === "read")) {
    return { allowed: true, reason: "grant" };
  }
  return { allowed: false, reason: "user_denied" };
}

export function documentListFilterForActor(actor: DocumentActor): {
  mode: "all" | "scoped";
  ownerId?: string;
  includeInternal?: boolean;
} {
  if (actor.role === "SUPER_ADMIN") {
    return { mode: "all" };
  }
  if (actor.role === "ADMIN") {
    return { mode: "scoped", ownerId: actor.id, includeInternal: true };
  }
  return { mode: "scoped", ownerId: actor.id, includeInternal: false };
}
