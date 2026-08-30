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
  englishPaths,
  frenchPaths,
  getAlternatePath,
  getLocaleFromPath,
  getPathForPage,
  hasAlternatePath,
  localizedPages,
  localeFallbackPath,
  resolvePagePath,
  type LocalizedPage,
  type LocalizedPaths,
  type PageKey,
} from "@/lib/i18n/routes";

export {
  buildHrefLangAlternates,
  buildHrefLangAlternatesForPage,
} from "@/lib/i18n/hreflang";

export {
  getNavigation,
  legalNavigationKeys,
  mainNavigationKeys,
  secondaryNavigationKeys,
  type LocalizedNavItem,
  type LocalizedNavigation,
} from "@/lib/i18n/navigation";

export {
  ceosFuturePathMap,
  reservedCeosPageKeys,
  type ReservedCeosPageKey,
} from "@/lib/i18n/ceos-reserved";

export { getContent, enContent, frContent } from "@/lib/i18n/content";
export type {
  LocaleContent,
  ShellContent,
  ShellCta,
  ShellNavLabels,
} from "@/lib/i18n/content/types";
export type {
  AboutPageContent,
  ClevoneDmsPageContent,
  ChallengePageContent,
  ContactPageContent,
  EcosystemPageContent,
  FaqPageContent,
  GovernancePageContent,
  HomePageContent,
  InsightsPageContent,
  LegalPageContent,
  MethodologyPageContent,
  PositioningPageContent,
  PrivacyPageContent,
  SolutionsPageContent,
  WhyNowPageContent,
} from "@/lib/i18n/content/pages";

export {
  getLocaleFromHeaders,
  localeHeaderName,
} from "@/lib/i18n/request";
