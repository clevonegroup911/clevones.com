import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-charcoal">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-charcoal to-charcoal" />
      </div>

      <header className="border-b border-border-subtle/50">
        <Container className="flex h-16 items-center">
          <Link
            href="/"
            className="font-heading text-lg font-semibold text-white"
          >
            {siteConfig.name}
          </Link>
        </Container>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
