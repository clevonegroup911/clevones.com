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
    quoteHref?: string;
    quoteCta?: string;
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
        "CLEVONE SARL's products and services across its nine fields of activity — software, trade, logistics, energy, media, education, advisory and more.",
    },
    hero: {
      eyebrow: "Solutions",
      title: "Products and services for businesses and institutions.",
      subtitle:
        "Software such as CLEVONE DMS, trade and distribution, logistics and advisory — within the fields set by our statutes.",
      tagline: "One company. Nine fields of activity.",
    },
    introduction: {
      eyebrow: "Approach",
      title: "What we offer",
      paragraphs: [
        "CLEVONE SARL develops, sells and operates products and services in the fields set by its corporate purpose.",
        "Regulated activities (transport, energy, some advisory work) are carried out only once the required authorizations or approvals are obtained.",
        "When we coordinate a multi-party initiative, we hold no stake in its execution.",
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
      title: "How we work with you",
      steps: [
        {
          title: "Understand the need",
          description: "Your organization, your constraints, what you want to achieve.",
        },
        {
          title: "Propose a solution",
          description: "A product, a service or a coordination mission — with a clear scope and quote.",
        },
        {
          title: "Deliver and follow up",
          description:
            "Deployment, training and support; for coordination missions, documented reporting.",
        },
      ],
    },
    cta: {
      title: "A product or service need?",
      description: "Request a quote, or present a multi-party initiative.",
      actions: [
        { href: "/contact?intent=product", label: "Request a quote" },
        { href: "/contact", label: "Present an initiative", variant: "outline" },
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
      note: "Capabilities describe the product scope and roadmap. Contact us to check availability for your organization.",
      href: "/solutions/clevone-dms",
      cta: "Explore CLEVONE DMS",
      quoteHref: "/contact?intent=product",
      quoteCta: "Request a quote",
    },
  },
  fr: {
    meta: {
      title: "Solutions",
      description:
        "Les produits et services de CLEVONE SARL dans ses neuf domaines d'activité — logiciels, commerce, logistique, énergie, médias, éducation, conseil et plus.",
    },
    hero: {
      eyebrow: "Solutions",
      title: "Des produits et services pour les entreprises et les institutions.",
      subtitle:
        "Des logiciels comme CLEVONE DMS, du commerce et de la distribution, de la logistique et du conseil — dans les domaines fixés par nos statuts.",
      tagline: "Une société. Neuf domaines d'activité.",
    },
    introduction: {
      eyebrow: "Approche",
      title: "Ce que nous proposons",
      paragraphs: [
        "CLEVONE SARL développe, vend et exploite des produits et services dans les domaines fixés par son objet social.",
        "Les activités réglementées (transport, énergie, certains conseils) ne sont exercées qu'après obtention des autorisations ou agréments requis.",
        "Quand nous coordonnons une initiative multi-acteurs, nous ne sommes pas partie prenante de son exécution.",
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
      title: "Comment nous travaillons avec vous",
      steps: [
        {
          title: "Comprendre le besoin",
          description:
            "Votre organisation, vos contraintes, ce que vous voulez obtenir.",
        },
        {
          title: "Proposer une solution",
          description:
            "Un produit, un service ou une mission de coordination — avec un périmètre et un devis clairs.",
        },
        {
          title: "Livrer et suivre",
          description:
            "Déploiement, formation et accompagnement ; pour les missions de coordination, un reporting documenté.",
        },
      ],
    },
    cta: {
      title: "Un besoin de produit ou de service ?",
      description: "Demandez un devis, ou présentez une initiative multi-acteurs.",
      actions: [
        { href: "/collaboration?intent=product", label: "Demander un devis" },
        { href: "/collaboration", label: "Présenter une initiative", variant: "outline" },
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
      note: "Les fonctions présentées décrivent le périmètre du produit et sa feuille de route. Contactez-nous pour connaître sa disponibilité pour votre organisation.",
      href: "/domaines/clevone-dms",
      cta: "Découvrir CLEVONE DMS",
      quoteHref: "/collaboration?intent=product",
      quoteCta: "Demander un devis",
    },
  },
} as const satisfies LocalizedPageContent<SolutionsPageContent>;
