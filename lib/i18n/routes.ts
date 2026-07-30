import type { Locale } from "@/lib/i18n/locales";
import { defaultLocale } from "@/lib/i18n/locales";

/**
 * Logical page keys for bilingual routing.
 * English paths remain the default URLs; French paths are added incrementally.
 */
export type PageKey =
  | "home"
  | "challenge"
  | "whyNow"
  | "about"
  | "positioning"
  | "solutions"
  | "methodology"
  | "ecosystem"
  | "evidence"
  | "insights"
  | "governance"
  | "faq"
  | "contact"
  | "legal"
  | "privacy";

export type LocalizedPaths = Partial<Record<Locale, string>>;

export type LocalizedPage = {
  key: PageKey;
  paths: LocalizedPaths;
};

/**
 * Registry of localized routes. Add `fr` paths here as translations ship.
 * Paths must stay in sync with `app/(public)` route files.
 */
export const localizedPages: readonly LocalizedPage[] = [
  { key: "home", paths: { en: "/", fr: "/accueil" } },
  { key: "challenge", paths: { en: "/challenge", fr: "/defi" } },
  {
    key: "whyNow",
    paths: { en: "/why-now", fr: "/pourquoi-maintenant" },
  },
  { key: "about", paths: { en: "/about", fr: "/mission" } },
  {
    key: "positioning",
    paths: { en: "/positioning", fr: "/positionnement" },
  },
  { key: "solutions", paths: { en: "/solutions", fr: "/domaines" } },
  { key: "methodology", paths: { en: "/methodology", fr: "/methodologie" } },
  { key: "ecosystem", paths: { en: "/ecosystem", fr: "/ecosysteme" } },
  { key: "evidence", paths: { en: "/evidence", fr: "/preuves" } },
  { key: "insights", paths: { en: "/insights", fr: "/analyses" } },
  { key: "governance", paths: { en: "/governance", fr: "/gouvernance" } },
  { key: "faq", paths: { en: "/faq", fr: "/questions-frequentes" } },
  { key: "contact", paths: { en: "/contact", fr: "/collaboration" } },
  { key: "legal", paths: { en: "/legal-notice", fr: "/mentions-legales" } },
  { key: "privacy", paths: { en: "/privacy", fr: "/confidentialite" } },
] as const;

const pathToPageKey = new Map<string, PageKey>(
  localizedPages.flatMap((page) =>
    Object.values(page.paths).map((path) => [normalizePath(path), page.key]),
  ),
);

const pageByKey = new Map<PageKey, LocalizedPage>(
  localizedPages.map((page) => [page.key, page]),
);

export const frenchPaths = new Set<string>(
  localizedPages.flatMap((page) =>
    page.paths.fr ? [normalizePath(page.paths.fr)] : [],
  ),
);

/**
 * Entry points when no page-level alternate exists.
 * Reserved for site entry (e.g. home). Must NOT be used by the language switcher
 * to fake a translation of the current page.
 */
export const localeFallbackPath: Record<Locale, string> = {
  en: "/",
  fr: "/accueil",
};

function normalizePath(path: string): string {
  if (path === "/") {
    return "/";
  }

  return path.replace(/\/+$/, "") || "/";
}

export function findPageKeyByPath(pathname: string): PageKey | undefined {
  return pathToPageKey.get(normalizePath(pathname));
}

export function findLocalizedPage(key: PageKey): LocalizedPage | undefined {
  return pageByKey.get(key);
}

export function getPathForPage(
  key: PageKey,
  locale: Locale,
): string | undefined {
  return findLocalizedPage(key)?.paths[locale];
}

/**
 * Prefer the requested locale path; fall back to the other locale when a page
 * exists in only one language (e.g. legal FR-only, solutions EN-only).
 */
export function resolvePagePath(
  key: PageKey,
  locale: Locale,
): string | undefined {
  return (
    getPathForPage(key, locale) ??
    getPathForPage(key, locale === "fr" ? "en" : "fr")
  );
}

export function getLocaleFromPath(pathname: string): Locale {
  return frenchPaths.has(normalizePath(pathname)) ? "fr" : defaultLocale;
}

/**
 * True when the current page has an explicit URL for `targetLocale`.
 */
export function hasAlternatePath(
  pathname: string,
  targetLocale: Locale,
): boolean {
  return getAlternatePath(pathname, targetLocale) !== undefined;
}

/**
 * Resolves the translated URL for the same logical page.
 * Returns `undefined` when no alternate exists — never invents a different page.
 */
export function getAlternatePath(
  pathname: string,
  targetLocale: Locale,
): string | undefined {
  const pageKey = findPageKeyByPath(pathname);

  if (!pageKey) {
    return undefined;
  }

  return getPathForPage(pageKey, targetLocale);
}
