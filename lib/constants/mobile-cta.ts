/** Routes where the fixed mobile CTA bar should be hidden. */
export const MOBILE_CTA_HIDDEN_PATHS = new Set([
  "/contact",
  "/collaboration",
  "/sign-in",
  "/portal",
  "/confidentialite",
  "/mentions-legales",
]);

/** Marker id for the first hero section on each page. */
export const PAGE_HERO_ID = "page-hero";

/** Fixed bar height used for layout offset and intersection root margin. */
export const MOBILE_CTA_BAR_HEIGHT = "4.75rem";

/** Rem value paired with {@link MOBILE_CTA_BAR_HEIGHT} for pixel conversion. */
export const MOBILE_CTA_BAR_HEIGHT_REM = 4.75;

/**
 * IntersectionObserver rootMargin (px/percent only). Shrinks the root from the
 * bottom so the CTA stays hidden while hero content occupies the area above the bar.
 */
export function buildMobileCtaRootMarginBottom(bottomInsetPx: number): string {
  const marginPx = Math.ceil(bottomInsetPx);
  return `0px 0px -${marginPx}px 0px`;
}

/** Scroll fallback when a page has no hero marker. */
export const MOBILE_CTA_SCROLL_FALLBACK = 120;
