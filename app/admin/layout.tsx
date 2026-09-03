import type { ReactNode } from "react";

import Link from "next/link";

import { logoutAdmin } from "@/app/admin/actions";
import { Container } from "@/components/ui/container";
import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { siteConfig } from "@/lib/site";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const actor = await getOptionalAdminActor();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-border-subtle bg-surface-elevated">
        <Container className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="font-heading text-sm font-semibold text-white">
            {siteConfig.name}
          </Link>
          {actor ? (
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="rounded-sm border border-border-subtle px-2.5 py-1 text-xs font-medium text-gold-muted transition-colors hover:border-gold/30 hover:text-gold"
              >
                Déconnexion
              </button>
            </form>
          ) : (
            <Link
              href="/admin/login"
              className="rounded-sm border border-border-subtle px-2.5 py-1 text-xs font-medium text-gold-muted transition-colors hover:border-gold/30 hover:text-gold"
            >
              Admin
            </Link>
          )}
        </Container>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
