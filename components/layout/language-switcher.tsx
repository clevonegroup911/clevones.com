"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getAlternatePath,
  getContent,
  getLocaleFromPath,
  localeConfig,
  locales,
  type Locale,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  label: string;
  className?: string;
};

export function LanguageSwitcher({ label, className }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const currentLocale = getLocaleFromPath(pathname);
  const { shell } = getContent(currentLocale);

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-sm border border-border-subtle/80 p-0.5",
        className,
      )}
    >
      {locales.map((locale) => (
        <LanguageOption
          key={locale}
          locale={locale}
          isActive={locale === currentLocale}
          href={getAlternatePath(pathname, locale)}
          unavailableLabel={shell.languageUnavailable}
        />
      ))}
    </div>
  );
}

type LanguageOptionProps = {
  locale: Locale;
  isActive: boolean;
  href: string | undefined;
  unavailableLabel: string;
};

function LanguageOption({
  locale,
  isActive,
  href,
  unavailableLabel,
}: LanguageOptionProps) {
  const { htmlLang, label: localeLabel } = localeConfig[locale];

  if (isActive) {
    return (
      <span
        aria-current="true"
        lang={htmlLang}
        className="inline-flex min-h-8 min-w-9 items-center justify-center rounded-sm bg-white/10 px-2.5 text-xs font-semibold tracking-wide text-white"
      >
        {localeLabel}
      </span>
    );
  }

  if (!href) {
    return (
      <span
        aria-disabled="true"
        lang={htmlLang}
        title={unavailableLabel}
        className="inline-flex min-h-8 min-w-9 cursor-not-allowed items-center justify-center rounded-sm px-2.5 text-xs font-medium tracking-wide text-gray-muted/50"
      >
        {localeLabel}
      </span>
    );
  }

  return (
    <Link
      href={href}
      hrefLang={htmlLang}
      lang={htmlLang}
      className="inline-flex min-h-8 min-w-9 items-center justify-center rounded-sm px-2.5 text-xs font-medium tracking-wide text-gray-muted transition-colors hover:bg-white/5 hover:text-white focus-visible:bg-white/5 focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
    >
      {localeLabel}
    </Link>
  );
}
