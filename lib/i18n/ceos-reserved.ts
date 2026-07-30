/**
 * CEOS reserved page keys — not registered in `localizedPages` until pages ship.
 * Do not link these in navigation. See docs/architecture/CEOS-FOUNDATION-IMPLEMENTATION.md.
 *
 * Live as of Mission #002: `challenge`, `whyNow`.
 * Live as of Mission #003: `evidence` (removed from this list).
 * Platform remains PageKey `ecosystem` (/ecosystem · /ecosysteme).
 */
export const reservedCeosPageKeys = [] as const;

export type ReservedCeosPageKey = (typeof reservedCeosPageKeys)[number];

/**
 * Future URL mapping (documentation only — not live routes).
 * Platform remains served by existing `ecosystem` PageKey until a deliberate SEO migration.
 *
 * Note: Mission #002 adopted FR Challenge slug `/defi` (Blueprint draft had `/enjeu`).
 */
export const ceosFuturePathMap = {
  /**
   * Optional future rename of public Platform surface.
   * Current live paths: /ecosystem · /ecosysteme (PageKey `ecosystem`).
   */
  platformMigrationCandidate: { en: "/platform", fr: "/plateforme" },
} as const;
