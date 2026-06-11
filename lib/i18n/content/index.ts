import { enContent } from "@/lib/i18n/content/en";
import { frContent } from "@/lib/i18n/content/fr";
import type { LocaleContent } from "@/lib/i18n/content/types";
import type { Locale } from "@/lib/i18n/locales";

const contentByLocale: Record<Locale, LocaleContent> = {
  en: enContent,
  fr: frContent,
};

export function getContent(locale: Locale): LocaleContent {
  return contentByLocale[locale];
}

export { enContent, frContent };
