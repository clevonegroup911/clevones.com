import {
  company,
  companyAddressLinesEn,
  companyAddressLinesFr,
  companyBrandStatementEn,
  companyBrandStatementFr,
} from "@/lib/constants/company";
import {
  capacityVsPlatformClarification,
  corporateMission,
  corporateVision,
  domainsFraming,
  interventionDomains,
  objetSocialLegalEn,
  objetSocialLegalFr,
} from "@/lib/constants/corporate-purpose";
import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
} from "./types";

export type AboutLegalFact = {
  label: string;
  value: string;
};

export type AboutEcosystemItem = {
  name: string;
  role: string;
};

export type AboutPageContent = {
  meta: PageMeta;
  hero: HeroContent;
  identity: SectionHeadingContent & { paragraphs: readonly string[] };
  mission: SectionHeadingContent & { paragraphs: readonly string[] };
  vision: SectionHeadingContent & { paragraphs: readonly string[] };
  activities: SectionHeadingContent & {
    domains: readonly {
      id: string;
      title: string;
      description: string;
      ecosystemLink?: string;
    }[];
  };
  ecosystem: SectionHeadingContent & {
    items: readonly AboutEcosystemItem[];
    href: string;
    linkLabel: string;
  };
  governance: SectionHeadingContent & {
    paragraphs: readonly string[];
    href: string;
    linkLabel: string;
  };
  legal: SectionHeadingContent & {
    facts: readonly AboutLegalFact[];
    addressLabel: string;
    addressLines: readonly string[];
    objetSocial?: {
      title: string;
      intro: string;
      items: readonly string[];
      closing: string;
      note: string;
      legalHref: string;
      legalLabel: string;
    };
  };
  cta: CtaContent;
};

export const aboutPageContent = {
  en: {
    meta: {
      title: "About CLEVONE SARL",
      description:
        "CLEVONE SARL is a Congolese multi-sector company based in Kisangani — technology, business software, logistics, industry, energy, media, education, and advisory.",
    },
    hero: {
      eyebrow: "About CLEVONE SARL",
      title: "A Congolese company that builds software, trades and delivers services.",
      subtitle:
        "Based in Kisangani, CLEVONE SARL works in nine fields set by its statutes — from software and trade to logistics, energy, media, education, advisory and events.",
      tagline: "Kisangani · Democratic Republic of the Congo",
    },
    identity: {
      eyebrow: "Identity",
      title: "A Congolese company. A public brand: CLEVONES.",
      description:
        "CLEVONE SARL is the legal entity. CLEVONES is the public brand.",
      paragraphs: [
        "CLEVONE SARL is a limited liability company (multi-member SARL) incorporated in the Democratic Republic of the Congo, with its registered office in Kisangani, Commune de Makiso.",
        `${companyBrandStatementEn} Statutes institute no acronym: CLEVONES is a brand.`,
        capacityVsPlatformClarification.en,
      ],
    },
    mission: {
      eyebrow: "Mission",
      title: corporateMission.title,
      paragraphs: [
        corporateMission.statement,
        "When CLEVONE coordinates a multi-party initiative, any operational role of another of its activities is declared in advance and kept separate from the mission.",
      ],
    },
    vision: {
      eyebrow: "Vision",
      title: corporateVision.title,
      paragraphs: [
        corporateVision.statement,
        `Strategic orientation of our advisory and governance line: ${company.strategicVision}. It guides how we help institutions structure multi-party initiatives; it does not define the whole company.`,
      ],
    },
    activities: {
      eyebrow: domainsFraming.eyebrow,
      title: domainsFraming.title,
      description: domainsFraming.description,
      domains: interventionDomains.map((domain) => ({
        id: domain.id,
        title: domain.title,
        description: domain.architectureRole,
        ecosystemLink: domain.ecosystemLink,
      })),
    },
    ecosystem: {
      eyebrow: "Ecosystem",
      title: "Lines of activity around CLEVONE SARL",
      description:
        "The ecosystem groups the company's public surfaces and related projects. No separate legal registration is claimed here except for CLEVONE SARL.",
      items: [
        { name: "CLEVONE SARL", role: "Legal entity and institutional hub" },
        { name: "CLEVONE Technologies", role: "Technology and digital transformation" },
        { name: "CLEVONE DMS", role: "Commercial software / Digital Management System" },
        { name: "CLEVONET", role: "Extranet and secure digital infrastructure" },
        { name: "CLEVODIA", role: "Media and economic intelligence" },
        { name: "BICUNI", role: "Scientific digital library" },
        { name: "Btlearn", role: "Certified education and training" },
      ],
      href: "/ecosystem",
      linkLabel: "Explore the ecosystem",
    },
    governance: {
      eyebrow: "Governance",
      title: "Documented roles. Public company data only.",
      description:
        "Governance principles are published on this site. Personal data of associates and directors are not published here.",
      paragraphs: [
        "CLEVONE SARL publishes institutional information required for a public company presence: legal identity, registered office, and official contact channels.",
        "Names, private contact details, and other personal data of associates or directors are not disclosed on this website.",
      ],
      href: "/governance",
      linkLabel: "Read the governance doctrine",
    },
    legal: {
      eyebrow: "Legal information",
      title: "Official identification",
      description: "Public legal particulars of CLEVONE SARL.",
      facts: [
        { label: "Legal name", value: company.legalName },
        { label: "Legal form", value: company.legalForm.en },
        { label: company.rccmLabel, value: company.rccm },
        { label: company.nationalIdLabel, value: company.nationalId },
        { label: "Registration date", value: company.incorporationDateDisplay },
      ],
      addressLabel: "Registered office",
      addressLines: companyAddressLinesEn,
      objetSocial: {
        title: "Corporate purpose",
        intro: objetSocialLegalEn.intro,
        items: objetSocialLegalEn.items.slice(0, 9),
        closing: objetSocialLegalEn.closing,
        note: "The full summary, including corporate capacities, is in the legal notice.",
        legalHref: "/legal-notice",
        legalLabel: "Legal notice",
      },
    },
    cta: {
      title: "Engage with CLEVONE SARL.",
      description:
        "Institutions, enterprises, and partners may start a structured conversation or review our solutions.",
      actions: [
        { href: "/contact", label: "Contact CLEVONE" },
        { href: "/solutions", label: "Our Solutions", variant: "outline" },
      ],
    },
  },
  fr: {
    meta: {
      title: "À propos de CLEVONE SARL",
      description:
        "CLEVONE SARL est une société congolaise multisectorielle basée à Kisangani — technologies, progiciels, logistique, industrie, énergie, médias, éducation et conseil.",
    },
    hero: {
      eyebrow: "À propos de CLEVONE SARL",
      title: "Une société congolaise qui développe des logiciels, fait du commerce et fournit des services.",
      subtitle:
        "Basée à Kisangani, CLEVONE SARL intervient dans neuf domaines fixés par ses statuts — des logiciels et du commerce à la logistique, l'énergie, les médias, l'éducation, le conseil et l'événementiel.",
      tagline: "Kisangani · République Démocratique du Congo",
    },
    identity: {
      eyebrow: "Identité",
      title: "Une société congolaise. Une marque publique : CLEVONES.",
      description:
        "CLEVONE SARL est la personne morale. CLEVONES est la marque publique.",
      paragraphs: [
        "CLEVONE SARL est une société à responsabilité limitée pluripersonnelle (SARL) immatriculée en République Démocratique du Congo, dont le siège social est à Kisangani, Commune de Makiso.",
        `${companyBrandStatementFr} Les statuts n'instituent aucun sigle : CLEVONES est une marque.`,
        capacityVsPlatformClarification.fr,
      ],
    },
    mission: {
      eyebrow: "Mission",
      title: corporateMission.titleFr,
      paragraphs: [
        corporateMission.statementFr,
        "Quand CLEVONE coordonne une initiative multi-acteurs, tout rôle opérationnel d'une autre de ses activités est déclaré à l'avance et séparé de la mission.",
      ],
    },
    vision: {
      eyebrow: "Vision",
      title: corporateVision.titleFr,
      paragraphs: [
        corporateVision.statementFr,
        `Orientation stratégique de notre ligne conseil et gouvernance : ${company.strategicVisionFr}. Elle guide la façon dont nous aidons les institutions à structurer des initiatives multi-acteurs ; elle ne définit pas toute la société.`,
      ],
    },
    activities: {
      eyebrow: domainsFraming.eyebrowFr,
      title: domainsFraming.titleFr,
      description: domainsFraming.descriptionFr,
      domains: interventionDomains.map((domain) => ({
        id: domain.id,
        title: domain.titleFr,
        description: domain.architectureRoleFr,
        ecosystemLink: domain.ecosystemLink,
      })),
    },
    ecosystem: {
      eyebrow: "Écosystème",
      title: "Des lignes d'activité autour de CLEVONE SARL",
      description:
        "L'écosystème regroupe les surfaces publiques de la société et les projets associés. Aucune immatriculation juridique distincte n'est affirmée ici, hormis celle de CLEVONE SARL.",
      items: [
        { name: "CLEVONE SARL", role: "Personne morale et hub institutionnel" },
        { name: "CLEVONE Technologies", role: "Technologies et transformation numérique" },
        { name: "CLEVONE DMS", role: "Progiciel de gestion numérique" },
        { name: "CLEVONET", role: "Extranet et infrastructure numérique sécurisée" },
        { name: "CLEVODIA", role: "Médias et intelligence économique" },
        { name: "BICUNI", role: "Bibliothèque numérique scientifique" },
        { name: "Btlearn", role: "Formation et éducation certifiante" },
      ],
      href: "/ecosysteme",
      linkLabel: "Explorer l'écosystème",
    },
    governance: {
      eyebrow: "Gouvernance",
      title: "Des rôles documentés. Uniquement des données sociétaires publiques.",
      description:
        "Les principes de gouvernance sont publiés sur ce site. Les données personnelles des associés et dirigeants n'y figurent pas.",
      paragraphs: [
        "CLEVONE SARL publie les informations institutionnelles nécessaires à une présence sociétaire publique : identité juridique, siège social et canaux de contact officiels.",
        "Les noms, coordonnées privées et autres données personnelles des associés ou dirigeants ne sont pas divulgués sur ce site.",
      ],
      href: "/gouvernance",
      linkLabel: "Lire la doctrine de gouvernance",
    },
    legal: {
      eyebrow: "Informations légales",
      title: "Identification officielle",
      description: "Mentions juridiques publiques de CLEVONE SARL.",
      facts: [
        { label: "Raison sociale", value: company.legalName },
        { label: "Forme juridique", value: company.legalForm.fr },
        { label: company.rccmLabel, value: company.rccm },
        { label: company.nationalIdLabel, value: company.nationalId },
        { label: "Date d'immatriculation", value: company.incorporationDateDisplay },
      ],
      addressLabel: "Siège social",
      addressLines: companyAddressLinesFr,
      objetSocial: {
        title: "Objet social",
        intro: objetSocialLegalFr.intro,
        items: objetSocialLegalFr.items.slice(0, 9),
        closing: objetSocialLegalFr.closing,
        note: "Le résumé complet, capacités sociétaires comprises, figure dans les mentions légales.",
        legalHref: "/mentions-legales",
        legalLabel: "Mentions légales",
      },
    },
    cta: {
      title: "Échanger avec CLEVONE SARL.",
      description:
        "Institutions, entreprises et partenaires peuvent ouvrir une conversation structurée ou consulter nos solutions.",
      actions: [
        { href: "/collaboration", label: "Contacter CLEVONE" },
        { href: "/domaines", label: "Nos solutions", variant: "outline" },
      ],
    },
  },
} as const satisfies LocalizedPageContent<AboutPageContent>;
