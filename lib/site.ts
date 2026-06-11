import { siteLegalDisclaimer } from "@/lib/constants/brand-positioning";
import { ecosystemLinks } from "@/lib/constants/ecosystem";
import { navigation } from "@/lib/constants/navigation";
import { defaultLocale, getOgLocale } from "@/lib/i18n";

export const siteConfig = {
  name: "Clevones",
  tagline: "Governance Architecture for Territorial Economic Flows",
  description:
    "Clevones is a neutral, compliant governance architecture platform for territorial economic-flow coordination, institutional reporting, and strategic alignment in the Democratic Republic of Congo and Africa.",
  url: "https://clevones.com",
  defaultLocale,
  locale: getOgLocale(defaultLocale),
  region: "DRC & Africa",
  legalDisclaimer: siteLegalDisclaimer,
  contact: {
    email: "contact@clevones.com",
  },
  cta: {
    label: "Initiate a strategic collaboration",
    shortLabel: "Start collaboration",
    href: "/contact",
  },
} as const;

export { ecosystemLinks, navigation };
