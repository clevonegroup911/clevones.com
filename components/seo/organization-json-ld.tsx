import { siteLegalDisclaimer } from "@/lib/constants/brand-positioning";
import { siteConfig } from "@/lib/site";

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    email: siteConfig.contact.email,
    areaServed: siteConfig.region,
    slogan: siteConfig.tagline,
    knowsAbout: [
      "territorial economic governance",
      "flow structuring",
      "institutional coordination",
      "compliance governance",
    ],
    disambiguatingDescription: siteLegalDisclaimer,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
