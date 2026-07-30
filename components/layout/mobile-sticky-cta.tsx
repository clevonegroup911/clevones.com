"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useMobileCta } from "@/components/layout/mobile-cta-provider";
import { MOBILE_CTA_HIDDEN_PATHS } from "@/lib/constants/mobile-cta";
import { getContent, getLocaleFromPath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MobileStickyCta() {
  const pathname = usePathname();
  const { isVisible } = useMobileCta();
  const { shell } = getContent(getLocaleFromPath(pathname));

  if (MOBILE_CTA_HIDDEN_PATHS.has(pathname)) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        "transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0",
      )}
      aria-hidden={!isVisible}
    >
      <div
        className={cn(
          "border-t border-border-subtle/60 bg-surface-elevated/95 px-4 py-2.5 backdrop-blur-xl",
          "shadow-[0_-8px_32px_rgba(0,0,0,0.35)] supports-[backdrop-filter]:bg-surface-elevated/90",
          isVisible ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <Link
          href={shell.cta.href}
          tabIndex={isVisible ? undefined : -1}
          className="flex h-11 w-full items-center justify-center rounded-sm bg-gold px-6 text-center text-sm font-medium tracking-wide text-charcoal transition-colors hover:bg-gold-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
        >
          <span className="sm:hidden">{shell.cta.shortLabel}</span>
          <span className="hidden sm:inline">{shell.cta.label}</span>
        </Link>
      </div>
    </div>
  );
}
