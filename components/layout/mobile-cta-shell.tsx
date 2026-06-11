"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { MobileStickyCta } from "@/components/layout/mobile-sticky-cta";
import { MOBILE_CTA_HIDDEN_PATHS } from "@/lib/constants/mobile-cta";
import { mobileCtaPadding } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

type SiteBodyChromeProps = {
  children: ReactNode;
};

export function SiteBodyChrome({ children }: SiteBodyChromeProps) {
  const pathname = usePathname();
  const showCta = !MOBILE_CTA_HIDDEN_PATHS.has(pathname);

  return (
    <>
      <main
        id="main-content"
        className={cn("flex-1", showCta && mobileCtaPadding)}
      >
        {children}
      </main>
      <Footer reserveMobileCtaSpace={showCta} />
      {showCta ? <MobileStickyCta /> : null}
    </>
  );
}
