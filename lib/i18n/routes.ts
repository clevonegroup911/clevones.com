import type { Locale } from "@/lib/i18n/locales";
import { defaultLocale } from "@/lib/i18n/locales";

/**
 * Logical page keys for bilingual routing.
 * English paths remain the default URLs; French paths are added incrementally.
 */
export type PageKey =
  | "home"
  | "mission"
  | "positioning"
  | "methodology"
  | "ecosystem"
  | "insights"
  | "governance"
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
  { key: "home", paths: { en: "/" } },
  { key: "mission", paths: { fr: "/mission" } },
  {
    key: "positioning",
    paths: { en: "/positioning", fr: "/positionnement" },
  },
  { key: "methodology", paths: { en: "/methodology" } },
  { key: "ecosystem", paths: { en: "/ecosystem" } },
  { key: "insights", paths: { en: "/insights" } },
  { key: "governance", paths: { en: "/governance" } },
  { key: "contact", paths: { en: "/contact" } },
  { key: "legal", paths: { fr: "/mentions-legales" } },
  { key: "privacy", paths: { fr: "/confidentialite" } },
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

export const localeFallbackPath: Record<Locale, string> = {
  en: "/",
  fr: "/mission",
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

export function getLocaleFromPath(pathname: string): Locale {
  return frenchPaths.has(normalizePath(pathname)) ? "fr" : defaultLocale;
}

/**
 * Resolves the best URL for the target locale.
 * Uses explicit alternates when defined; otherwise falls back to each locale's entry point.
 */
export function getAlternatePath(pathname: string, targetLocale: Locale): string {
  const pageKey = findPageKeyByPath(pathname);

  if (pageKey) {
    const directAlternate = getPathForPage(pageKey, targetLocale);
    if (directAlternate) {
      return directAlternate;
    }
  }

  return localeFallbackPath[targetLocale];
}
