export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";

export type UserStatus = "ACTIVE" | "DISABLED" | "PENDING";

export const adminRoles = ["SUPER_ADMIN", "ADMIN"] as const;

export type AdminRole = (typeof adminRoles)[number];

export type AdminActor = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
};

export function isAdminRole(role: UserRole): role is AdminRole {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canAccessAdminConsole(
  user: Pick<{ role: UserRole; status: UserStatus; mfaEnabled: boolean }, "role" | "status" | "mfaEnabled">,
) {
  return isAdminRole(user.role) && user.status === "ACTIVE" && !user.mfaEnabled;
}

export function toAdminActor(
  user: Pick<
    { id: string; email: string; firstName: string; lastName: string; role: UserRole },
    "id" | "email" | "firstName" | "lastName" | "role"
  >,
): AdminActor | null {
  if (!isAdminRole(user.role)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

export function getAdminAccessDenialReason(
  user: Pick<
    { role: UserRole; status: UserStatus; mfaEnabled: boolean },
    "role" | "status" | "mfaEnabled"
  >,
): string | null {
  if (!isAdminRole(user.role)) {
    return "insufficient_role";
  }

  if (user.status === "DISABLED") {
    return "disabled";
  }

  if (user.status === "PENDING") {
    return "pending";
  }

  if (user.status !== "ACTIVE") {
    return "inactive";
  }

  if (user.mfaEnabled) {
    return "mfa_unavailable";
  }

  return null;
}

export function isActiveStatus(status: UserStatus): boolean {
  return status === "ACTIVE";
}
