export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeConfig = {
  en: {
    htmlLang: "en",
    ogLocale: "en_US",
    label: "EN",
    name: "English",
  },
  fr: {
    htmlLang: "fr",
    ogLocale: "fr_FR",
    label: "FR",
    name: "Français",
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
