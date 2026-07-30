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
        question: "What is Clevones?",
        answer: "Clevones is a neutral governance platform. It designs, structures, and coordinates territorial economic flows in the DRC and across Africa — through documented methodology, not informal brokerage.",
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
        answer: "Specialized entities extend domain capacity: Clevodia (media and economic analysis), Clevonet (secure digital infrastructure), Bicuni (scientific knowledge), Btlearn Inc. (certified education), and Clevone Mining (operational extraction, structurally separated). Clevones remains the neutral hub.",
      },
      {
        question: "Is Clevone Mining part of the governance platform?",
        answer: "No. Clevone Mining conducts field operations. It is structurally separated from the neutral governance role of Clevones. No operational activity runs under the Clevones governance platform.",
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
        question: "Qu'est-ce que Clevones ?",
        answer: "Clevones est une plateforme neutre de gouvernance. Elle conçoit, structure et coordonne des flux économiques territoriaux en RDC et en Afrique — par une méthodologie documentée, non par du courtage informel.",
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
        answer: "Des entités spécialisées étendent les capacités des domaines : Clevodia (médias et analyse économique), Clevonet (infrastructure numérique sécurisée), Bicuni (savoir scientifique), Btlearn Inc. (formation certifiante) et Clevone Mining (extraction opérationnelle, structurellement séparée). Clevones demeure le hub neutre.",
      },
      {
        question: "Clevone Mining fait-elle partie de la plateforme de gouvernance ?",
        answer: "Non. Clevone Mining conduit les opérations de terrain. Elle est structurellement séparée du rôle de gouvernance neutre de Clevones. Aucune activité opérationnelle ne s'exerce sous la plateforme de gouvernance Clevones.",
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
