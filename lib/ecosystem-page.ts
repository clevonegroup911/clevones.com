import { clevoneMiningEcosystemDisclaimer } from "@/lib/constants/brand-positioning";

/**
 * @deprecated Prefer `ecosystemPageContent` in `lib/i18n/content/pages/ecosystem.ts`.
 * Kept in sync for any remaining non-i18n consumers.
 */
export const ecosystemPageHero = {
  eyebrow: "Ecosystem",
  title: "The CLEVONES Ecosystem",
  subtitle:
    "Specialized lines around CLEVONE SARL — technology, business software, media, knowledge, and education — with CLEVONE SARL as the institutional hub.",
} as const;

export type EcosystemEntity = {
  name: string;
  domain: string;
  href: string;
  role: string;
  description: string;
  operational: boolean;
  hidden?: boolean;
  central?: boolean;
  internal?: boolean;
};

export const ecosystemPageEntities: EcosystemEntity[] = [
  {
    name: "CLEVONE SARL",
    domain: "clevones.com",
    href: "https://clevones.com",
    role: "Congolese technology and business company",
    description:
      "The legal entity and institutional hub — digital platforms, commercial software, logistics, industry, energy, media, education, and advisory.",
    operational: false,
    central: true,
  },
  {
    name: "CLEVONE Technologies",
    domain: "clevones.com",
    href: "/solutions",
    role: "Technology and digital transformation",
    description:
      "The technology line of the CLEVONE SARL ecosystem — software, digital platforms, and IT services.",
    operational: false,
    internal: true,
  },
  {
    name: "CLEVONE DMS",
    domain: "clevones.com/solutions/clevone-dms",
    href: "/solutions/clevone-dms",
    role: "Digital Management System",
    description:
      "Commercial software for modern businesses. Capabilities follow the product roadmap.",
    operational: false,
    internal: true,
  },
  {
    name: "CLEVODIA",
    domain: "clevones.media",
    href: "https://clevones.media",
    role: "Media + AI economic intelligence",
    description:
      "CLEVODIA produces economic intelligence, strategic analysis, and AI-assisted insights on institutions, territories, and flows.",
    operational: false,
  },
  {
    name: "CLEVONET",
    domain: "extranet.clevones.com",
    href: "https://extranet.clevones.com",
    role: "Extranet + secure infrastructure",
    description:
      "CLEVONET provides secure access, collaboration workflows, reporting, document management, and sovereign digital coordination.",
    operational: false,
  },
  {
    name: "BICUNI",
    domain: "bicuni.online",
    href: "https://bicuni.online",
    role: "Scientific digital library",
    description:
      "BICUNI is a digital archive for theses, dissertations, academic publications, and scientific knowledge.",
    operational: false,
  },
  {
    name: "Btlearn",
    domain: "btlearn.org",
    href: "https://btlearn.org",
    role: "Certified education",
    description:
      "Btlearn provides certified training in languages, IT, business, leadership, cloud, AI, and professional skills.",
    operational: false,
  },
  {
    name: "Clevone Mining",
    domain: "mining.clevones.com",
    href: "https://mining.clevones.com",
    role: "Ecosystem project / entity with distinct status",
    description:
      "Clevone Mining is presented as an ecosystem project / entity with distinct status. No separate legal registration is claimed on this site except for CLEVONE SARL.",
    operational: false,
    hidden: true,
  },
];

export const ecosystemPageDisclaimer = clevoneMiningEcosystemDisclaimer;

export const ecosystemPageMap = {
  eyebrow: "Architecture",
  title: "CLEVONE SARL at the center, specialization at the perimeter",
  description:
    "Technology, software, media, knowledge, and education connect through the company hub.",
} as const;

export const ecosystemSatelliteEntities = ecosystemPageEntities.filter(
  (entity) => !entity.central && !entity.hidden,
);

export function getEcosystemEntityGroups() {
  const central = ecosystemPageEntities.find((entity) => entity.central);
  const operational = ecosystemPageEntities.find(
    (entity) => entity.operational && !entity.hidden,
  );
  const neutral = ecosystemPageEntities.filter(
    (entity) => !entity.central && !entity.operational && !entity.hidden,
  );

  if (!central) {
    throw new Error("Ecosystem entity configuration is invalid.");
  }

  return { central, neutral, operational };
}
