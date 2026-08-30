"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/layout/brand-logo";
import {
  CompanyContact,
  CompanyEntityLink,
} from "@/components/layout/company-contact";
import { Container } from "@/components/ui/container";
import { company } from "@/lib/constants/company";
import {
  getContent,
  getLocaleFromPath,
  getNavigation,
  resolvePagePath,
} from "@/lib/i18n";
import { breakUrl, mobileCtaPadding } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

type FooterProps = {
  reserveMobileCtaSpace?: boolean;
};

export function Footer({ reserveMobileCtaSpace = false }: FooterProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { shell, pages } = getContent(locale);
  const navigation = getNavigation(locale);
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative border-t border-border-subtle/50",
        reserveMobileCtaSpace && mobileCtaPadding,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent"
        aria-hidden
      />
      <Container className="py-10 sm:py-14 lg:py-20">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-4">
            <BrandLogo
              variant="footer"
              href={resolvePagePath("home", locale) ?? "/"}
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-pretty text-gray-muted">
              {shell.description}
            </p>
            <div className="mt-6 space-y-1 text-xs leading-relaxed text-navy-muted">
              <p className="font-heading text-sm font-semibold tracking-tight text-white">
                {company.legalName}
              </p>
              <p>
                {company.rccmLabel}: {company.rccm}
              </p>
              <p>
                {company.nationalIdLabel}: {company.nationalId}
              </p>
              <p>{shell.footerLocation}</p>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-2 lg:col-start-6">
            <p className="text-xs font-semibold tracking-[0.15em] text-white uppercase">
              {shell.footerNavigation}
            </p>
            <ul className="mt-4 space-y-2.5">
              {navigation.main.map((item) => (
                <li key={item.pageKey ?? item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 items-center text-sm text-gray-muted transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 lg:col-span-3">
            <p className="text-xs font-semibold tracking-[0.15em] text-white uppercase">
              {shell.footerEcosystem}
            </p>
            <ul className="mt-4 space-y-2.5">
              {pages.ecosystem.modules.entities
                .filter((item) => !item.central)
                .map((item) => (
                <li key={item.href}>
                  <CompanyEntityLink
                    href={item.href}
                    name={item.name}
                    internal={item.internal}
                    className="group inline-flex max-w-full flex-col text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                  >
                    <span className="text-gray-muted transition-colors group-hover:text-white">
                      {item.name}
                      {item.operational ? (
                        <span className="ml-1.5 text-[10px] font-semibold tracking-wide text-gold-muted uppercase">
                          ({shell.operationalBadge})
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-navy-muted transition-colors group-hover:text-gold-muted">
                      {item.role}
                    </span>
                    <span
                      className={`text-xs text-navy-muted/80 transition-colors group-hover:text-gold-muted/80 ${breakUrl}`}
                    >
                      {item.domain}
                    </span>
                  </CompanyEntityLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <p className="text-xs font-semibold tracking-[0.15em] text-white uppercase">
              {shell.footerAccess}
            </p>
            <ul className="mt-4 space-y-2.5">
              {navigation.access.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 items-center text-sm text-gray-muted transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            {navigation.secondary.length > 0 ? (
              <div className="mt-8">
                <p className="text-xs font-semibold tracking-[0.15em] text-white uppercase">
                  {shell.footerSecondary}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {navigation.secondary.map((item) => (
                    <li key={item.pageKey ?? item.href}>
                      <Link
                        href={item.href}
                        className="inline-flex min-h-9 items-center text-sm text-gray-muted transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 lg:col-span-2">
            <p className="text-xs font-semibold tracking-[0.15em] text-white uppercase">
              {shell.footerContact}
            </p>
            <CompanyContact
              location={shell.footerLocation}
              phoneLabel={shell.phoneLabel}
              emailLabel={shell.emailLabel}
              className="mt-4"
            />
          </div>
        </div>

        <div className="mt-10 rounded-sm border border-border-subtle/40 bg-white/[0.02] px-4 py-4 sm:mt-12 sm:px-5">
          <p className="text-sm leading-relaxed text-pretty text-gray-muted">
            {shell.legalDisclaimer}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-border-subtle/40 pt-6 text-sm text-gray-muted sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <p className="text-pretty">
            © {currentYear} {company.legalName}. {shell.allRightsReserved}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {navigation.legal.map((item) => (
              <Link
                key={item.pageKey ?? item.href}
                href={item.href}
                className="inline-flex min-h-9 items-center transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
