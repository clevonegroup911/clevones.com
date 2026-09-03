import type { AdminRole } from "@/lib/auth/admin-access";

export const adminRoleLabels: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super-administrateur",
  ADMIN: "Administrateur",
};
