/**
 * Structural navigation keys. Locale-aware labels and hrefs are built by
 * `getNavigation(locale)` in `lib/i18n/navigation.ts`.
 *
 * @deprecated Prefer `getNavigation(locale)` for UI chrome.
 * Kept for English default href lists used by non-locale consumers.
 */
import { getNavigation } from "@/lib/i18n/navigation";
import { defaultLocale } from "@/lib/i18n/locales";

const defaultNavigation = getNavigation(defaultLocale);

export const mainNavigation = defaultNavigation.main;
export const secondaryNavigation = defaultNavigation.secondary;
export const legalNavigation = defaultNavigation.legal;
export const accessNavigation = defaultNavigation.access;
/** @deprecated Use `accessNavigation` — "platform" meant SaaS access, not CEOS Platform. */
export const platformNavigation = accessNavigation;

export const navigation = {
  main: mainNavigation,
  secondary: secondaryNavigation,
  legal: legalNavigation,
  access: accessNavigation,
  /** @deprecated Use `access`. */
  platform: accessNavigation,
} as const;

export {
  getNavigation,
  legalNavigationKeys,
  mainNavigationKeys,
  secondaryNavigationKeys,
  type LocalizedNavItem,
  type LocalizedNavigation,
} from "@/lib/i18n/navigation";
