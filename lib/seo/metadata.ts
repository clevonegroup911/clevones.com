import type { Metadata } from "next";

import {
  buildHrefLangAlternates,
  buildHrefLangAlternatesForPage,
  getOgLocale,
  type Locale,
  type PageKey,
} from "@/lib/i18n";
import { defaultLocale } from "@/lib/i18n/locales";
import { getLocaleFromPath } from "@/lib/i18n/routes";
import { siteConfig } from "@/lib/site";

export const siteKeywords = [
  "CLEVONES",
  "CLEVONE SARL",
  "entreprise congolaise",
  "infrastructure numérique Afrique",
  "logiciels de gestion RDC",
  "CLEVONE DMS",
  "Kisangani",
  "transformation numérique RDC",
  "Congolese technology company",
  "digital infrastructure Africa",
  "business software DRC",
  "Architecture de gouvernance des flux économiques territoriaux",
] as const;

export const defaultSiteTitle =
  "CLEVONES | Technologie, Business & Infrastructure Numérique";

export const defaultSiteDescription =
  "CLEVONE SARL est une entreprise congolaise développant des plateformes numériques, des logiciels de gestion, des solutions logistiques, médiatiques, éducatives et institutionnelles.";

export const enSiteTitle =
  "CLEVONES | Technology, Business & Digital Infrastructure";

export const enSiteDescription =
  "CLEVONE SARL is a Congolese technology and business company building digital platforms, commercial software, logistics, media, education and institutional solutions.";

export const siteOgImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: defaultSiteTitle,
  type: "image/png",
} as const;

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  locale?: Locale;
  pageKey?: PageKey;
  hrefLang?: boolean;
  robots?: Metadata["robots"];
};

export function createPageMetadata({
  title,
  description,
  path,
  locale,
  pageKey,
  hrefLang = false,
  robots,
}: PageMetadataOptions): Metadata {
  const resolvedLocale =
    locale ?? (path ? getLocaleFromPath(path) : defaultLocale);
  const url = path ? new URL(path, siteConfig.url).toString() : undefined;
  const languages = hrefLang
    ? pageKey
      ? buildHrefLangAlternatesForPage(pageKey)
      : path
        ? buildHrefLangAlternates(path)
        : undefined
    : undefined;

  return {
    title,
    description,
    ...(robots !== undefined ? { robots } : {}),
    ...(url || languages
      ? {
          alternates: {
            ...(url ? { canonical: url } : {}),
            ...(languages ? { languages } : {}),
          },
        }
      : {}),
    openGraph: {
      title,
      description,
      siteName: siteConfig.name,
      type: "website",
      locale: getOgLocale(resolvedLocale),
      images: [siteOgImage],
      ...(url ? { url } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteOgImage.url],
    },
  };
}

export function createHomeMetadata(): Metadata {
  return {
    ...createPageMetadata({
      title: defaultSiteTitle,
      description: defaultSiteDescription,
      path: "/",
      locale: defaultLocale,
      pageKey: "home",
      hrefLang: true,
    }),
    title: {
      absolute: defaultSiteTitle,
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: defaultSiteTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: defaultSiteDescription,
  keywords: [...siteKeywords],
  authors: [{ name: siteConfig.legalName, url: siteConfig.url }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  alternates: {
    canonical: siteConfig.url,
    languages: {
      fr: siteConfig.url,
      en: new URL("/en", siteConfig.url).toString(),
      "x-default": siteConfig.url,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: defaultSiteTitle,
    description: defaultSiteDescription,
    images: [siteOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSiteTitle,
    description: defaultSiteDescription,
    images: [siteOgImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
};
