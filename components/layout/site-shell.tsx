import { headers } from "next/headers";

import { Header } from "@/components/layout/header";
import { SiteBodyChrome } from "@/components/layout/mobile-cta-shell";
import { recordPageView } from "@/lib/analytics/page-view";
import { getContent, getLocaleFromHeaders } from "@/lib/i18n";

type SiteShellProps = {
  children: React.ReactNode;
};

export async function SiteShell({ children }: SiteShellProps) {
  const locale = getLocaleFromHeaders(await headers());
  const { shell } = getContent(locale);
  await recordPageView("/");
  return (
    <div className="site-light relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
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
