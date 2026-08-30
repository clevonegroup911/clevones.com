import Link from "next/link";

import { createPageMetadata } from "@/lib/metadata";

import { Card } from "@/components/ui/card";

export const metadata = createPageMetadata({
  title: "Sign in",
  description:
    "Client portal access is not yet available. CLEVONE SARL will open authentication through official channels when the service is live.",
  path: "/sign-in",
  robots: { index: false, follow: false },
});

export default function SignInPage() {
  return (
    <Card variant="elevated" padding="md" className="sm:p-8">
      <h1 className="font-heading text-2xl font-semibold text-white">
        Bientôt disponible
      </h1>
      <p className="mt-2 text-sm font-medium text-gold-muted">Coming soon</p>
      <p className="mt-4 text-sm leading-relaxed text-pretty text-gray-muted">
        Le portail client n&apos;est pas encore disponible. Aucun système
        d&apos;authentification n&apos;est ouvert sur ce site.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-pretty text-gray-muted">
        The client portal is not yet available. No authentication system is live
        on this website.
      </p>

      <p className="mt-6 text-center text-sm text-gray-muted">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-medium text-gold-muted transition-colors hover:text-gold"
        >
          Retour au site / Back to site
        </Link>
      </p>
    </Card>
  );
}
