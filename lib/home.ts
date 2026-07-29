import {
  clevonesIsLabels,
  clevonesIsNotLabels,
} from "@/lib/constants/brand-positioning";
import { interventionDomains } from "@/lib/constants/corporate-purpose";
import { ecosystemSatelliteEntities } from "@/lib/ecosystem-page";
import { insightArticles as allInsightArticles } from "@/lib/insights-page";

export const homeCta = {
  collaboration: {
    label: "Initiate a strategic collaboration",
    href: "/contact",
  },
  initiative: {
    label: "Submit a structured initiative",
    href: "/contact?intent=initiative",
  },
} as const;

export const homeHero = {
  eyebrow: "Digital economic platform",
  badge: "DRC & Africa",
  title: "Turn complex initiatives into coordinated economic systems",
  subtitle:
    "CLEVONES helps territories, enterprises, institutions, and investors structure multi-actor initiatives into governed, investable systems — with shared digital infrastructure and neutral coordination.",
  valueProposition:
    "Better coordination. Less fragmentation. Clearer path to investment.",
  primaryCta: {
    label: "Start a strategic conversation",
    href: "/contact",
  },
  secondaryCta: {
    label: "Discover the ecosystem",
    href: "/ecosystem",
  },
  benefits: [
    {
      title: "Actor coordination",
      description:
        "Align territories, enterprises, institutions, and investors around shared structures.",
    },
    {
      title: "Less fragmentation",
      description:
        "Reduce scattered efforts with one coordination layer and clearer information flow.",
    },
    {
      title: "Investment readiness",
      description:
        "Prepare initiatives so they become governed, transparent, and investable.",
    },
    {
      title: "Shared digital infrastructure",
      description:
        "Operate on a common technological layer built for multi-actor coordination.",
    },
  ],
  proofs: {
    label: "Across the CLEVONES ecosystem",
    items: [
      { name: "Clevonet", detail: "Digital infrastructure" },
      { name: "Clevodia", detail: "Economic intelligence" },
      { name: "Bicuni", detail: "Scientific knowledge" },
      { name: "Btlearn", detail: "Certified education" },
      {
        name: "Clevone Mining",
        detail: "Distinct operational entity",
        operational: true,
      },
    ],
  },
  trustLine: "Neutral coordination. Non-operational by design.",
} as const;

export const homePositioning = {
  is: clevonesIsLabels,
  isNot: clevonesIsNotLabels,
} as const;

export const homeDomainsPreview = {
  eyebrow: "Fields of intervention",
  title: "Territorial architectures across strategic domains",
  description:
    "Clevones' corporate purpose defines where architectures of economic flows may be designed and coordinated — through the governance platform, specialized ecosystem entities, and subsidiaries when required. Domains expand capacity; they do not redefine Clevones as a multi-service operator.",
  domains: interventionDomains.slice(0, 6),
  href: "/solutions",
  linkLabel: "View all domains of intervention",
} as const;

export const methodologySteps = [
  {
    number: "01",
    title: "Territorial Reading",
    description:
      "Systematic assessment of territorial economic dynamics, actors, and structural constraints.",
  },
  {
    number: "02",
    title: "Flow Mapping",
    description:
      "Documentation of economic circulation patterns, dependencies, and coordination gaps.",
  },
  {
    number: "03",
    title: "Governance Structuring",
    description:
      "Design of governance frameworks aligned with institutional requirements and territorial realities.",
  },
  {
    number: "04",
    title: "Collaboration Framework",
    description:
      "Establishment of neutral coordination protocols between legitimate institutional and economic actors.",
  },
  {
    number: "05",
    title: "Strategic Reporting",
    description:
      "Disciplined reporting architecture for transparency, accountability, and institutional credibility.",
  },
] as const;

export const strategicPillars = [
  {
    title: "Governance",
    description:
      "Structured frameworks for decision-making, accountability, and territorial economic discipline.",
  },
  {
    title: "Neutrality",
    description:
      "Independent positioning without operational bias, commercial interest, or actor substitution.",
  },
  {
    title: "Compliance",
    description:
      "Adherence to applicable regulatory and institutional standards across all coordination activities.",
  },
  {
    title: "Territorial Intelligence",
    description:
      "Deep reading of local economic realities to inform governance architecture and strategic alignment.",
  },
  {
    title: "Strategic Coordination",
    description:
      "Alignment of legitimate actors around shared territorial objectives without direct intermediation.",
  },
  {
    title: "Institutional Credibility",
    description:
      "Documentation, reporting discipline, and transparent interfaces that sustain long-term trust.",
  },
] as const;

export const ecosystemEntities = ecosystemSatelliteEntities.map(
  ({ name, role, description, href, operational }) => ({
    name,
    role,
    description,
    href,
    operational,
  }),
);

export const clientFilters = [
  {
    title: "Legitimacy",
    description:
      "Recognized institutional standing, legal foundation, and verifiable operational identity.",
  },
  {
    title: "Strategic relevance",
    description:
      "Alignment with territorial economic governance objectives and long-horizon structural value.",
  },
  {
    title: "Compliance readiness",
    description:
      "Capacity and willingness to operate within documented regulatory and institutional frameworks.",
  },
  {
    title: "Institutional compatibility",
    description:
      "Fit with neutral governance protocols and non-operational coordination requirements.",
  },
  {
    title: "Coordination maturity",
    description:
      "Demonstrated ability to engage in structured, documented multi-actor collaboration.",
  },
  {
    title: "Long-term value",
    description:
      "Commitment to sustained territorial impact beyond short-cycle opportunistic engagement.",
  },
] as const;

export const insightArticles = allInsightArticles.slice(0, 3);
