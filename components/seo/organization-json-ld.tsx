import { siteLegalDisclaimer } from "@/lib/constants/brand-positioning";
import {
  company,
  companyStreetAddress,
} from "@/lib/constants/company";
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
    name: company.brandName,
    legalName: company.legalName,
    url: company.website,
    logo: `${siteConfig.url}/brand/clevones-mark.png`,
    description: siteConfig.description,
    email: company.email.display,
    telephone: company.phone.href.replace("tel:", ""),
    foundingDate: company.incorporationDateIso,
    address: {
      "@type": "PostalAddress",
      streetAddress: companyStreetAddress,
      addressLocality: company.address.city,
      addressCountry: company.address.countryCode,
    },
    identifier: [
      {
        "@type": "PropertyValue",
        name: company.rccmLabel,
        value: company.rccm,
      },
      {
        "@type": "PropertyValue",
        name: company.nationalIdLabel,
        value: company.nationalId,
      },
    ],
    areaServed: [
      {
        "@type": "Country",
        name: "Democratic Republic of the Congo",
      },
      "Africa",
    ],
    slogan: company.strategicVision,
    knowsAbout: [
      "digital infrastructure",
      "business software",
      "commercial software",
      "logistics",
      "institutional coordination",
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
