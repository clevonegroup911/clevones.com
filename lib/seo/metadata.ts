import type { Metadata } from "next";

import {
  buildHrefLangAlternates,
  buildHrefLangAlternatesForPage,
  getOgLocale,
  type Locale,
  type PageKey,
} from "@/lib/i18n";
import { defaultLocale } from "@/lib/i18n/locales";
import { siteConfig } from "@/lib/site";

export const siteKeywords = [
  "economic governance Africa",
  "territorial logistics DRC",
  "flow structuring Africa",
  "territorial economic governance",
  "institutional coordination DRC",
  "neutral governance platform",
  "logistics governance Africa",
  "investment readiness DRC",
  "compliance governance Africa",
  "strategic reporting Africa",
  "digital transformation DRC",
  "supply chain governance Africa",
  "economic intelligence Africa",
  "capacity building DRC",
  "territorial architecture Congo",
  "Clevones",
] as const;

export const defaultSiteTitle =
  "Clevones — Governance Architecture for Territorial Economic Flows";

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
  locale = defaultLocale,
  pageKey,
  hrefLang = false,
  robots,
}: PageMetadataOptions): Metadata {
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
      locale: getOgLocale(locale),
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
      description: siteConfig.description,
      path: "/",
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
  description: siteConfig.description,
  keywords: [...siteKeywords],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: defaultSiteTitle,
    description: siteConfig.description,
    images: [siteOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSiteTitle,
    description: siteConfig.description,
    images: [siteOgImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
};
