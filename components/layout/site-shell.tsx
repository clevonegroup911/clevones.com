import { headers } from "next/headers";

import { Header } from "@/components/layout/header";
import { SiteBodyChrome } from "@/components/layout/mobile-cta-shell";
import { getContent, getLocaleFromHeaders } from "@/lib/i18n";

type SiteShellProps = {
  children: React.ReactNode;
};

export async function SiteShell({ children }: SiteShellProps) {
  const locale = getLocaleFromHeaders(await headers());
  const { shell } = getContent(locale);
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-charcoal" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/50 via-charcoal to-charcoal" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(26,43,72,0.55),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_100%_100%,rgba(212,160,23,0.06),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-subtle/60 to-transparent" />
      </div>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-sm focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-charcoal"
      >
        {shell.skipToContent}
      </a>

      <Header />
      <SiteBodyChrome>{children}</SiteBodyChrome>
    </div>
  );
}
