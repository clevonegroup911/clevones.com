/**
 * @deprecated Prefer `getContent(locale).pages.positioning`.
 * Thin re-exports for residual Home deferred copy (Mission #002.5).
 */
import { positioningPageContent } from "@/lib/i18n/content/pages/positioning";

const fr = positioningPageContent.fr;

export const positionnementIs = fr.isSection.items.map((item) => item.title);

export const positionnementIsNot = fr.isNotSection.items.map(
  (item) => item.title,
);

export const positionnementCorporatePurpose = fr.corporatePurpose;
