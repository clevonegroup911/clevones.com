import {
  capacityVsPlatformClarification,
  corporateDevelopmentClause,
  corporateMission,
  corporateVision,
  domainsFraming,
  interventionDomains,
} from "@/lib/constants/corporate-purpose";

export const aboutPageHero = {
  eyebrow: "About",
  title: "Architect of territorial economic flows",
  subtitle:
    "Clevones designs, structures, and coordinates architectures that transform territorial potential into durable economic assets — across the Democratic Republic of Congo and Africa.",
  tagline: "Vision first. Legal capacity in service of architecture.",
} as const;

export const aboutPageVision = {
  eyebrow: "Vision",
  title: corporateVision.title,
  paragraphs: [
    corporateVision.statement,
    "This vision is the core of the brand. Technology, logistics, digital infrastructure, economic intelligence, and coordination platforms are instruments of territorial architecture — not ends in themselves.",
  ],
} as const;

export const aboutPageMission = {
  eyebrow: "Mission",
  title: corporateMission.title,
  paragraphs: [
    corporateMission.statement,
    "Clevones preserves a clear separation between governance design and operational execution. Legitimate actors retain operational responsibility within documented, compliant structures.",
  ],
} as const;

export const aboutPageIdentity = {
  eyebrow: "Institutional identity",
  title: "Platform of coordination. Integrator of ecosystems.",
  paragraphs: [
    "Clevones operates as a premium institutional platform: architect of flows, territorial structurer, neutral governance layer, and strategic reporting interface.",
    "Its specialized ecosystem — Clevodia, Clevonet, Bicuni, Btlearn Inc., and the operationally separated Clevone Mining — extends domain capacity without diluting the central governance mandate.",
    capacityVsPlatformClarification.en,
  ],
} as const;

export const aboutPageDomains = {
  eyebrow: domainsFraming.eyebrow,
  title: domainsFraming.title,
  description: domainsFraming.description,
  domains: interventionDomains,
} as const;

export const aboutPageDevelopment = {
  eyebrow: "Corporate development",
  title: corporateDevelopmentClause.title,
  paragraphs: [corporateDevelopmentClause.statement],
} as const;

export const aboutPageCta = {
  title: "Engage with a governed territorial architecture.",
  description:
    "Institutions, investors, and structured territorial actors may initiate a strategic collaboration under documented governance criteria.",
} as const;
