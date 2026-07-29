import { siteLegalDisclaimer } from "@/lib/constants/brand-positioning";
import {
  corporateMission,
  corporateVision,
  interventionDomains,
} from "@/lib/constants/corporate-purpose";
import { siteConfig } from "@/lib/site";

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/clevones-mark.png`,
    description: siteConfig.description,
    email: siteConfig.contact.email,
    areaServed: [
      {
        "@type": "Country",
        name: "Democratic Republic of the Congo",
      },
      "Africa",
    ],
    slogan: siteConfig.tagline,
    knowsAbout: [
      "territorial economic governance",
      "flow structuring",
      "institutional coordination",
      "compliance governance",
      corporateVision.title,
      corporateMission.title,
      ...interventionDomains.map((domain) => domain.title),
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
