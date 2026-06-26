"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getContent, getLocaleFromPath } from "@/lib/i18n";
import { navigation, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { shell } = getContent(locale);
  const [isOpen, setIsOpen] = useState(false);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      firstMobileLinkRef.current?.focus();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle/50 bg-surface-elevated/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-3 sm:h-[4.5rem] sm:gap-4">
        <BrandLogo variant="header" />

        <nav
          className="hidden items-center gap-x-4 lg:gap-x-5 xl:gap-x-6 lg:flex"
          aria-label="Primary navigation"
        >
          {navigation.main.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              className={cn(
                "text-sm font-medium transition-colors focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
                isActivePath(pathname, item.href)
                  ? "text-white"
                  : "text-gray-muted hover:text-white focus-visible:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <LanguageSwitcher label={shell.languageSwitcherLabel} />
          <Link
            href="/sign-in"
            className="text-sm font-medium text-gray-muted transition-colors hover:text-white focus-visible:rounded-sm focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            {shell.signIn}
          </Link>
          <ButtonLink
            href={siteConfig.cta.href}
            size="md"
            variant="secondary"
            className="hidden px-5 xl:inline-flex"
          >
            {siteConfig.cta.label}
          </ButtonLink>
          <ButtonLink
            href={siteConfig.cta.href}
            size="md"
            variant="secondary"
            className="px-5 xl:hidden"
          >
            {siteConfig.cta.shortLabel}
          </ButtonLink>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-sm border border-border-subtle text-white transition-colors hover:border-gold/30 hover:bg-white/5 lg:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </Container>

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 top-16 z-40 bg-charcoal/75 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      ) : null}

      <div
        id="mobile-menu"
        className={cn(
          "border-t border-border-subtle/50 bg-surface-elevated/98 backdrop-blur-xl lg:hidden",
          isOpen
            ? "fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
            : "hidden",
        )}
      >
        <Container className="flex flex-col gap-1 py-4 pb-6">
          <nav aria-label="Mobile navigation">
            {navigation.main.map((item, index) => (
              <Link
                key={item.href}
                ref={index === 0 ? firstMobileLinkRef : undefined}
                href={item.href}
                aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "touch-target flex items-center rounded-sm px-3 py-3 text-base font-medium transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
                  isActivePath(pathname, item.href)
                    ? "bg-white/5 text-white"
                    : "text-gray-muted hover:text-white focus-visible:text-white",
                )}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle/50 pt-4">
            <div className="flex justify-center px-3 py-2">
              <LanguageSwitcher label={shell.languageSwitcherLabel} />
            </div>
            <Link
              href="/sign-in"
              className="touch-target flex items-center justify-center rounded-sm px-3 py-3 text-center text-base font-medium text-gray-muted transition-colors hover:bg-white/5 hover:text-white"
              onClick={closeMenu}
            >
              {shell.signIn}
            </Link>
            <ButtonLink
              href={siteConfig.cta.href}
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={closeMenu}
            >
              {siteConfig.cta.shortLabel}
            </ButtonLink>
          </div>
        </Container>
      </div>
    </header>
  );
}
