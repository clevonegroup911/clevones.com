import type { EcosystemLink } from "@/types/ecosystem";

/**
 * Public ecosystem surfaces. No separate legal registration is claimed
 * here except for CLEVONE SARL (see lib/constants/company.ts).
 * Clevone Mining copy is retained as previously published until validated.
 */
export const ecosystemLinks: readonly EcosystemLink[] = [
  { name: "CLEVONE Technologies", href: "/solutions", internal: true },
  { name: "CLEVONE DMS", href: "/solutions/clevone-dms", internal: true },
  { name: "CLEVODIA", href: "https://clevones.media" },
  { name: "CLEVONET", href: "https://extranet.clevones.com" },
  { name: "BICUNI", href: "https://bicuni.online" },
  { name: "Btlearn", href: "https://btlearn.org" },
  { name: "Clevone Mining", href: "https://mining.clevones.com" },
] as const;
