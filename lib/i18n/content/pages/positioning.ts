import {
  clevoneMiningSeparationDisclaimer,
  clevoneMiningSeparationDisclaimerFr,
} from "@/lib/constants/brand-positioning";
import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
  TitledDescription,
} from "./types";

export type PositioningPageContent = {
  meta: PageMeta;
  hero: HeroContent;
  definition: SectionHeadingContent & { paragraphs: readonly string[] };
  isSection: SectionHeadingContent & { items: readonly TitledDescription[] };
  isNotSection: SectionHeadingContent & {
    excludedLabel: string;
    items: readonly TitledDescription[];
  };
  distinction: SectionHeadingContent & { paragraphs: readonly string[] };
  corporatePurpose: SectionHeadingContent & { paragraphs: readonly string[] };
  miningDisclaimer: string;
  cta: CtaContent;
};

/**
 * Positioning — Mission #004. Answers why CLEVONES is different.
 * Meta unchanged (SEO freeze).
 */
export const positioningPageContent = {
  en: {
    meta: {
      title: "Positioning",
      description:
        "Clevones is an independent governance architecture platform for territorial economic flows — architect of flows, ecosystem integrator, not an operator, trader, or generic services vendor. Corporate purpose expands domains without replacing this vision.",
    },
    hero: {
      eyebrow: "Positioning",
      title: "CLEVONES is different because it coordinates — it does not operate.",
      subtitle:
        "We design the rules, roles, and reporting. Legitimate actors keep execution.",
      tagline: "Neutral. Non-operational. Documented.",
    },
    definition: {
      eyebrow: "Difference",
      title: "Governance design upstream of execution",
      paragraphs: [
        "CLEVONES structures territorial economic initiatives before capital and field activity move.",
        "We map actors and flows, define who decides, and keep coordination documented.",
        "We do not replace operators, traders, or resource actors under the governance platform.",
      ],
    },
    isSection: {
      eyebrow: "What CLEVONES is",
      title: "Six roles. One posture.",
      description: "Each role is coordination — not commercial operation.",
      items: [
        {
          title: "Architect of flows",
          description: "Design how value is meant to circulate across a territory.",
        },
        {
          title: "Territorial structurer",
          description: "Turn local dynamics into documented, readable initiatives.",
        },
        {
          title: "Coordination platform",
          description: "Give legitimate actors a neutral place to align.",
        },
        {
          title: "Neutral governance layer",
          description: "Exercise coordination without commercial bias.",
        },
        {
          title: "Ecosystem integrator",
          description: "Connect specialized entities under one mandate.",
        },
        {
          title: "Reporting interface",
          description: "Keep decisions and status readable over time.",
        },
      ],
    },
    isNotSection: {
      eyebrow: "What CLEVONES is not",
      title: "Clear boundaries",
      description: "These exclusions protect neutrality.",
      excludedLabel: "Excluded",
      items: [
        {
          title: "Not an operator",
          description: "No field execution under the governance platform.",
        },
        {
          title: "Not a trader",
          description: "No buying, selling, or brokering as the governance platform.",
        },
        {
          title: "Not a resource exploiter",
          description: "No extraction or resource claims under the governance platform.",
        },
        {
          title: "Not a direct intermediary",
          description: "We structure collaboration. We do not insert into deals.",
        },
        {
          title: "Not an informal broker",
          description: "Coordination follows documented protocols only.",
        },
        {
          title: "Not a generic services vendor",
          description: "Broad legal fields do not turn us into a multi-service operator.",
        },
      ],
    },
    distinction: {
      eyebrow: "Why it matters",
      title: "Neutrality is the product of the posture.",
      paragraphs: [
        "Actors who both structure and operate create conflicts of interest.",
        "A non-operational posture protects trust with institutions, investors, and partners.",
        "Serious counterparties engage because we do not compete with their execution role.",
      ],
    },
    corporatePurpose: {
      eyebrow: "Legal fields",
      title: "Capacity expands domains. It does not redefine the role.",
      paragraphs: [
        "Corporate purpose covers technology, logistics, industry, energy, media, education, advisory, events, and lawful commerce — plus subsidiaries and partnerships under applicable law.",
        "These fields say where architectures may be designed. They do not convert CLEVONES into a generic operator.",
      ],
    },
    miningDisclaimer: clevoneMiningSeparationDisclaimer,
    cta: {
      title: "See why CLEVONES exists",
      description: "Mission and vision — then the domains of intervention.",
      actions: [{ href: "/about", label: "See why CLEVONES exists" }],
    },
  },
  fr: {
    meta: {
      title: "Positionnement",
      description:
        "Clevones est architecte des flux, structureur territorial, plateforme de coordination et intégrateur d'écosystèmes — ni opérateur, ni négociant, ni prestataire de services génériques. L'objet social élargit les champs d'intervention sans remplacer cette vision.",
    },
    hero: {
      eyebrow: "Positionnement",
      title:
        "CLEVONES est différent parce qu'il coordonne — il n'opère pas.",
      subtitle:
        "Nous concevons règles, rôles et reporting. Les acteurs légitimes gardent l'exécution.",
      tagline: "Neutre. Non opérationnel. Documenté.",
    },
    definition: {
      eyebrow: "Différence",
      title: "La conception de gouvernance en amont de l'exécution",
      paragraphs: [
        "CLEVONES structure les initiatives économiques territoriales avant que le capital et le terrain n'avancent.",
        "Nous cartographions acteurs et flux, définissons qui décide, et gardons la coordination documentée.",
        "Nous ne remplaçons pas opérateurs, négociants ou acteurs de ressources sous la plateforme de gouvernance.",
      ],
    },
    isSection: {
      eyebrow: "Ce qu'est CLEVONES",
      title: "Six rôles. Une posture.",
      description: "Chaque rôle est de la coordination — pas de l'opération commerciale.",
      items: [
        {
          title: "Architecte des flux",
          description:
            "Concevoir comment la valeur est censée circuler sur un territoire.",
        },
        {
          title: "Structureur territorial",
          description:
            "Transformer des dynamiques locales en initiatives documentées et lisibles.",
        },
        {
          title: "Plateforme de coordination",
          description:
            "Offrir aux acteurs légitimes un lieu neutre pour s'aligner.",
        },
        {
          title: "Couche de gouvernance neutre",
          description: "Exercer la coordination sans biais commercial.",
        },
        {
          title: "Intégrateur d'écosystème",
          description: "Relier des entités spécialisées sous un seul mandat.",
        },
        {
          title: "Interface de reporting",
          description: "Garder décisions et statut lisibles dans le temps.",
        },
      ],
    },
    isNotSection: {
      eyebrow: "Ce que CLEVONES n'est pas",
      title: "Des frontières claires",
      description: "Ces exclusions protègent la neutralité.",
      excludedLabel: "Exclu",
      items: [
        {
          title: "Pas un opérateur",
          description:
            "Pas d'exécution de terrain sous la plateforme de gouvernance.",
        },
        {
          title: "Pas un négociant",
          description:
            "Pas d'achat, de vente ou de courtage en tant que plateforme de gouvernance.",
        },
        {
          title: "Pas un exploitant de ressources",
          description:
            "Pas d'extraction ni de revendication de ressources sous la plateforme de gouvernance.",
        },
        {
          title: "Pas un intermédiaire direct",
          description:
            "Nous structurons la collaboration. Nous ne nous insérons pas dans les deals.",
        },
        {
          title: "Pas un courtier informel",
          description:
            "La coordination suit uniquement des protocoles documentés.",
        },
        {
          title: "Pas un prestataire de services génériques",
          description:
            "Des champs juridiques larges ne font pas de nous un opérateur multiservices.",
        },
      ],
    },
    distinction: {
      eyebrow: "Pourquoi c'est important",
      title: "La neutralité est le produit de la posture.",
      paragraphs: [
        "Les acteurs qui structurent et opèrent à la fois créent des conflits d'intérêt.",
        "Une posture non opérationnelle protège la confiance des institutions, investisseurs et partenaires.",
        "Les contreparties sérieuses s'engagent parce que nous ne concurrençons pas leur rôle d'exécution.",
      ],
    },
    corporatePurpose: {
      eyebrow: "Champs juridiques",
      title: "La capacité élargit les domaines. Elle ne redéfinit pas le rôle.",
      paragraphs: [
        "L'objet social couvre technologies, logistique, industrie, énergie, médias, éducation, conseil, événements et commerce licite — plus filiales et partenariats selon le droit applicable.",
        "Ces champs disent où des architectures peuvent être conçues. Ils ne convertissent pas CLEVONES en opérateur générique.",
      ],
    },
    miningDisclaimer: clevoneMiningSeparationDisclaimerFr,
    cta: {
      title: "Voir pourquoi CLEVONES existe",
      description: "Mission et vision — puis les domaines d'intervention.",
      actions: [{ href: "/mission", label: "Voir pourquoi CLEVONES existe" }],
    },
  },
} as const satisfies LocalizedPageContent<PositioningPageContent>;
