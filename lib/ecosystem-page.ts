import { clevoneMiningEcosystemDisclaimer } from "@/lib/constants/brand-positioning";

export const ecosystemPageHero = {
  eyebrow: "Ecosystem",
  title: "The Clevones Ecosystem",
  subtitle:
    "Specialized platforms extend Clevones' corporate fields of intervention — technology, media, knowledge, education, and responsible territorial development — with Clevones as the neutral coordination hub and architect of territorial economic flows.",
} as const;

export type EcosystemEntity = {
  name: string;
  domain: string;
  href: string;
  role: string;
  description: string;
  operational: boolean;
  central?: boolean;
};

export const ecosystemPageEntities: EcosystemEntity[] = [
  {
    name: "Clevones",
    domain: "clevones.com",
    href: "https://clevones.com",
    role: "Governance of territorial economic flows",
    description:
      "Clevones is the neutral institutional platform for governance, coordination, compliance, and strategic reporting — architect of flows and integrator of the ecosystem.",
    operational: false,
    central: true,
  },
  {
    name: "Clevodia",
    domain: "clevones.media",
    href: "https://clevones.media",
    role: "Media + AI economic intelligence",
    description:
      "Clevodia produces economic intelligence, strategic analysis, and AI-assisted insights on institutions, territories, and flows — extending the media and creative industries domain.",
    operational: false,
  },
  {
    name: "Clevonet",
    domain: "extranet.clevones.com",
    href: "https://extranet.clevones.com",
    role: "Extranet + secure infrastructure",
    description:
      "Clevonet provides secure access, collaboration workflows, reporting, document management, and sovereign digital coordination — the technology and digital infrastructure layer of the ecosystem.",
    operational: false,
  },
  {
    name: "Bicuni",
    domain: "bicuni.online",
    href: "https://bicuni.online",
    role: "Scientific digital library",
    description:
      "Bicuni is a digital archive for theses, dissertations, academic publications, and scientific knowledge — supporting education and capacity-building infrastructures.",
    operational: false,
  },
  {
    name: "Btlearn Inc.",
    domain: "btlearn.org",
    href: "https://btlearn.org",
    role: "Certified education",
    description:
      "Btlearn Inc. provides certified training in languages, IT, business, leadership, cloud, AI, and professional skills — strengthening human and institutional capacity.",
    operational: false,
  },
  {
    name: "Clevone Mining",
    domain: "mining.clevones.com",
    href: "https://mining.clevones.com",
    role: "Operational mining unit — extraction and transformation",
    description:
      "Clevone Mining is a distinct operational unit for responsible extraction, local transformation, and compliance within the productive industries domain. All field operations are conducted under Clevone Mining only — never under the Clevones governance platform.",
    operational: true,
  },
];

export const ecosystemPageDisclaimer = clevoneMiningEcosystemDisclaimer;

export const ecosystemPageMap = {
  eyebrow: "Architecture",
  title: "Governance at the center, specialization at the perimeter",
  description:
    "Neutral platforms coordinate through Clevones. Operational field activity is structurally separated and clearly identified.",
} as const;

/** Satellite entities shown on the home page and footer (excludes central Clevones). */
export const ecosystemSatelliteEntities = ecosystemPageEntities.filter(
  (entity) => !entity.central,
);

export function getEcosystemEntityGroups() {
  const central = ecosystemPageEntities.find((entity) => entity.central);
  const operational = ecosystemPageEntities.find((entity) => entity.operational);
  const neutral = ecosystemPageEntities.filter(
    (entity) => !entity.central && !entity.operational,
  );

  if (!central || !operational) {
    throw new Error("Ecosystem entity configuration is invalid.");
  }

  return { central, neutral, operational };
}
