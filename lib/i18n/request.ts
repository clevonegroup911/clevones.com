import type { Locale } from "@/lib/i18n/locales";
import { defaultLocale, isLocale } from "@/lib/i18n/locales";

export const localeHeaderName = "x-locale";

export function getLocaleFromHeaders(
  headers: Headers,
  fallback: Locale = defaultLocale,
): Locale {
  const value = headers.get(localeHeaderName);
  return value && isLocale(value) ? value : fallback;
}
