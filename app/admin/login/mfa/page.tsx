import { createPageMetadata } from "@/lib/metadata";

import MfaVerifyForm from "@/app/admin/login/mfa/mfa-verify-form";
import { readMfaChallengeClaims } from "@/lib/auth/mfa-challenge";
import { adminRoutes } from "@/lib/auth";
import { redirectIfAdminAuthenticated } from "@/lib/auth/require-admin";

export const metadata = createPageMetadata({
  title: "Admin MFA",
  description: "Vérification d'authentification administrative.",
  path: "/admin/login/mfa",
  robots: { index: false, follow: false },
});

export default async function AdminMfaVerifyPage() {
  await redirectIfAdminAuthenticated();
  const challenge = await readMfaChallengeClaims();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <MfaVerifyForm challengeValid={Boolean(challenge)} loginHref={adminRoutes.login} />
      </div>
    </div>
  );
}
