import {
  capacityVsPlatformClarification,
  domainsFraming,
  interventionDomains,
} from "@/lib/constants/corporate-purpose";

export const solutionsPageHero = {
  eyebrow: "Solutions",
  title: "Territorial architectures across strategic domains",
  subtitle:
    "Clevones does not sell generic services. It designs and coordinates governed architectures within the fields defined by its corporate purpose — always as architect of flows, never as substitute operator.",
  tagline: "Domains of intervention. One architectural mandate.",
} as const;

export const solutionsPageIntroduction = {
  eyebrow: "Approach",
  title: domainsFraming.title,
  paragraphs: [
    domainsFraming.description,
    "Each domain below is a field in which territorial economic flows can be structured, coordinated, and made institutionally legible — through the Clevones governance platform, specialized ecosystem entities, or subsidiaries and partnerships when required.",
    capacityVsPlatformClarification.en,
  ],
} as const;

export const solutionsPageDomains = interventionDomains;

export const solutionsPageHow = {
  eyebrow: "How engagement works",
  title: "Architecture before execution",
  steps: [
    {
      title: "Territorial reading",
      description:
        "Non-sensitive assessment of actors, constraints, and institutional context within the relevant domain.",
    },
    {
      title: "Flow and governance design",
      description:
        "Mapping of economic circulation and design of roles, reporting, and compliance frameworks.",
    },
    {
      title: "Coordinated delivery",
      description:
        "Alignment of legitimate actors and, where applicable, specialized ecosystem platforms — without informal brokerage.",
    },
  ],
} as const;

export const solutionsPageCta = {
  title: "Structure an initiative within a governed domain.",
  description:
    "Submit a documented initiative for assessment under the Clevones Five-Step Framework.",
} as const;
