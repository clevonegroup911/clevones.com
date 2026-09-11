import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const auditActions = {
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILURE: "AUTH_LOGIN_FAILURE",
  ADMIN_LOGOUT: "ADMIN_LOGOUT",
  USER_CREATED: "USER_CREATED",
  MFA_ENROLLMENT_STARTED: "MFA_ENROLLMENT_STARTED",
  MFA_ENABLED: "MFA_ENABLED",
  MFA_LOGIN_SUCCESS: "MFA_LOGIN_SUCCESS",
  MFA_LOGIN_FAILED: "MFA_LOGIN_FAILED",
  MFA_RECOVERY_CODE_USED: "MFA_RECOVERY_CODE_USED",
  MFA_DISABLED: "MFA_DISABLED",
  CMS_PAGE_CREATED: "CMS_PAGE_CREATED",
  CMS_PAGE_UPDATED: "CMS_PAGE_UPDATED",
  CMS_PAGE_STATUS_CHANGED: "CMS_PAGE_STATUS_CHANGED",
  CMS_ENTRY_UPSERTED: "CMS_ENTRY_UPSERTED",
  CMS_ENTRY_STATUS_CHANGED: "CMS_ENTRY_STATUS_CHANGED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_DOWNLOADED: "DOCUMENT_DOWNLOADED",
  DOCUMENT_SOFT_DELETED: "DOCUMENT_SOFT_DELETED",
  DOCUMENT_ACCESS_DENIED: "DOCUMENT_ACCESS_DENIED",
} as const;

export type AuditAction = (typeof auditActions)[keyof typeof auditActions];

type AuditClient = PrismaClient | Prisma.TransactionClient;

type JsonValue =
  | string
  | number
  | boolean
  | { [key: string]: JsonValue }
  | JsonValue[];

type WriteAuditLogInput = {
  actorId?: string | null;
  action: AuditAction;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: JsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(
  input: WriteAuditLogInput,
  client: AuditClient = prisma,
): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: input.metadata,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

export const CRITICAL_AUTH_AUDIT_ACTIONS = [
  auditActions.AUTH_LOGIN_FAILURE,
  auditActions.MFA_LOGIN_FAILED,
] as const;

export type AuthAuditSignalCounts = {
  loginFailures: number;
  mfaFailures: number;
  mfaSuccesses: number;
  recoveryUsed: number;
  loginSuccesses: number;
};

export function isCriticalAuthAuditAction(action: string): boolean {
  return (
    action === auditActions.AUTH_LOGIN_FAILURE ||
    action === auditActions.MFA_LOGIN_FAILED
  );
}

/** Count auth/MFA audit actions only. Never inspect metadata, IPs, or secrets. */
export function countAuthAuditSignals(
  actions: readonly string[],
): AuthAuditSignalCounts {
  const counts: AuthAuditSignalCounts = {
    loginFailures: 0,
    mfaFailures: 0,
    mfaSuccesses: 0,
    recoveryUsed: 0,
    loginSuccesses: 0,
  };

  for (const action of actions) {
    if (action === auditActions.AUTH_LOGIN_FAILURE) {
      counts.loginFailures += 1;
    } else if (action === auditActions.MFA_LOGIN_FAILED) {
      counts.mfaFailures += 1;
    } else if (action === auditActions.MFA_LOGIN_SUCCESS) {
      counts.mfaSuccesses += 1;
    } else if (action === auditActions.MFA_RECOVERY_CODE_USED) {
      counts.recoveryUsed += 1;
    } else if (action === auditActions.AUTH_LOGIN_SUCCESS) {
      counts.loginSuccesses += 1;
    }
  }

  return counts;
}
