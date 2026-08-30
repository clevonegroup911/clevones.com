"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  findPageKeyByPath,
  getContent,
  getLocaleFromPath,
  getNavigation,
  resolvePagePath,
  type LocalizedNavItem,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

function isActiveNavItem(pathname: string, item: LocalizedNavItem) {
  if (item.pageKey) {
    if (findPageKeyByPath(pathname) === item.pageKey) {
      return true;
    }

    if (
      item.pageKey === "solutions" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`))
    ) {
      return true;
    }

    return false;
  }

  if (item.href === "/") {
    return pathname === "/";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function Header() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { shell } = getContent(locale);
  const navigation = getNavigation(locale);
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const secondaryActive = navigation.secondary.some((item) =>
    isActiveNavItem(pathname, item),
  );

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
        setIsMoreOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      firstMobileLinkRef.current?.focus();
    } else if (isMoreOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isMoreOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        isMoreOpen &&
        moreRef.current &&
        !moreRef.current.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isMoreOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle/50 bg-surface-elevated/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-3 sm:h-[4.5rem] sm:gap-4">
        <BrandLogo
          variant="header"
          href={resolvePagePath("home", locale) ?? "/"}
        />

        <nav
          className="hidden items-center gap-x-2.5 text-[13px] lg:gap-x-3 xl:gap-x-4 lg:flex xl:text-sm"
          aria-label={shell.primaryNavigationLabel}
        >
          {navigation.main.map((item) => (
            <Link
              key={item.pageKey ?? item.href}
              href={item.href}
              aria-current={isActiveNavItem(pathname, item) ? "page" : undefined}
              className={cn(
                "text-sm font-medium transition-colors focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
                isActiveNavItem(pathname, item)
                  ? "text-white"
                  : "text-gray-muted hover:text-white focus-visible:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
          {navigation.secondary.length > 0 ? (
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium transition-colors focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
                  secondaryActive || isMoreOpen
                    ? "text-white"
                    : "text-gray-muted hover:text-white",
                )}
                aria-expanded={isMoreOpen}
                aria-haspopup="true"
                aria-controls="desktop-more-menu"
                onClick={() => setIsMoreOpen((prev) => !prev)}
              >
                {shell.footerSecondary}
                <svg
                  className="h-3.5 w-3.5 opacity-70"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {isMoreOpen ? (
                <div
                  id="desktop-more-menu"
                  role="menu"
                  aria-label={shell.secondaryNavigationLabel}
                  className="absolute top-full left-0 z-50 mt-2 min-w-[12rem] rounded-sm border border-border-subtle/60 bg-surface-elevated py-2 shadow-lg"
                >
                  {navigation.secondary.map((item) => (
                    <Link
                      key={item.pageKey ?? item.href}
                      role="menuitem"
                      href={item.href}
                      aria-current={
                        isActiveNavItem(pathname, item) ? "page" : undefined
                      }
                      className={cn(
                        "block px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/40",
                        isActiveNavItem(pathname, item)
                          ? "bg-white/5 text-white"
                          : "text-gray-muted hover:bg-white/5 hover:text-white",
                      )}
                      onClick={() => setIsMoreOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <LanguageSwitcher label={shell.languageSwitcherLabel} />
          <ButtonLink
            href={shell.cta.href}
            size="md"
            variant="secondary"
            className="hidden px-5 xl:inline-flex"
          >
            {shell.cta.label}
          </ButtonLink>
          <ButtonLink
            href={shell.cta.href}
            size="md"
            variant="secondary"
            className="px-5 xl:hidden"
          >
            {shell.cta.shortLabel}
          </ButtonLink>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-sm border border-border-subtle text-white transition-colors hover:border-gold/30 hover:bg-white/5 lg:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? shell.closeMenu : shell.openMenu}
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
          aria-label={shell.closeMenu}
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
          <nav aria-label={shell.mobileNavigationLabel}>
            {navigation.main.map((item, index) => (
              <Link
                key={item.pageKey ?? item.href}
                ref={index === 0 ? firstMobileLinkRef : undefined}
                href={item.href}
                aria-current={isActiveNavItem(pathname, item) ? "page" : undefined}
                className={cn(
                  "touch-target flex items-center rounded-sm px-3 py-3 text-base font-medium transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
                  isActiveNavItem(pathname, item)
                    ? "bg-white/5 text-white"
                    : "text-gray-muted hover:text-white focus-visible:text-white",
                )}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {navigation.secondary.length > 0 ? (
            <nav
              aria-label={shell.secondaryNavigationLabel}
              className="mt-2 border-t border-border-subtle/50 pt-2"
            >
              {navigation.secondary.map((item) => (
                <Link
                  key={item.pageKey ?? item.href}
                  href={item.href}
                  aria-current={isActiveNavItem(pathname, item) ? "page" : undefined}
                  className={cn(
                    "touch-target flex items-center rounded-sm px-3 py-3 text-base font-medium transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
                    isActiveNavItem(pathname, item)
                      ? "bg-white/5 text-white"
                      : "text-gray-muted hover:text-white focus-visible:text-white",
                  )}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle/50 pt-4">
            <div className="flex justify-center px-3 py-2">
              <LanguageSwitcher label={shell.languageSwitcherLabel} />
            </div>
            <ButtonLink
              href={shell.cta.href}
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={closeMenu}
            >
              {shell.cta.shortLabel}
            </ButtonLink>
          </div>
        </Container>
      </div>
    </header>
  );
}
