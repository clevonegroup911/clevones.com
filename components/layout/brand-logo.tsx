import Image from "next/image";
import Link from "next/link";

import { company } from "@/lib/constants/company";
import { cn } from "@/lib/utils";

/**
 * Official CLEVONE SARL identity — files supplied by management
 * (public/brand/official). Never recolor, distort or crop them: only the
 * supplied symbol / full logo files are used, at their native aspect ratio.
 */
const LOGO_ALT = "CLEVONE SARL — clevones.com";
const SYMBOL_SRC = "/brand/official/clevone-sarl-symbol.png"; // 978×978
const FULL_LOGO_SRC = "/brand/official/clevone-sarl-logo.png"; // 1637×1321

const brandLinkClassName =
  "group relative inline-flex min-w-0 shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

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
  if (variant === "footer") {
    return (
      <Link
        href={href}
        className={cn(brandLinkClassName, className)}
        aria-label={`${company.brandName} — home`}
      >
        <Image
          src={FULL_LOGO_SRC}
          alt={LOGO_ALT}
          width={1637}
          height={1321}
          sizes="160px"
          className="h-auto w-36 sm:w-40"
        />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(brandLinkClassName, className)}
      aria-label={`${company.brandName} — home`}
    >
      <span className="inline-flex min-w-0 items-center gap-2.5 sm:gap-3">
        <Image
          src={SYMBOL_SRC}
          alt={LOGO_ALT}
          width={978}
          height={978}
          sizes="44px"
          priority
          className="h-9 w-9 shrink-0 sm:h-11 sm:w-11"
        />
        <span className="block font-heading text-[20px] leading-none font-semibold tracking-tight text-navy sm:text-[22px]">
          {company.brandName}
        </span>
      </span>
    </Link>
  );
}
