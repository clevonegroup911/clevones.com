import Link from "next/link";

import { createPageMetadata } from "@/lib/metadata";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { platformRoutes } from "@/lib/auth";

export const metadata = createPageMetadata({
  title: "Sign in",
  description:
    "Sign in to the Clevones client portal for secure access to governance dashboards and institutional collaboration tools.",
  path: "/sign-in",
  robots: { index: false, follow: false },
});

export default function SignInPage() {
  return (
    <Card variant="elevated" padding="md" className="sm:p-8">
      <h1 className="font-heading text-2xl font-semibold text-white">Sign in</h1>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-gray-muted">
        Access the Clevones client portal. Authentication will be connected to
        your identity provider in a future release.
      </p>

      <form className="mt-8 space-y-5" action={platformRoutes.portal}>
        <FormField id="email" label="Email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@organization.com"
          />
        </FormField>
        <FormField id="password" label="Password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
          />
        </FormField>
        <Button type="submit" size="lg" className="w-full">
          Continue to portal
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-muted">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-medium text-gold-muted transition-colors hover:text-gold"
        >
          Back to institutional site
        </Link>
      </p>
    </Card>
  );
}
