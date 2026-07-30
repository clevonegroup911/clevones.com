/**
 * Legacy EN home exports — prefer getContent(locale).pages.home.
 * Kept only for residual non-UI references; do not import into i18n content modules.
 */
import { homePageContent } from "@/lib/i18n/content/pages/home";

const home = homePageContent.en;

export const homeCta = {
  collaboration: home.finalCta.collaboration,
  initiative: home.finalCta.initiative,
} as const;

export const homeHero = home.hero;
export const homePositioning = {
  is: home.positioning.is,
  isNot: home.positioning.isNot,
} as const;
export const homeDomainsPreview = {
  eyebrow: home.domains.eyebrow,
  title: home.domains.title,
  description: home.domains.description,
  domains: home.domains.items,
  href: home.domains.href,
  linkLabel: home.domains.linkLabel,
} as const;
export const methodologySteps = home.methodology.steps;
export const strategicPillars = home.pillars.items;
export const ecosystemEntities = home.ecosystem.entities;
export const clientFilters = home.filters.items;
export const insightArticles = home.insights.articles;
