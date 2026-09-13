import type { UserRole } from "@/lib/auth/admin-access";

/** Admin payment console: SUPER_ADMIN / ADMIN only. */
export function canAccessAdminPayments(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

/** Authenticated client payment status surface (own orders only). */
export function canAccessClientPayments(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "USER";
}

export function assertAdminPaymentsAccess(role: UserRole): void {
  if (!canAccessAdminPayments(role)) {
    throw new Error("ADMIN_PAYMENTS_FORBIDDEN");
  }
}
