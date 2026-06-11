"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MOBILE_CTA_HIDDEN_PATHS } from "@/lib/constants/mobile-cta";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function MobileStickyCta() {
  const pathname = usePathname();

  if (MOBILE_CTA_HIDDEN_PATHS.has(pathname)) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <div className="pointer-events-auto border-t border-border-subtle/60 bg-surface-elevated/95 px-4 py-3 backdrop-blur-xl">
        <Link
          href={siteConfig.cta.href}
          className="flex h-12 w-full items-center justify-center rounded-sm bg-gold px-6 text-center text-sm font-medium tracking-wide text-charcoal transition-colors hover:bg-gold-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
        >
          <span className="sm:hidden">{siteConfig.cta.shortLabel}</span>
          <span className="hidden sm:inline">{siteConfig.cta.label}</span>
        </Link>
      </div>
    </div>
  );
}
