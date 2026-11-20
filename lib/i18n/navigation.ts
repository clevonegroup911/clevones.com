/**
 * Public navigation (2026-11 refonte).
 *
 * Main (5): Solutions, CLEVONE DMS, About, Governance, Contact.
 *
 * Secondary ("More" / mobile group): Challenge, Positioning, Methodology,
 * Ecosystem, Evidence, Why Now, FAQ, Insights. URLs are unchanged.
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
  "solutions",
  "clevoneDms",
  "about",
  "governance",
  "contact",
] as const satisfies ReadonlyArray<keyof ShellContent["nav"]["main"]>;

export const secondaryNavigationKeys = [
  "challenge",
  "positioning",
  "methodology",
  "ecosystem",
  "evidence",
  "whyNow",
  "faq",
  "insights",
] as const satisfies ReadonlyArray<keyof ShellContent["nav"]["secondary"]>;

export const legalNavigationKeys = [
  "legal",
  "privacy",
] as const satisfies ReadonlyArray<keyof ShellContent["nav"]["legal"]>;

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

/**
 * Sign-in and client portal are withheld from public navigation until a real
 * authentication system exists. Do not add hrefs here without a live destination.
 */
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

  const access: LocalizedNavItem[] = [];

  return { main, secondary, legal, access };
}
