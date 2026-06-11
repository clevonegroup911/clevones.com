export const insightCategories = [
  "Economic Governance",
  "Territorial Logistics",
  "Flow Structuring",
  "Compliance",
  "Institutional Coordination",
  "Investment Readiness",
] as const;

export type InsightCategory = (typeof insightCategories)[number];

export const insightsPageHero = {
  eyebrow: "Insights",
  title: "Clevones Insights",
  subtitle:
    "Strategic notes on territorial economic governance, flow structuring, logistics governance, institutional coordination, and investment-readiness in Africa.",
  tagline: "Governance-first perspectives on territorial economic systems.",
} as const;

export const insightsPageIntroduction = {
  eyebrow: "Think tank",
  title: "Authority through structural clarity",
  paragraphs: [
    "Clevones Insights publishes strategic analysis on the governance conditions that determine whether territorial economic potential becomes durable institutional value — or remains trapped in informal coordination.",
    "These notes are written for institutional actors, investors, and territorial leaders who require legible frameworks before capital deployment, logistics structuring, or cross-border coordination.",
  ],
} as const;

export const insightArticles = [
  {
    slug: "governance-before-capital",
    category: "Economic Governance" as const,
    title: "Why territorial potential requires governance before capital",
    abstract:
      "Capital deployed without territorial governance architecture amplifies fragmentation rather than value. This note examines why structure must precede financing in African economic systems.",
    readingTime: "6 min read",
  },
  {
    slug: "informal-coordination-cost",
    category: "Compliance" as const,
    title: "The hidden cost of informal coordination in African economic systems",
    abstract:
      "Informal actor networks produce short-term alignment and long-term institutional opacity. The cumulative cost — in compliance exposure, audit failure, and capital hesitation — is systematically underestimated.",
    readingTime: "7 min read",
  },
  {
    slug: "institutionally-legible-initiative",
    category: "Flow Structuring" as const,
    title: "From opportunity to institutionally legible initiative",
    abstract:
      "Opportunity identification is not initiative formation. Legibility requires documented actor mapping, governance protocols, and compliance-ready structures that institutions and investors can evaluate.",
    readingTime: "5 min read",
  },
  {
    slug: "logistics-as-governance",
    category: "Territorial Logistics" as const,
    title: "Logistics is not only movement: it is governance",
    abstract:
      "Territorial logistics systems are governance architectures in motion. Movement without governed coordination produces corridor risk, institutional blind spots, and fragile supply-chain legibility.",
    readingTime: "6 min read",
  },
  {
    slug: "neutral-platforms-territorial-coordination",
    category: "Institutional Coordination" as const,
    title: "Neutral platforms and the future of territorial coordination",
    abstract:
      "Neutral coordination platforms occupy a structural position between actors without substituting them. This note explores how governed neutrality enables multi-stakeholder alignment without commercial bias.",
    readingTime: "8 min read",
  },
  {
    slug: "investment-ready-initiatives-drc",
    category: "Investment Readiness" as const,
    title: "Building investment-ready initiatives in the DRC",
    abstract:
      "Investment readiness in the Democratic Republic of Congo is a governance outcome — not a presentation exercise. Initiatives become fundable when documentation, actor verification, and compliance architecture are in place.",
    readingTime: "7 min read",
  },
] as const;

export type InsightArticle = (typeof insightArticles)[number];

export function getInsightArticle(slug: string): InsightArticle | undefined {
  return insightArticles.find((article) => article.slug === slug);
}
