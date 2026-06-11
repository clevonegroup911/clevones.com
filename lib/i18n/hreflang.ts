import type { Metadata } from "next";

import type { Locale } from "@/lib/i18n/locales";
import { defaultLocale } from "@/lib/i18n/locales";
import {
  findPageKeyByPath,
  findLocalizedPage,
  type LocalizedPaths,
} from "@/lib/i18n/routes";
import { siteConfig } from "@/lib/site";

type HrefLangMap = NonNullable<Metadata["alternates"]>["languages"];

function toAbsoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

function buildLanguagesFromPaths(paths: LocalizedPaths): HrefLangMap | undefined {
  const languages: Record<string, string> = {};

  for (const locale of Object.keys(paths) as Locale[]) {
    const path = paths[locale];
    if (path) {
      languages[locale] = toAbsoluteUrl(path);
    }
  }

  if (!languages.en && !languages.fr) {
    return undefined;
  }

  if (languages.en) {
    languages["x-default"] = languages.en;
  } else if (languages[defaultLocale]) {
    languages["x-default"] = languages[defaultLocale];
  }

  return Object.keys(languages).length > 1 ? languages : undefined;
}

/**
 * Builds hreflang alternates for pages with more than one localized URL.
 * Returns undefined when no meaningful alternate exists yet.
 */
export function buildHrefLangAlternates(pathname: string): HrefLangMap | undefined {
  const pageKey = findPageKeyByPath(pathname);
  if (!pageKey) {
    return undefined;
  }

  const page = findLocalizedPage(pageKey);
  if (!page) {
    return undefined;
  }

  return buildLanguagesFromPaths(page.paths);
}

export function buildHrefLangAlternatesForPage(
  pageKey: Parameters<typeof findLocalizedPage>[0],
): HrefLangMap | undefined {
  const page = findLocalizedPage(pageKey);
  if (!page) {
    return undefined;
  }

  return buildLanguagesFromPaths(page.paths);
}
