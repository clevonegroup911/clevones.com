import type { ReactNode } from "react";

import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-border-subtle bg-surface-elevated">
        <Container className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="font-heading text-sm font-semibold text-white">
            {siteConfig.name}
          </Link>
          <Link
            href="/admin/login"
            className="rounded-sm border border-border-subtle px-2.5 py-1 text-xs font-medium text-gold-muted transition-colors hover:border-gold/30 hover:text-gold"
          >
            Admin
          </Link>
        </Container>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
