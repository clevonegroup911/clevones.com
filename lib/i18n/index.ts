export {
  defaultLocale,
  getHtmlLang,
  getOgLocale,
  isLocale,
  localeConfig,
  locales,
  type Locale,
} from "@/lib/i18n/locales";

export {
  findLocalizedPage,
  findPageKeyByPath,
  frenchPaths,
  getAlternatePath,
  getLocaleFromPath,
  getPathForPage,
  localizedPages,
  localeFallbackPath,
  type LocalizedPage,
  type LocalizedPaths,
  type PageKey,
} from "@/lib/i18n/routes";

export {
  buildHrefLangAlternates,
  buildHrefLangAlternatesForPage,
} from "@/lib/i18n/hreflang";

export { getContent, enContent, frContent } from "@/lib/i18n/content";
export type { LocaleContent, ShellContent } from "@/lib/i18n/content/types";

export {
  getLocaleFromHeaders,
  localeHeaderName,
} from "@/lib/i18n/request";
