import Link from "next/link";

import { Container } from "@/components/ui/container";
import { authRoutes } from "@/lib/auth";
import { siteConfig } from "@/lib/site";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-border-subtle bg-surface-elevated">
        <Container className="flex h-14 items-center justify-between gap-4">
          <Link
            href="/"
            className="font-heading text-sm font-semibold text-white"
          >
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden rounded-sm border border-border-subtle px-2.5 py-1 text-xs font-medium text-gold-muted sm:inline">
              Client portal
            </span>
            <Link
              href={authRoutes.signIn}
              className="text-xs font-medium text-gray-muted transition-colors hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </Container>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
