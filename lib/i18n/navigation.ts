/**
 * CEOS navigation after Mission #003 — Platform + Evidence live.
 *
 * Main: Challenge, Positioning, Solutions, Methodology, Governance,
 * Platform, Evidence, Contact.
 *
 * Secondary (More / mobile group): Why Now, About, FAQ, Insights.
 */
import type { ShellContent } from "@/lib/i18n/content/types";
import { getContent } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/locales";
import {
  resolvePagePath,
  type PageKey,
} from "@/lib/i18n/routes";
import type { NavItem } from "@/types";

export type LocalizedNavItem = NavItem & {
  pageKey?: PageKey;
};

export type LocalizedNavigation = {
  main: readonly LocalizedNavItem[];
  secondary: readonly LocalizedNavItem[];
  legal: readonly LocalizedNavItem[];
  access: readonly LocalizedNavItem[];
};

export const mainNavigationKeys = [
  "challenge",
  "positioning",
  "solutions",
  "methodology",
  "governance",
  "ecosystem",
  "evidence",
  "contact",
] as const satisfies ReadonlyArray<keyof ShellContent["nav"]["main"]>;

export const secondaryNavigationKeys = [
  "whyNow",
  "about",
  "faq",
  "insights",
] as const satisfies ReadonlyArray<keyof ShellContent["nav"]["secondary"]>;

export const legalNavigationKeys = [
  "legal",
  "privacy",
] as const satisfies ReadonlyArray<keyof ShellContent["nav"]["legal"]>;

const accessItems = [
  { key: "signIn", href: "/sign-in" },
  { key: "portal", href: "/portal" },
] as const satisfies ReadonlyArray<{
  key: keyof ShellContent["nav"]["access"];
  href: string;
}>;

function buildPageNavItem(
  pageKey: PageKey,
  label: string,
  locale: Locale,
): LocalizedNavItem | null {
  const href = resolvePagePath(pageKey, locale);
  if (!href) {
    return null;
  }

  return { pageKey, label, href };
}

export function getNavigation(locale: Locale): LocalizedNavigation {
  const { shell } = getContent(locale);

  const main = mainNavigationKeys
    .map((key) => buildPageNavItem(key, shell.nav.main[key], locale))
    .filter((item): item is LocalizedNavItem => item !== null);

  const secondary = secondaryNavigationKeys
    .map((key) => buildPageNavItem(key, shell.nav.secondary[key], locale))
    .filter((item): item is LocalizedNavItem => item !== null);

  const legal = legalNavigationKeys
    .map((key) => buildPageNavItem(key, shell.nav.legal[key], locale))
    .filter((item): item is LocalizedNavItem => item !== null);

  const access: LocalizedNavItem[] = accessItems.map((item) => ({
    label: shell.nav.access[item.key],
    href: item.href,
  }));

  return { main, secondary, legal, access };
}
