import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
  TitledDescription,
} from "./types";

export type SolutionsPageContent = {
  meta: PageMeta;
  hero: HeroContent;
  introduction: SectionHeadingContent & { paragraphs: readonly string[] };
  domains: SectionHeadingContent & {
    items: readonly (TitledDescription & { ecosystemLink?: string })[];
  };
  howEngagementWorks: SectionHeadingContent & {
    steps: readonly TitledDescription[];
  };
  cta: CtaContent;
};

/**
 * Solutions — Mission #004. Domains of intervention, not a services catalogue.
 * Meta unchanged (SEO freeze).
 */
export const solutionsPageContent = {
  en: {
    meta: {
      title: "Solutions",
      description:
        "Clevones designs governed territorial architectures across its lawful fields of intervention.",
    },
    hero: {
      eyebrow: "Domains",
      title: "Where CLEVONES may design territorial architectures.",
      subtitle:
        "These are legal fields of intervention — not a menu of generic services.",
      tagline: "One mandate. Several domains.",
    },
    introduction: {
      eyebrow: "Approach",
      title: "Architecture in lawful fields — not multi-service operation",
      paragraphs: [
        "Corporate purpose defines where we may design and coordinate territorial architectures.",
        "Domains expand capacity through the platform, specialized entities, or subsidiaries when required.",
        "The governance platform remains a coordination layer — not an operator.",
      ],
    },
    domains: {
      eyebrow: "Domains",
      title: "Nine fields. One mandate.",
      description:
        "In each field we structure, coordinate, and report — without substituting operators.",
      items: [
        {
          title: "Technology & digital transformation",
          description:
            "Digital systems that make coordination readable and auditable.",
          ecosystemLink: "Clevonet",
        },
        {
          title: "Transport, logistics & supply chains",
          description:
            "Structure circulation systems without informal brokerage.",
        },
        {
          title: "Industry & productive innovation",
          description:
            "Document productive initiatives for long-horizon territorial value.",
          ecosystemLink: "Clevone Mining",
        },
        {
          title: "Energy",
          description:
            "Coordinate energy-related initiatives as part of territorial infrastructure.",
        },
        {
          title: "Media & creative industries",
          description:
            "Economic intelligence and communication that support institutional decisions.",
          ecosystemLink: "Clevodia",
        },
        {
          title: "Education & capacity building",
          description:
            "Skills and knowledge infrastructures that strengthen institutions.",
          ecosystemLink: "Btlearn Inc. / Bicuni",
        },
        {
          title: "Strategic advisory, compliance & governance",
          description:
            "Advisory and governance accompaniment within applicable law.",
        },
        {
          title: "Sports, culture & professional events",
          description:
            "Structured platforms for territorial visibility and coordination.",
        },
        {
          title: "Commerce & authorized distribution",
          description:
            "Lawful trade capacity via separated structures — never informal brokerage under the governance platform.",
        },
      ],
    },
    howEngagementWorks: {
      eyebrow: "Engagement",
      title: "Architecture before execution",
      steps: [
        {
          title: "Read the territory",
          description: "Non-sensitive view of actors, constraints, and context.",
        },
        {
          title: "Design flows and governance",
          description: "Map circulation. Define roles, reporting, and compliance.",
        },
        {
          title: "Coordinate delivery",
          description:
            "Align legitimate actors — and ecosystem entities when needed — without informal brokerage.",
        },
      ],
    },
    cta: {
      title: "See how engagement is sequenced",
      description: "Five steps from territorial reading to strategic reporting.",
      actions: [
        { href: "/methodology", label: "See the methodology" },
      ],
    },
  },
  fr: {
    meta: {
      title: "Solutions",
      description:
        "Clevones conçoit des architectures territoriales gouvernées dans ses champs d'intervention licites.",
    },
    hero: {
      eyebrow: "Domaines",
      title: "Où CLEVONES peut concevoir des architectures territoriales.",
      subtitle:
        "Ce sont des champs juridiques d'intervention — pas un menu de services génériques.",
      tagline: "Un mandat. Plusieurs domaines.",
    },
    introduction: {
      eyebrow: "Approche",
      title: "Architecture dans des champs licites — pas une opération multiservices",
      paragraphs: [
        "L'objet social définit où nous pouvons concevoir et coordonner des architectures territoriales.",
        "Les domaines élargissent la capacité via la plateforme, des entités spécialisées ou des filiales si besoin.",
        "La plateforme de gouvernance reste une couche de coordination — pas un opérateur.",
      ],
    },
    domains: {
      eyebrow: "Domaines",
      title: "Neuf champs. Un mandat.",
      description:
        "Dans chaque champ, nous structurons, coordonnons et rendons compte — sans substituer les opérateurs.",
      items: [
        {
          title: "Technologies et transformation numérique",
          description:
            "Des systèmes numériques qui rendent la coordination lisible et auditable.",
          ecosystemLink: "Clevonet",
        },
        {
          title: "Transport, logistique et chaînes d'approvisionnement",
          description:
            "Structurer les systèmes de circulation sans courtage informel.",
        },
        {
          title: "Industrie et innovation productive",
          description:
            "Documenter des initiatives productives pour une valeur territoriale de long terme.",
          ecosystemLink: "Clevone Mining",
        },
        {
          title: "Énergie",
          description:
            "Coordonner des initiatives énergétiques comme partie de l'infrastructure territoriale.",
        },
        {
          title: "Médias et industries créatives",
          description:
            "Intelligence économique et communication au service de la décision institutionnelle.",
          ecosystemLink: "Clevodia",
        },
        {
          title: "Éducation et renforcement des capacités",
          description:
            "Compétences et infrastructures de savoir qui renforcent les institutions.",
          ecosystemLink: "Btlearn Inc. / Bicuni",
        },
        {
          title: "Conseil stratégique, conformité et gouvernance",
          description:
            "Conseil et accompagnement de gouvernance dans le respect du droit applicable.",
        },
        {
          title: "Sports, culture et événements professionnels",
          description:
            "Plateformes structurées de visibilité et de coordination territoriales.",
        },
        {
          title: "Commerce et distribution autorisée",
          description:
            "Capacité de commerce licite via des structures séparées — jamais de courtage informel sous la plateforme de gouvernance.",
        },
      ],
    },
    howEngagementWorks: {
      eyebrow: "Engagement",
      title: "L'architecture avant l'exécution",
      steps: [
        {
          title: "Lire le territoire",
          description:
            "Vue non sensible des acteurs, contraintes et du contexte.",
        },
        {
          title: "Concevoir flux et gouvernance",
          description:
            "Cartographier la circulation. Définir rôles, reporting et conformité.",
        },
        {
          title: "Coordonner la livraison",
          description:
            "Aligner les acteurs légitimes — et les entités de l'écosystème si besoin — sans courtage informel.",
        },
      ],
    },
    cta: {
      title: "Voir comment l'engagement est séquencé",
      description:
        "Cinq étapes, de la lecture territoriale au reporting stratégique.",
      actions: [
        { href: "/methodologie", label: "Voir la méthodologie" },
      ],
    },
  },
} as const satisfies LocalizedPageContent<SolutionsPageContent>;
