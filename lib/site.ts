import { siteLegalDisclaimer } from "@/lib/constants/brand-positioning";
import { ecosystemLinks } from "@/lib/constants/ecosystem";
import { navigation } from "@/lib/constants/navigation";
import { defaultLocale, getOgLocale } from "@/lib/i18n";

export const siteConfig = {
  name: "Clevones",
  tagline: "Governance Architecture for Territorial Economic Flows",
  description:
    "Clevones designs, structures, and coordinates architectures of territorial economic flows — a neutral governance platform transforming territorial potential into durable economic assets across technology, logistics, industry, energy, media, education, and institutional coordination in the Democratic Republic of Congo and Africa.",
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
