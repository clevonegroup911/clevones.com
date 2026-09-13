import type { UserRole, UserStatus } from "@/lib/auth/admin-access";

export type PortalActor = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

export function canAccessPortal(
  user: Pick<{ role: UserRole; status: UserStatus }, "role" | "status">,
): boolean {
  return user.status === "ACTIVE";
}

export function canSignInAsPortalUser(
  user: Pick<{ role: UserRole; status: UserStatus }, "role" | "status">,
): boolean {
  return user.role === "USER" && user.status === "ACTIVE";
}

export function getPortalAccessDenialReason(
  user: Pick<{ role: UserRole; status: UserStatus }, "role" | "status">,
): string | null {
  if (user.status === "DISABLED") {
    return "disabled";
  }
  if (user.status === "PENDING") {
    return "pending";
  }
  if (user.status !== "ACTIVE") {
    return "inactive";
  }
  return null;
}

export function getPortalSignInDenialReason(
  user: Pick<{ role: UserRole; status: UserStatus }, "role" | "status">,
): string | null {
  if (user.role !== "USER") {
    return "insufficient_role";
  }
  return getPortalAccessDenialReason(user);
}

export function toPortalActor(
  user: Pick<
    {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    },
    "id" | "email" | "firstName" | "lastName" | "role"
  >,
): PortalActor {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}
