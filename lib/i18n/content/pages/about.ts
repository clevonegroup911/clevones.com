import {
  company,
  companyAddressLinesEn,
  companyAddressLinesFr,
} from "@/lib/constants/company";
import {
  capacityVsPlatformClarification,
  corporateMission,
  corporateVision,
  domainsFraming,
  interventionDomains,
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
      eyebrow: "Company",
      title: "CLEVONE SARL",
      subtitle:
        "A Congolese technology and business company based in Kisangani, building digital, commercial, and institutional infrastructure for Africa.",
      tagline: "Kisangani · Democratic Republic of the Congo",
    },
    identity: {
      eyebrow: "Identity",
      title: "A Congolese company. A public brand: CLEVONES.",
      description:
        "CLEVONE SARL is the legal entity. CLEVONES is the public brand.",
      paragraphs: [
        "CLEVONE SARL is a limited liability company (multi-member SARL) incorporated in the Democratic Republic of the Congo, with its registered office in Kisangani, Commune de Makiso.",
        "The public brand CLEVONES represents the company's institutional, technological, and commercial presence — software, platforms, logistics, industry, media, education, and advisory.",
        capacityVsPlatformClarification.en,
      ],
    },
    mission: {
      eyebrow: "Mission",
      title: corporateMission.title,
      paragraphs: [
        corporateMission.statement,
        "The company preserves documented, compliant structures. Operational field activity, where it exists, is presented separately from the CLEVONES institutional platform.",
      ],
    },
    vision: {
      eyebrow: "Vision",
      title: corporateVision.title,
      paragraphs: [
        corporateVision.statement,
        `Strategic vision: ${company.strategicVision}. This orientation guides how CLEVONE SARL structures digital, commercial, and institutional systems. It is not the company's unique legal activity.`,
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
        { label: "Incorporation date", value: company.incorporationDateDisplay },
        { label: "Share capital", value: company.shareCapital },
      ],
      addressLabel: "Registered office",
      addressLines: companyAddressLinesEn,
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
      eyebrow: "Société",
      title: "CLEVONE SARL",
      subtitle:
        "Une entreprise congolaise de technologies et d'affaires basée à Kisangani, qui construit les infrastructures numériques, commerciales et institutionnelles de l'Afrique.",
      tagline: "Kisangani · République Démocratique du Congo",
    },
    identity: {
      eyebrow: "Identité",
      title: "Une société congolaise. Une marque publique : CLEVONES.",
      description:
        "CLEVONE SARL est la personne morale. CLEVONES est la marque publique.",
      paragraphs: [
        "CLEVONE SARL est une société à responsabilité limitée pluripersonnelle (SARL) immatriculée en République Démocratique du Congo, dont le siège social est à Kisangani, Commune de Makiso.",
        "La marque publique CLEVONES représente la présence institutionnelle, technologique et commerciale de la société — logiciels, plateformes, logistique, industrie, médias, éducation et conseil.",
        capacityVsPlatformClarification.fr,
      ],
    },
    mission: {
      eyebrow: "Mission",
      title: "Construire les infrastructures numériques, commerciales et institutionnelles de l'Afrique",
      paragraphs: [
        corporateMission.statementFr,
        "La société préserve des structures documentées et conformes. L'activité opérationnelle de terrain, lorsqu'elle existe, est présentée séparément de la plateforme institutionnelle CLEVONES.",
      ],
    },
    vision: {
      eyebrow: "Vision",
      title: "Transformer le potentiel territorial en actifs économiques durables",
      paragraphs: [
        corporateVision.statementFr,
        `Vision stratégique : ${company.strategicVisionFr}. Cette orientation guide la manière dont CLEVONE SARL structure les systèmes numériques, commerciaux et institutionnels. Elle n'est pas l'unique activité juridique de la société.`,
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
        { label: "Capital social", value: company.shareCapital },
      ],
      addressLabel: "Siège social",
      addressLines: companyAddressLinesFr,
      objetSocial: {
        title: "Objet social",
        intro: objetSocialLegalFr.intro,
        items: objetSocialLegalFr.items,
        closing: objetSocialLegalFr.closing,
        note: "Le détail intégral figure également dans les mentions légales.",
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
