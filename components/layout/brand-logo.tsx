import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const LOGO_ALT = "Clevones logo";
const MARK_SRC = "/brand/clevones-mark.svg";

const brandLinkClassName =
  "group relative inline-flex min-w-0 shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40";

type BrandLogoProps = {
  variant?: "header" | "footer";
  className?: string;
  href?: string;
};

export function BrandLogo({
  variant = "header",
  className,
  href = "/",
}: BrandLogoProps) {
  const isHeader = variant === "header";

  const iconFrameClass = isHeader
    ? "h-8 w-8 sm:h-[38px] sm:w-[38px]"
    : "h-12 w-12";

  const iconSize = isHeader ? 38 : 48;

  const mark = (
    <span
      className={cn(
        "inline-flex min-w-0 items-center",
        isHeader ? "gap-2.5 sm:gap-3" : "gap-3",
        className,
      )}
    >
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center",
          iconFrameClass,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MARK_SRC}
          alt={LOGO_ALT}
          width={iconSize}
          height={iconSize}
          className={cn(
            "h-full w-full object-contain",
            isHeader && "-translate-y-px",
          )}
          decoding="async"
          fetchPriority={isHeader ? "high" : undefined}
        />
      </span>
      <span className="inline-flex min-w-0 flex-col justify-center">
        <span
          className={cn(
            "block font-heading font-semibold tracking-tight text-white",
            isHeader ? "text-[20px] leading-none sm:text-[22px]" : "text-lg leading-tight sm:text-xl",
          )}
        >
          {siteConfig.name}
        </span>
        {isHeader ? (
          <span
            className="mt-1.5 block h-px w-full bg-gradient-to-r from-gold via-gold/50 to-transparent transition-all duration-300 group-hover:via-gold/70"
            aria-hidden
          />
        ) : (
          <span className="mt-1 block text-xs font-medium tracking-[0.12em] text-gold-muted uppercase sm:tracking-[0.15em]">
            {siteConfig.tagline}
          </span>
        )}
      </span>
    </span>
  );

  return (
    <Link
      href={href}
      className={brandLinkClassName}
      aria-label={`${siteConfig.name} — home`}
    >
      {mark}
    </Link>
  );
}
