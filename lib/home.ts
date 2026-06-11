import {
  clevonesIsLabels,
  clevonesIsNotLabels,
} from "@/lib/constants/brand-positioning";
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

export const homePositioning = {
  is: clevonesIsLabels,
  isNot: clevonesIsNotLabels,
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
