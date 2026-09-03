import { createPageMetadata } from "@/lib/metadata";

import { requireAdmin } from "@/lib/auth/require-admin";
import { adminRoleLabels } from "@/lib/admin/role-labels";

export const metadata = createPageMetadata({
  title: "Admin dashboard",
  description: "Protected administrative dashboard.",
  path: "/admin/dashboard",
  robots: { index: false, follow: false },
});

export default async function AdminDashboardPage() {
  const actor = await requireAdmin();

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-gray-muted">
          Connecté en tant que {actor.firstName} {actor.lastName} (
          {adminRoleLabels[actor.role]}).
        </p>
      </div>

      <div className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">Accès sécurisé</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-muted">
          <li>Accès réservé aux rôles SUPER_ADMIN et ADMIN.</li>
          <li>Cookies de session protégés (HttpOnly, Secure, SameSite Strict).</li>
          <li>Traçage via table AuditLog pour les actions administratives.</li>
        </ul>
      </div>
    </div>
  );
}
