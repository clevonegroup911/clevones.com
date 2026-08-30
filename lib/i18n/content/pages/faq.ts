import type { CtaContent, HeroContent, LocalizedPageContent, PageMeta } from "./types";

export type FaqPageContent = {
  meta: PageMeta;
  hero: HeroContent;
  items: readonly { question: string; answer: string }[];
  cta: CtaContent;
};

export const faqPageContent = {
  en: {
    meta: { title: "FAQ", description: "Institutional answers about Clevones' role, corporate purpose, ecosystem, and engagement criteria." },
    hero: {
      eyebrow: "FAQ",
      title: "Clear answers. No jargon.",
      subtitle: "Role, corporate purpose, ecosystem, and how to engage — explained directly.",
    },
    items: [
      {
        question: "What is CLEVONES / CLEVONE SARL?",
        answer: "CLEVONES is the public brand of CLEVONE SARL, a Congolese multi-sector company based in Kisangani. It builds digital, commercial, and institutional infrastructure — including software, logistics, media, education, and advisory — with a strategic vision of Governance Architecture for Territorial Economic Flows.",
      },
      {
        question: "What is Clevones' corporate purpose (objet social)?",
        answer: "The corporate purpose defines legal fields of intervention: technology, logistics, industry, energy, media, education, governance advisory, and lawful commerce. It also covers subsidiaries, equity participations, and partnerships under applicable law.",
      },
      {
        question: "Does a broad corporate purpose mean Clevones is a multi-service operator?",
        answer: "No. The corporate purpose defines where the company and its ecosystem may intervene. The Clevones governance platform itself remains a neutral coordination layer — not an operator, trader, or resource exploiter.",
      },
      {
        question: "How does the ecosystem relate to the corporate purpose?",
        answer: "The public ecosystem is organized around CLEVONE SARL, CLEVONE Technologies, CLEVONE DMS, CLEVONET, CLEVODIA, BICUNI, and Btlearn. Clevone Mining is presented as an ecosystem project / entity with distinct status. No separate legal registration is claimed on this site except for CLEVONE SARL.",
      },
      {
        question: "Is Clevone Mining part of the governance platform?",
        answer: "Clevone Mining is presented as an ecosystem project / entity with distinct status. It is not described on this site as an operational mining unit. No separate legal registration is claimed except for CLEVONE SARL.",
      },
      {
        question: "What is CLEVONE DMS?",
        answer: "CLEVONE DMS is a Digital Management System for modern businesses — sales, customers, inventory, suppliers, expenses, revenue, invoices, documents, dashboards, reports, users & permissions, and cloud synchronization. Functions are presented as product capabilities and roadmap, not as a live backend on this website.",
      },
      {
        question: "Who can engage with Clevones?",
        answer: "Institutions, investors, structured logistics actors, and strategic partners with documented initiatives. Engagement is filtered for legitimacy, compliance readiness, institutional compatibility, and long-term value.",
      },
      {
        question: "What does Clevones not do?",
        answer: "Clevones is not an operator, trader, resource exploiter, direct intermediary, informal broker, or generic services vendor. It does not substitute legitimate economic actors.",
      },
      {
        question: "How does collaboration begin?",
        answer: "Through a structured initiative submission. Clevones reviews documented, compliant proposals under its Five-Step Framework — not through informal discussion or commercial intermediation.",
      },
    ],
    cta: {
      title: "Ready to talk?",
      description: "Start with a structured conversation. Clevones reviews documented initiatives only.",
      actions: [{ href: "/contact", label: "Start a strategic conversation" }],
    },
  },
  fr: {
    meta: { title: "FAQ", description: "Réponses institutionnelles sur le rôle, l'objet social, l'écosystème et les critères d'engagement de Clevones." },
    hero: {
      eyebrow: "FAQ",
      title: "Des réponses claires. Sans jargon.",
      subtitle: "Rôle, objet social, écosystème et modalités d'engagement — expliqués directement.",
    },
    items: [
      {
        question: "Qu'est-ce que CLEVONES / CLEVONE SARL ?",
        answer: "CLEVONES est la marque publique de CLEVONE SARL, société congolaise multisectorielle basée à Kisangani. Elle construit des infrastructures numériques, commerciales et institutionnelles — logiciels, logistique, médias, éducation et conseil — avec la vision stratégique Architecture de gouvernance des flux économiques territoriaux.",
      },
      {
        question: "Quel est l'objet social de Clevones ?",
        answer: "L'objet social définit les champs juridiques d'intervention : technologies, logistique, industrie, énergie, médias, éducation, conseil en gouvernance et commerce licite. Il couvre également filiales, prises de participation et partenariats dans le respect du droit applicable.",
      },
      {
        question: "Un objet social étendu signifie-t-il que Clevones est un opérateur multiservices ?",
        answer: "Non. L'objet social définit les champs dans lesquels la société et son écosystème peuvent intervenir. La plateforme de gouvernance Clevones demeure une couche neutre de coordination — non un opérateur, un négociant ou un exploitant de ressources.",
      },
      {
        question: "Quel est le lien entre l'écosystème et l'objet social ?",
        answer: "L'écosystème public s'organise autour de CLEVONE SARL, CLEVONE Technologies, CLEVONE DMS, CLEVONET, CLEVODIA, BICUNI et Btlearn. Clevone Mining est présentée comme un projet / une entité de l'écosystème à statut distinct. Aucune immatriculation juridique distincte n'est affirmée sur ce site, hormis celle de CLEVONE SARL.",
      },
      {
        question: "Clevone Mining fait-elle partie de la plateforme de gouvernance ?",
        answer: "Clevone Mining est présentée comme un projet / une entité de l'écosystème à statut distinct. Elle n'est pas décrite sur ce site comme une unité minière opérationnelle. Aucune immatriculation juridique distincte n'est affirmée, hormis celle de CLEVONE SARL.",
      },
      {
        question: "Qu'est-ce que CLEVONE DMS ?",
        answer: "CLEVONE DMS est un progiciel de gestion numérique pour les entreprises modernes — ventes, clients, stocks, fournisseurs, dépenses, recettes, factures, documents, tableaux de bord, rapports, utilisateurs et permissions, et synchronisation cloud. Les fonctions sont présentées comme capacités et feuille de route produit, non comme un backend en ligne sur ce site.",
      },
      {
        question: "Qui peut s'engager avec Clevones ?",
        answer: "Institutions, investisseurs, acteurs logistiques structurés et partenaires stratégiques disposant d'initiatives documentées. L'engagement est évalué selon la légitimité, la préparation à la conformité, la compatibilité institutionnelle et la valeur de long terme.",
      },
      {
        question: "Que ne fait pas Clevones ?",
        answer: "Clevones n'est ni opérateur, ni négociant, ni exploitant de ressources, ni intermédiaire direct, ni courtier informel, ni prestataire de services génériques. Elle ne se substitue pas aux acteurs économiques légitimes.",
      },
      {
        question: "Comment débute une collaboration ?",
        answer: "Par la soumission d'une initiative structurée. Clevones examine les propositions documentées et conformes selon son Cadre en cinq étapes — non par des échanges informels ou de l'intermédiation commerciale.",
      },
    ],
    cta: {
      title: "Prêt à échanger ?",
      description: "Commencez par une conversation structurée. Clevones examine uniquement les initiatives documentées.",
      actions: [{ href: "/collaboration", label: "Commencer une conversation stratégique" }],
    },
  },
} as const satisfies LocalizedPageContent<FaqPageContent>;
