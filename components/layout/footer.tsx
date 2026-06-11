"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/components/ui/container";
import { ecosystemSatelliteEntities } from "@/lib/ecosystem-page";
import { getContent, getLocaleFromPath } from "@/lib/i18n";
import { navigation, siteConfig } from "@/lib/site";
import { breakUrl, mobileCtaPadding } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

type FooterProps = {
  reserveMobileCtaSpace?: boolean;
};

export function Footer({ reserveMobileCtaSpace = false }: FooterProps) {
  const pathname = usePathname();
  const { shell } = getContent(getLocaleFromPath(pathname));
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
            <p className="font-heading text-xl font-semibold text-white sm:text-2xl">
              {siteConfig.name}
            </p>
            <p className="mt-1 text-xs font-medium tracking-[0.12em] text-gold-muted uppercase sm:tracking-[0.15em]">
              {siteConfig.tagline}
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-pretty text-gray-muted">
              {siteConfig.description}
            </p>
          </div>

          <div className="min-w-0 lg:col-span-2 lg:col-start-6">
            <p className="text-xs font-semibold tracking-[0.15em] text-white uppercase">
              {shell.footerNavigation}
            </p>
            <ul className="mt-4 space-y-2.5">
              {navigation.main.map((item) => (
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
          </div>

          <div className="min-w-0 lg:col-span-3">
            <p className="text-xs font-semibold tracking-[0.15em] text-white uppercase">
              {shell.footerEcosystem}
            </p>
            <ul className="mt-4 space-y-2.5">
              {ecosystemSatelliteEntities.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex max-w-full flex-col text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                  >
                    <span className="text-gray-muted transition-colors group-hover:text-white">
                      {item.name}
                      {item.operational ? (
                        <span className="ml-1.5 text-[10px] font-semibold tracking-wide text-gold-muted uppercase">
                          (Operational)
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
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <p className="text-xs font-semibold tracking-[0.15em] text-white uppercase">
              {shell.footerPlatform}
            </p>
            <ul className="mt-4 space-y-2.5">
              {navigation.platform.map((item) => (
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
          </div>

          <div className="min-w-0 lg:col-span-2">
            <p className="text-xs font-semibold tracking-[0.15em] text-white uppercase">
              {shell.footerContact}
            </p>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className={`mt-4 inline-block text-sm text-gray-muted transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 ${breakUrl}`}
            >
              {siteConfig.contact.email}
            </a>
          </div>
        </div>

        <div className="mt-10 rounded-sm border border-border-subtle/40 bg-white/[0.02] px-4 py-4 sm:mt-12 sm:px-5">
          <p className="text-sm leading-relaxed text-pretty text-gray-muted">
            {siteConfig.legalDisclaimer}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-border-subtle/40 pt-6 text-sm text-gray-muted sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <p className="text-pretty">
            © {currentYear} {siteConfig.name}. {shell.allRightsReserved}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {navigation.legal.map((item) => (
              <Link
                key={item.href}
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
