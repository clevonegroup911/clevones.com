export const locales = ["fr", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeConfig = {
  fr: {
    htmlLang: "fr",
    ogLocale: "fr_FR",
    label: "FR",
    name: "Français",
  },
  en: {
    htmlLang: "en",
    ogLocale: "en_US",
    label: "EN",
    name: "English",
  },
} as const satisfies Record<
  Locale,
  { htmlLang: string; ogLocale: string; label: string; name: string }
>;

export function getHtmlLang(locale: Locale): string {
  return localeConfig[locale].htmlLang;
}

export function getOgLocale(locale: Locale): string {
  return localeConfig[locale].ogLocale;
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
