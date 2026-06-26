"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import {
  MobileCtaProvider,
  useMobileCta,
} from "@/components/layout/mobile-cta-provider";
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
    <MobileCtaProvider key={pathname} enabled={showCta}>
      <SiteBodyChromeInner showCta={showCta}>{children}</SiteBodyChromeInner>
    </MobileCtaProvider>
  );
}

type SiteBodyChromeInnerProps = {
  children: ReactNode;
  showCta: boolean;
};

function SiteBodyChromeInner({ children, showCta }: SiteBodyChromeInnerProps) {
  const { isVisible } = useMobileCta();
  const reserveSpace = showCta && isVisible;

  return (
    <>
      <main
        id="main-content"
        className={cn("flex-1", reserveSpace && mobileCtaPadding)}
      >
        {children}
      </main>
      <Footer reserveMobileCtaSpace={reserveSpace} />
      {showCta ? <MobileStickyCta /> : null}
    </>
  );
}
