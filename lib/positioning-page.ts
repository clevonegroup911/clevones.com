/**
 * @deprecated Prefer `getContent(locale).pages.positioning`.
 * Thin re-exports for residual legacy imports (Mission #002.5).
 */
import { positioningPageContent } from "@/lib/i18n/content/pages/positioning";

const en = positioningPageContent.en;

export const positioningPageHero = en.hero;
export const positioningPageDefinition = en.definition;
export const positioningPageIs = en.isSection.items;
export const positioningPageIsNot = en.isNotSection.items;
export const positioningPageDistinction = en.distinction;
export const positioningPageCorporatePurpose = en.corporatePurpose;
