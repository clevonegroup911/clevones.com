import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
  TitledDescription,
} from "./types";

export type ChallengePageContent = {
  meta: PageMeta;
  breadcrumb: { home: string; current: string; navLabel: string };
  hero: HeroContent;
  centralProblem: SectionHeadingContent & { paragraphs: readonly string[] };
  fragmentation: SectionHeadingContent & {
    items: readonly TitledDescription[];
  };
  consequences: SectionHeadingContent & {
    items: readonly TitledDescription[];
  };
  insufficientResponses: SectionHeadingContent & {
    paragraphs: readonly string[];
  };
  handoff: SectionHeadingContent & { paragraphs: readonly string[] };
  cta: CtaContent;
};

/**
 * Challenge — Mission #004 messaging. No invented statistics or clients.
 * Meta left unchanged (SEO freeze).
 */
export const challengePageContent = {
  en: {
    meta: {
      title: "The Coordination Challenge",
      description:
        "Territorial economic potential is constrained by fragmented actors, informal coordination, weak documentation, and unclear responsibilities — before capital or execution.",
    },
    breadcrumb: { home: "Home", current: "Challenge", navLabel: "Breadcrumb" },
    hero: {
      eyebrow: "Challenge",
      title: "Fragmented coordination blocks territorial value.",
      subtitle:
        "Projects stall when actors, information, and responsibilities stay disconnected.",
      tagline: "Structure before capital.",
    },
    centralProblem: {
      eyebrow: "The problem",
      title: "Potential is not enough.",
      paragraphs: [
        "Territorial opportunities often fail to become durable value. Not because opportunity is missing — because shared coordination is missing.",
        "Without common rules and clear roles, initiatives stay informal. Institutions and investors cannot evaluate them.",
      ],
    },
    fragmentation: {
      eyebrow: "Where it breaks",
      title: "Five places coordination fails",
      description: "Each gap makes the whole initiative harder to govern.",
      items: [
        {
          title: "Actors",
          description:
            "Institutions, enterprises, and partners work in parallel instead of inside one shared frame.",
        },
        {
          title: "Information",
          description:
            "Data stays in silos. Decisions rely on incomplete or informal channels.",
        },
        {
          title: "Rules",
          description:
            "Compliance arrives late or inconsistently. Risk rises.",
        },
        {
          title: "Decisions",
          description:
            "Roles stay unclear. Continuity depends on people, not structures.",
        },
        {
          title: "Capital and infrastructure",
          description:
            "Money and assets move before flows and governance are designed.",
        },
      ],
    },
    consequences: {
      eyebrow: "What follows",
      title: "The cost of fragmentation",
      description: "These outcomes are structural. No invented metrics required.",
      items: [
        {
          title: "Duplication",
          description: "Teams repeat work and lose time.",
        },
        {
          title: "Weak readability",
          description:
            "Institutions cannot see who decides, who reports, or what is proposed.",
        },
        {
          title: "Trust erosion",
          description:
            "Informal alignment works briefly. Opacity grows. Serious partners hesitate.",
        },
        {
          title: "Capital before structure",
          description:
            "Funding without governance amplifies fragmentation.",
        },
        {
          title: "Fragile continuity",
          description:
            "Without documentation, initiatives lose memory and accountability.",
        },
      ],
    },
    insufficientResponses: {
      eyebrow: "What does not fix it",
      title: "A tool or a workshop is not a coordination layer.",
      paragraphs: [
        "Adding software, a meeting, or a bilateral deal does not create neutral governance.",
        "Finding an opportunity is not forming an initiative. Institutions need documented roles and protocols.",
      ],
    },
    handoff: {
      eyebrow: "Next",
      title: "The problem is also a timing problem.",
      paragraphs: [
        "Connected systems and rising compliance raise the cost of waiting.",
        "Next: why action is needed now.",
      ],
    },
    cta: {
      title: "See why timing matters",
      description:
        "Understand the pressures that make informal coordination harder to sustain.",
      actions: [
        {
          href: "/why-now",
          label: "See why timing matters",
        },
      ],
    },
  },
  fr: {
    meta: {
      title: "Le défi de coordination",
      description:
        "Le potentiel économique territorial est limité par des acteurs fragmentés, une coordination informelle, une documentation faible et des responsabilités peu lisibles — avant le capital ou l'exécution.",
    },
    breadcrumb: { home: "Accueil", current: "Défi", navLabel: "Fil d'Ariane" },
    hero: {
      eyebrow: "Défi",
      title: "Une coordination fragmentée bloque la valeur territoriale.",
      subtitle:
        "Les projets s'enlisent quand acteurs, information et responsabilités restent déconnectés.",
      tagline: "La structure avant le capital.",
    },
    centralProblem: {
      eyebrow: "Le problème",
      title: "Le potentiel ne suffit pas.",
      paragraphs: [
        "Les opportunités territoriales ne deviennent souvent pas une valeur durable. Non par manque d'opportunité — par manque de coordination partagée.",
        "Sans règles communes ni rôles clairs, les initiatives restent informelles. Institutions et investisseurs ne peuvent pas les évaluer.",
      ],
    },
    fragmentation: {
      eyebrow: "Où ça se rompt",
      title: "Cinq lieux où la coordination échoue",
      description:
        "Chaque lacune rend l'initiative entière plus difficile à gouverner.",
      items: [
        {
          title: "Acteurs",
          description:
            "Institutions, entreprises et partenaires travaillent en parallèle au lieu d'un cadre partagé.",
        },
        {
          title: "Information",
          description:
            "Les données restent en silos. Les décisions s'appuient sur des canaux incomplets ou informels.",
        },
        {
          title: "Règles",
          description:
            "La conformité arrive tard ou de façon incohérente. Le risque augmente.",
        },
        {
          title: "Décisions",
          description:
            "Les rôles restent flous. La continuité dépend des personnes, pas des structures.",
        },
        {
          title: "Capital et infrastructures",
          description:
            "L'argent et les actifs bougent avant que les flux et la gouvernance soient conçus.",
        },
      ],
    },
    consequences: {
      eyebrow: "Ce qui suit",
      title: "Le coût de la fragmentation",
      description:
        "Ces résultats sont structurels. Aucune métrique inventée n'est nécessaire.",
      items: [
        {
          title: "Duplication",
          description: "Les équipes répètent le travail et perdent du temps.",
        },
        {
          title: "Faible lisibilité",
          description:
            "Les institutions ne voient pas qui décide, qui rend compte, ni ce qui est proposé.",
        },
        {
          title: "Érosion de la confiance",
          description:
            "L'alignement informel dure peu. L'opacité croît. Les partenaires sérieux hésitent.",
        },
        {
          title: "Capital avant structure",
          description:
            "Un financement sans gouvernance amplifie la fragmentation.",
        },
        {
          title: "Continuité fragile",
          description:
            "Sans documentation, les initiatives perdent mémoire et redevabilité.",
        },
      ],
    },
    insufficientResponses: {
      eyebrow: "Ce qui ne suffit pas",
      title: "Un outil ou un atelier n'est pas une couche de coordination.",
      paragraphs: [
        "Ajouter un logiciel, une réunion ou un accord bilatéral ne crée pas une gouvernance neutre.",
        "Trouver une opportunité n'est pas former une initiative. Les institutions ont besoin de rôles et de protocoles documentés.",
      ],
    },
    handoff: {
      eyebrow: "Ensuite",
      title: "Le problème est aussi une question de temps.",
      paragraphs: [
        "Des systèmes plus connectés et une conformité plus exigeante augmentent le coût d'attendre.",
        "Ensuite : pourquoi il faut agir maintenant.",
      ],
    },
    cta: {
      title: "Voir pourquoi le moment compte",
      description:
        "Comprendre les pressions qui rendent la coordination informelle plus difficile à soutenir.",
      actions: [
        {
          href: "/pourquoi-maintenant",
          label: "Voir pourquoi le moment compte",
        },
      ],
    },
  },
} as const satisfies LocalizedPageContent<ChallengePageContent>;
