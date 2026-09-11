import { createPageMetadata } from "@/lib/metadata";

import Link from "next/link";

import { requireAdmin } from "@/lib/auth/require-admin";
import { adminRoutes } from "@/lib/auth";
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

      <div className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">CMS interne</h2>
        <p className="mt-2 text-sm text-gray-muted">
          Créer, prévisualiser et publier des pages FR/EN (DRAFT / PUBLISHED / ARCHIVED).
        </p>
        <Link
          href={adminRoutes.cms}
          className="mt-4 inline-flex text-sm font-medium text-gold-muted transition-colors hover:text-gold"
        >
          Ouvrir le CMS
        </Link>
      </div>

      {actor.role === "SUPER_ADMIN" ? (
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold text-white">Sécurité / MFA</h2>
          <p className="mt-2 text-sm text-gray-muted">
            {actor.mfaEnabled
              ? "L'authentification multifacteur est active sur ce compte."
              : "Activez l'authentification multifacteur pour renforcer la protection de ce compte."}
          </p>
          <Link
            href={adminRoutes.securityMfa}
            className="mt-4 inline-flex text-sm font-medium text-gold-muted transition-colors hover:text-gold"
          >
            Gérer la MFA
          </Link>
        </div>
      ) : null}
    </div>
  );
}
