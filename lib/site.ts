import { siteLegalDisclaimer } from "@/lib/constants/brand-positioning";
import { company, companyDefinitionFr } from "@/lib/constants/company";
import { ecosystemLinks } from "@/lib/constants/ecosystem";
import { navigation } from "@/lib/constants/navigation";
import { defaultLocale, getOgLocale } from "@/lib/i18n";

export const siteConfig = {
  name: company.brandName,
  legalName: company.legalName,
  tagline: company.strategicVision,
  description: companyDefinitionFr,
  url: company.website,
  defaultLocale,
  locale: getOgLocale(defaultLocale),
  region: "DRC & Africa",
  legalDisclaimer: siteLegalDisclaimer,
  contact: {
    email: company.email.display,
    emailHref: company.email.href,
    phone: company.phone.display,
    phoneHref: company.phone.href,
  },
  legal: {
    rccm: company.rccm,
    nationalId: company.nationalId,
    incorporationDate: company.incorporationDateDisplay,
    shareCapital: company.shareCapital,
    city: company.address.city,
    country: company.address.countryEn,
  },
  cta: {
    label: "Initiate a strategic collaboration",
    shortLabel: "Start collaboration",
    href: "/collaboration",
  },
} as const;

export { ecosystemLinks, navigation };
