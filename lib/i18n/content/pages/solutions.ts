import {
  domainsFraming,
  interventionDomains,
} from "@/lib/constants/corporate-purpose";
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
  featuredProduct: {
    eyebrow: string;
    name: string;
    type: string;
    positioning: string;
    description: string;
    capabilitiesLabel: string;
    functions: readonly string[];
    note: string;
    href: string;
    cta: string;
  };
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
      eyebrow: domainsFraming.eyebrow,
      title: domainsFraming.title,
      description: domainsFraming.description,
      items: interventionDomains.map((domain) => ({
        title: domain.title,
        description: domain.regulatoryNote
          ? `${domain.summary.replace(/\.$/, "")}, ${domain.regulatoryNote}.`
          : domain.summary,
        ecosystemLink: domain.ecosystemLink,
      })),
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
    featuredProduct: {
      eyebrow: "Business software",
      name: "CLEVONE DMS",
      type: "Commercial software / Digital Management System",
      positioning: "Digital Management System for modern businesses",
      description:
        "A Digital Management System covering sales, customers, inventory, suppliers, expenses, revenue, invoices, documents, dashboards, reports, users & permissions, and cloud synchronization.",
      capabilitiesLabel: "Capabilities",
      functions: [
        "Sales",
        "Customers",
        "Inventory",
        "Suppliers",
        "Expenses",
        "Revenue",
        "Invoices",
        "Documents",
        "Dashboards",
        "Reports",
        "Users & Permissions",
        "Cloud Synchronization",
      ],
      note: "Capabilities describe the product architecture and roadmap.",
      href: "/solutions/clevone-dms",
      cta: "Explore CLEVONE DMS",
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
      eyebrow: domainsFraming.eyebrowFr,
      title: domainsFraming.titleFr,
      description: domainsFraming.descriptionFr,
      items: interventionDomains.map((domain) => ({
        title: domain.titleFr,
        description: domain.regulatoryNoteFr
          ? `${domain.summaryFr.replace(/\.$/, "")}, ${domain.regulatoryNoteFr}.`
          : domain.summaryFr,
        ecosystemLink: domain.ecosystemLink,
      })),
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
    featuredProduct: {
      eyebrow: "Progiciel",
      name: "CLEVONE DMS",
      type: "Progiciel de gestion numérique",
      positioning: "Progiciel de gestion numérique pour les entreprises modernes",
      description:
        "Un progiciel de gestion numérique couvrant ventes, clients, stocks, fournisseurs, dépenses, recettes, factures, documents, tableaux de bord, rapports, utilisateurs et permissions, et synchronisation cloud.",
      capabilitiesLabel: "Capacités",
      functions: [
        "Ventes",
        "Clients",
        "Stocks",
        "Fournisseurs",
        "Dépenses",
        "Recettes",
        "Factures",
        "Documents",
        "Tableaux de bord",
        "Rapports",
        "Utilisateurs et permissions",
        "Synchronisation cloud",
      ],
      note: "Les capacités décrivent l'architecture produit et la feuille de route.",
      href: "/domaines/clevone-dms",
      cta: "Découvrir CLEVONE DMS",
    },
  },
} as const satisfies LocalizedPageContent<SolutionsPageContent>;
