import { createPageMetadata } from "@/lib/metadata";

import { requireAdmin } from "@/lib/auth/require-admin";
import MfaSettingsPanel from "@/app/admin/security/mfa/mfa-settings-panel";

export const metadata = createPageMetadata({
  title: "Sécurité MFA",
  description: "Gestion de l'authentification multifacteur administrateur.",
  path: "/admin/security/mfa",
  robots: { index: false, follow: false },
});

export default async function AdminMfaSecurityPage() {
  const actor = await requireAdmin();

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-white">
          Sécurité / MFA
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-gray-muted">
          Authentification à deux facteurs pour le compte super-administrateur.
        </p>
      </div>

      <MfaSettingsPanel
        isSuperAdmin={actor.role === "SUPER_ADMIN"}
        mfaEnabled={actor.mfaEnabled}
      />
    </div>
  );
}
