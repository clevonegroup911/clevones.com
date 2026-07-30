import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
  TitledDescription,
} from "./types";

export type WhyNowPageContent = {
  meta: PageMeta;
  breadcrumb: { home: string; current: string; navLabel: string };
  hero: HeroContent;
  acceleratingForces: SectionHeadingContent & {
    items: readonly TitledDescription[];
  };
  currentLimits: SectionHeadingContent & { paragraphs: readonly string[] };
  requiredCapabilities: SectionHeadingContent & {
    items: readonly string[];
  };
  handoff: SectionHeadingContent & { paragraphs: readonly string[] };
  cta: CtaContent;
};

/**
 * Why Now — Mission #004 messaging. No invented forecasts or statistics.
 * Meta left unchanged (SEO freeze).
 */
export const whyNowPageContent = {
  en: {
    meta: {
      title: "Why Coordination Matters Now",
      description:
        "Digital transformation, energy transition, compliance pressure, and investment readiness raise the cost of informal coordination in territorial economic systems.",
    },
    breadcrumb: { home: "Home", current: "Why Now", navLabel: "Breadcrumb" },
    hero: {
      eyebrow: "Why now",
      title: "Waiting makes informal coordination harder — not safer.",
      subtitle:
        "Systems are more connected, more regulated, and less forgiving of undocumented arrangements.",
      tagline: "Structure before scale.",
    },
    acceleratingForces: {
      eyebrow: "Pressures",
      title: "What raises the cost of inaction",
      description: "Described without invented figures.",
      items: [
        {
          title: "Digital systems",
          description:
            "More tools without shared rules create more silos, not more clarity.",
        },
        {
          title: "Faster decisions",
          description:
            "Speed without documented roles amplifies opacity.",
        },
        {
          title: "Infrastructure pressure",
          description:
            "Energy and logistics projects need multi-actor alignment before movement.",
        },
        {
          title: "Compliance expectations",
          description:
            "Institutions expect traceability. Informal channels cannot deliver it consistently.",
        },
        {
          title: "Investment review",
          description:
            "Capital evaluation needs documented initiatives — not narrative alone.",
        },
        {
          title: "Public–private work",
          description:
            "Serious collaboration needs neutral protocols, not discretionary facilitation.",
        },
        {
          title: "African territories and the DRC",
          description:
            "Coordination demand is rising across logistics, industry, and institutional interfaces. Informal arrangements do not scale into durable value.",
        },
      ],
    },
    currentLimits: {
      eyebrow: "Limits",
      title: "Tools and informal networks are not enough.",
      paragraphs: [
        "Point software and ad hoc committees can create temporary alignment. They do not create auditable, investable architectures.",
        "Logistics is governance, not only movement. Capital without structure amplifies fragmentation.",
      ],
    },
    requiredCapabilities: {
      eyebrow: "Required now",
      title: "What organizations must be able to do",
      description: "System requirements — not a product catalogue.",
      items: [
        "Document initiatives so institutions can evaluate them",
        "Coordinate actors without informal brokerage",
        "Keep information boundaries clear and non-sensitive",
        "Support reporting across the initiative lifecycle",
        "Build compliance in from the start",
        "Base investment decisions on structural readiness",
      ],
    },
    handoff: {
      eyebrow: "Next",
      title: "Urgency is not differentiation.",
      paragraphs: [
        "The problem and the timing are clear.",
        "Next: why CLEVONES is different — what it is, and what it is not.",
      ],
    },
    cta: {
      title: "See how CLEVONES is different",
      description:
        "Read the structural posture: neutral coordination, not operation.",
      actions: [
        {
          href: "/positioning",
          label: "See how CLEVONES is different",
        },
      ],
    },
  },
  fr: {
    meta: {
      title: "Pourquoi la coordination compte maintenant",
      description:
        "Transformation numérique, transition énergétique, pression de conformité et préparation à l'investissement accroissent le coût de la coordination informelle dans les systèmes économiques territoriaux.",
    },
    breadcrumb: {
      home: "Accueil",
      current: "Pourquoi maintenant",
      navLabel: "Fil d'Ariane",
    },
    hero: {
      eyebrow: "Pourquoi maintenant",
      title:
        "Attendre rend la coordination informelle plus difficile — pas plus sûre.",
      subtitle:
        "Les systèmes sont plus connectés, plus régulés, et moins tolérants aux arrangements non documentés.",
      tagline: "La structure avant l'échelle.",
    },
    acceleratingForces: {
      eyebrow: "Pressions",
      title: "Ce qui augmente le coût de l'inaction",
      description: "Décrit sans chiffres inventés.",
      items: [
        {
          title: "Systèmes numériques",
          description:
            "Plus d'outils sans règles partagées créent plus de silos, pas plus de clarté.",
        },
        {
          title: "Décisions plus rapides",
          description:
            "La vitesse sans rôles documentés amplifie l'opacité.",
        },
        {
          title: "Pression infrastructurelle",
          description:
            "Les projets d'énergie et de logistique exigent un alignement multi-acteurs avant le mouvement.",
        },
        {
          title: "Attentes de conformité",
          description:
            "Les institutions attendent de la traçabilité. Les canaux informels ne la fournissent pas de façon constante.",
        },
        {
          title: "Examen de l'investissement",
          description:
            "L'évaluation du capital exige des initiatives documentées — pas seulement un récit.",
        },
        {
          title: "Travail public–privé",
          description:
            "Une collaboration sérieuse exige des protocoles neutres, pas une facilitation discrétionnaire.",
        },
        {
          title: "Territoires africains et RDC",
          description:
            "La demande de coordination monte dans la logistique, l'industrie et les interfaces institutionnelles. Les arrangements informels ne se transforment pas en valeur durable.",
        },
      ],
    },
    currentLimits: {
      eyebrow: "Limites",
      title: "Les outils et les réseaux informels ne suffisent pas.",
      paragraphs: [
        "Un logiciel ponctuel et des comités ad hoc peuvent créer un alignement temporaire. Ils ne créent pas d'architectures auditables et finançables.",
        "La logistique est de la gouvernance, pas seulement du mouvement. Un capital sans structure amplifie la fragmentation.",
      ],
    },
    requiredCapabilities: {
      eyebrow: "Requis maintenant",
      title: "Ce que les organisations doivent pouvoir faire",
      description: "Des exigences système — pas un catalogue produit.",
      items: [
        "Documenter les initiatives pour que les institutions puissent les évaluer",
        "Coordonner les acteurs sans courtage informel",
        "Garder des limites informationnelles claires et non sensibles",
        "Soutenir le reporting sur tout le cycle de vie",
        "Intégrer la conformité dès le départ",
        "Fonder les décisions d'investissement sur la préparation structurelle",
      ],
    },
    handoff: {
      eyebrow: "Ensuite",
      title: "L'urgence n'est pas la différenciation.",
      paragraphs: [
        "Le problème et le moment sont clairs.",
        "Ensuite : pourquoi CLEVONES est différent — ce qu'il est, et ce qu'il n'est pas.",
      ],
    },
    cta: {
      title: "Voir ce qui distingue CLEVONES",
      description:
        "Lire la posture structurelle : coordination neutre, pas opération.",
      actions: [
        {
          href: "/positionnement",
          label: "Voir ce qui distingue CLEVONES",
        },
      ],
    },
  },
} as const satisfies LocalizedPageContent<WhyNowPageContent>;
