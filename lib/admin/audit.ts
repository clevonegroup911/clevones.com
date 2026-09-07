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
