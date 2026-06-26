/** Full-width on mobile, auto width from sm breakpoint upward. */
export const buttonFullMobile = "w-full sm:w-auto";

/** Prevents iOS zoom on focus; scales down on larger screens. */
export const formControlResponsive =
  "py-3 text-base sm:py-2.5 sm:text-sm";

/** Break long URLs and email addresses without horizontal overflow. */
export const breakUrl = "break-all sm:break-normal";

/** Bottom clearance for the fixed mobile CTA bar when visible. */
export const mobileCtaPadding =
  "pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0";

/** Decorative grid overlay for navy hero sections. */
export const heroGridOverlayStyle = {
  backgroundImage:
    "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
  backgroundSize: "48px 48px",
} as const;

export const heroGridOverlay =
  "pointer-events-none absolute inset-0 opacity-[0.04]";

export const heroGoldOrb =
  "pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-gold/[0.04] blur-3xl";

export const pageCtaGradient =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(212,160,23,0.08),transparent)]";

export const heroSubtitle =
  "mt-6 max-w-3xl text-base leading-relaxed text-gray-muted sm:text-lg lg:text-xl lg:leading-relaxed";

export const heroTagline =
  "mt-12 text-xs font-semibold tracking-[0.25em] text-gold-muted uppercase";

/** Three-column responsive card grid used across content pages. */
export const cardGrid3 =
  "mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3";

/** Gold accent line above feature cards. */
export const cardAccentLine =
  "mb-4 h-px w-8 bg-gold/60 transition-all group-hover:w-12";

/** Stacked prose paragraphs below section headings. */
export const proseStack = "mt-10 space-y-6 text-base leading-relaxed text-muted";

/** Interactive text link with accessible focus ring. */
export const textLink =
  "inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-gold-muted transition-colors hover:text-gold focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40";

/** Accessible inline link for legal and prose content. */
export const proseLink =
  "text-gold-muted underline underline-offset-2 transition-colors hover:text-gold focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40";

/** External domain link styling. */
export const externalDomainLink =
  "inline-block text-xs font-medium tracking-wide text-navy-muted transition-colors hover:text-gold-muted focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40";
