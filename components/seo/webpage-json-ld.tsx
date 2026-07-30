import { siteConfig } from "@/lib/site";

type BreadcrumbListJsonLdProps = {
  items: readonly { name: string; path: string }[];
};

/**
 * Schema.org BreadcrumbList — only paths that exist in the live route registry.
 */
export function BreadcrumbListJsonLd({ items }: BreadcrumbListJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, siteConfig.url).toString(),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type WebPageJsonLdProps = {
  name: string;
  description: string;
  path: string;
  locale: "en" | "fr";
};

export function WebPageJsonLd({
  name,
  description,
  path,
  locale,
}: WebPageJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: new URL(path, siteConfig.url).toString(),
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
