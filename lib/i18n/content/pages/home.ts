import {
  clevoneMiningSeparationDisclaimer,
  clevoneMiningSeparationDisclaimerFr,
} from "@/lib/constants/brand-positioning";
import { interventionDomains } from "@/lib/constants/corporate-purpose";
import { insightsPageContent } from "@/lib/i18n/content/pages/insights";
import {
  positionnementIs,
  positionnementIsNot,
} from "@/lib/positionnement-page";

export type HomePageContent = {
  hero: {
    eyebrow: string;
    badge: string;
    title: string;
    subtitle: string;
    valueProposition: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    benefits: readonly { title: string; description: string }[];
    proofs: {
      label: string;
      items: readonly {
        name: string;
        detail: string;
        operational?: boolean;
      }[];
    };
    trustLine: string;
  };
  positioning: {
    eyebrow: string;
    title: string;
    description: string;
    isLabel: string;
    isNotLabel: string;
    is: readonly string[];
    isNot: readonly string[];
  };
  structuralProblem: {
    eyebrow: string;
    title: string;
    /** Central idea only — detail lives on Challenge. */
    description: string;
    /** Single consequence line. */
    consequence: string;
    cta: { label: string; href: string };
    /**
     * Deferred factors (Mission #002.5) — no longer rendered on Home.
     * Full fragmentation narrative: Challenge page.
     */
    factors: readonly string[];
  };
  domains: {
    eyebrow: string;
    title: string;
    description: string;
    items: readonly {
      id: string;
      title: string;
      description: string;
      ecosystemLink?: string;
    }[];
    href: string;
    linkLabel: string;
  };
  methodology: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    linkLabel: string;
    steps: readonly {
      number: string;
      title: string;
      description: string;
    }[];
  };
  pillars: {
    eyebrow: string;
    title: string;
    description: string;
    items: readonly { title: string; description: string }[];
  };
  ecosystem: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    linkLabel: string;
    operationalBadge: string;
    entities: readonly {
      name: string;
      role: string;
      description: string;
      href: string;
      operational: boolean;
      internal?: boolean;
    }[];
    miningDisclaimer: string;
  };
  featuredSolution: {
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
  filters: {
    eyebrow: string;
    title: string;
    description: string;
    items: readonly { title: string; description: string }[];
  };
  insights: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    linkLabel: string;
    articles: readonly {
      slug: string;
      category: string;
      title: string;
      abstract: string;
      readingTime: string;
    }[];
  };
  /** Condensed bridge to Positioning — not a full Positioning duplicate. */
  whyClevones: {
    eyebrow: string;
    title: string;
    description: string;
    principles: readonly { title: string; description: string }[];
    cta: { label: string; href: string };
  };
  finalCta: {
    title: string;
    collaboration: { label: string; href: string };
    initiative: { label: string; href: string };
  };
  meta: { title: string; description: string };
};

const enDomains = interventionDomains.slice(0, 6).map(
  ({ id, title, architectureRole, ecosystemLink }) => ({
    id,
    title,
    description: architectureRole,
    ecosystemLink,
  }),
);

const frDomains = interventionDomains.slice(0, 6).map(
  ({ id, titleFr, architectureRoleFr, ecosystemLink }) => ({
    id,
    title: titleFr,
    description: architectureRoleFr,
    ecosystemLink,
  }),
);

const enEcosystemEntities = [
  {
    name: "CLEVONE Technologies",
    role: "Technology and digital transformation",
    description:
      "The technology line of the CLEVONE SARL ecosystem — software, digital platforms, and IT services that support business and institutional systems.",
    href: "/solutions",
    operational: false,
    internal: true,
  },
  {
    name: "CLEVONE DMS",
    role: "Digital Management System",
    description:
      "Commercial software for modern businesses: sales, customers, inventory, invoices, dashboards, reports, and governed access. Capabilities follow the product roadmap.",
    href: "/solutions/clevone-dms",
    operational: false,
    internal: true,
  },
  {
    name: "CLEVODIA",
    role: "Media + AI economic intelligence",
    description:
      "CLEVODIA produces economic intelligence, strategic analysis, and AI-assisted insights on institutions, territories, and flows — extending the media and creative industries domain.",
    href: "https://clevones.media",
    operational: false,
  },
  {
    name: "CLEVONET",
    role: "Extranet + secure infrastructure",
    description:
      "CLEVONET provides secure access, collaboration workflows, reporting, document management, and sovereign digital coordination — the technology and digital infrastructure layer of the ecosystem.",
    href: "https://extranet.clevones.com",
    operational: false,
  },
  {
    name: "BICUNI",
    role: "Scientific digital library",
    description:
      "BICUNI is a digital archive for theses, dissertations, academic publications, and scientific knowledge — supporting education and capacity-building infrastructures.",
    href: "https://bicuni.online",
    operational: false,
  },
  {
    name: "Btlearn",
    role: "Certified education",
    description:
      "Btlearn provides certified training in languages, IT, business, leadership, cloud, AI, and professional skills — strengthening human and institutional capacity.",
    href: "https://btlearn.org",
    operational: false,
  },
  {
    name: "Clevone Mining",
    role: "Operational mining unit — extraction and transformation",
    description:
      "Clevone Mining is a distinct operational unit for responsible extraction, local transformation, and compliance within the productive industries domain. All field operations are conducted under Clevone Mining only — never under the Clevones governance platform.",
    href: "https://mining.clevones.com",
    operational: true,
  },
] as const;

const frEcosystemEntities = [
  {
    name: "CLEVONE Technologies",
    role: "Technologies et transformation numérique",
    description:
      "La ligne technologique de l'écosystème CLEVONE SARL — logiciels, plateformes numériques et services informatiques au service des systèmes d'entreprise et institutionnels.",
    href: "/domaines",
    operational: false,
    internal: true,
  },
  {
    name: "CLEVONE DMS",
    role: "Progiciel de gestion numérique",
    description:
      "Progiciel commercial pour les entreprises modernes : ventes, clients, stocks, factures, tableaux de bord, rapports et accès gouvernés. Les capacités suivent la feuille de route produit.",
    href: "/domaines/clevone-dms",
    operational: false,
    internal: true,
  },
  {
    name: "CLEVODIA",
    role: "Médias et intelligence économique augmentée par l'IA",
    description:
      "CLEVODIA produit de l'intelligence économique, des analyses stratégiques et des éclairages assistés par l'IA sur les institutions, les territoires et les flux, prolongeant le champ des médias et des industries créatives.",
    href: "https://clevones.media",
    operational: false,
  },
  {
    name: "CLEVONET",
    role: "Extranet et infrastructure sécurisée",
    description:
      "CLEVONET fournit des accès sécurisés, des flux de collaboration, du reporting, de la gestion documentaire et une coordination numérique souveraine : la couche technologique et d'infrastructure numérique de l'écosystème.",
    href: "https://extranet.clevones.com",
    operational: false,
  },
  {
    name: "BICUNI",
    role: "Bibliothèque numérique scientifique",
    description:
      "BICUNI est une archive numérique de thèses, mémoires, publications académiques et savoirs scientifiques, au service des infrastructures d'éducation et de renforcement des capacités.",
    href: "https://bicuni.online",
    operational: false,
  },
  {
    name: "Btlearn",
    role: "Formation certifiante",
    description:
      "Btlearn propose des formations certifiantes en langues, informatique, affaires, leadership, cloud, IA et compétences professionnelles, renforçant les capacités humaines et institutionnelles.",
    href: "https://btlearn.org",
    operational: false,
  },
  {
    name: "Clevone Mining",
    role: "Unité minière opérationnelle — extraction et transformation",
    description:
      "Clevone Mining est une unité opérationnelle distincte dédiée à l'extraction responsable, à la transformation locale et à la conformité dans le domaine des industries productives. Toutes les opérations de terrain sont conduites exclusivement sous Clevone Mining, jamais sous la plateforme de gouvernance Clevones.",
    href: "https://mining.clevones.com",
    operational: true,
  },
] as const;

export const homePageContent: { en: HomePageContent; fr: HomePageContent } = {
  en: {
    hero: {
      eyebrow: "CLEVONE SARL",
      badge: "DRC & Africa",
      title: "Building digital, commercial and institutional infrastructure for Africa.",
      subtitle:
        "Technology • Business Software • Logistics • Industry • Energy • Media • Education • Advisory",
      valueProposition:
        "Strategic vision: Governance Architecture for Territorial Economic Flows.",
      primaryCta: { label: "Explore CLEVONE", href: "/about" },
      secondaryCta: {
        label: "Our Solutions",
        href: "/solutions",
      },
      benefits: [
        {
          title: "Digital platforms",
          description:
            "Software and digital systems that make businesses and institutions operable.",
        },
        {
          title: "Commercial infrastructure",
          description:
            "Business software, trade, logistics, and distribution capacity.",
        },
        {
          title: "Institutional architecture",
          description:
            "Frameworks that make territorial economic flows readable and durable.",
        },
        {
          title: "Built in Africa",
          description:
            "A Congolese company, based in Kisangani, serving the DRC and Africa.",
        },
      ],
      proofs: {
        label: "Across the CLEVONES ecosystem",
        items: [
          { name: "CLEVONE DMS", detail: "Business software" },
          { name: "CLEVONET", detail: "Digital infrastructure" },
          { name: "CLEVODIA", detail: "Economic intelligence" },
          { name: "BICUNI", detail: "Scientific knowledge" },
          { name: "Btlearn", detail: "Certified education" },
          {
            name: "Clevone Mining",
            detail: "Distinct operational entity",
            operational: true,
          },
        ],
      },
      trustLine: "Kisangani · Democratic Republic of the Congo",
    },
    positioning: {
      eyebrow: "Positioning",
      title: "What Clevones is — and is not",
      description:
        "Clevones exercises a role of architecture, structuring, and coordination for territorial economic flows — as platform of coordination and ecosystem integrator. The governance platform never intervenes as a direct operator.",
      isLabel: "Clevones is",
      isNotLabel: "Clevones is not",
      is: [
        "Architect of flows",
        "Territorial structurer",
        "Coordination platform",
        "Neutral governance layer",
        "Ecosystem integrator",
        "Strategic reporting interface",
      ],
      isNot: [
        "Operator",
        "Trader",
        "Resource exploiter",
        "Direct intermediary",
        "Informal broker",
        "Generic services vendor",
      ],
    },
    structuralProblem: {
      eyebrow: "Next",
      title: "Potential without coordination rarely becomes durable value.",
      description:
        "When actors, information, and responsibilities stay fragmented, initiatives stay hard to trust and hard to fund.",
      consequence:
        "The next pages explain the problem, the timing, and why CLEVONES is built differently.",
      cta: {
        label: "Explore the challenge",
        href: "/challenge",
      },
      factors: [
        "Fragmented actors operating without shared governance frameworks",
        "Weak documentation undermining institutional credibility and traceability",
        "Informal coordination producing fragile, non-repeatable outcomes",
        "Late compliance exposing initiatives to regulatory and reputational risk",
        "Absence of reporting discipline preventing strategic accountability",
      ],
    },
    domains: {
      eyebrow: "Fields of intervention",
      title: "Territorial architectures across strategic domains",
      description:
        "Clevones' corporate purpose defines where architectures of economic flows may be designed and coordinated — through the governance platform, specialized ecosystem entities, and subsidiaries when required. Domains expand capacity; they do not redefine Clevones as a multi-service operator.",
      items: enDomains,
      href: "/solutions",
      linkLabel: "View all domains of intervention",
    },
    methodology: {
      eyebrow: "Methodology",
      title: "A disciplined approach to territorial governance",
      description:
        "Five sequential phases structure every engagement — from territorial reading to strategic reporting.",
      href: "/methodology",
      linkLabel: "View full methodology →",
      steps: [
        {
          number: "01",
          title: "Territorial Reading",
          description:
            "Systematic assessment of territorial economic dynamics, actors, and structural constraints.",
        },
        {
          number: "02",
          title: "Flow Mapping",
          description:
            "Documentation of economic circulation patterns, dependencies, and coordination gaps.",
        },
        {
          number: "03",
          title: "Governance Structuring",
          description:
            "Design of governance frameworks aligned with institutional requirements and territorial realities.",
        },
        {
          number: "04",
          title: "Collaboration Framework",
          description:
            "Establishment of neutral coordination protocols between legitimate institutional and economic actors.",
        },
        {
          number: "05",
          title: "Strategic Reporting",
          description:
            "Disciplined reporting architecture for transparency, accountability, and institutional credibility.",
        },
      ],
    },
    pillars: {
      eyebrow: "Strategic pillars",
      title: "Foundations of institutional intervention",
      description:
        "Six principles govern every dimension of Clevones' territorial governance architecture.",
      items: [
        {
          title: "Governance",
          description:
            "Structured frameworks for decision-making, accountability, and territorial economic discipline.",
        },
        {
          title: "Neutrality",
          description:
            "Independent positioning without operational bias, commercial interest, or actor substitution.",
        },
        {
          title: "Compliance",
          description:
            "Adherence to applicable regulatory and institutional standards across all coordination activities.",
        },
        {
          title: "Territorial Intelligence",
          description:
            "Deep reading of local economic realities to inform governance architecture and strategic alignment.",
        },
        {
          title: "Strategic Coordination",
          description:
            "Alignment of legitimate actors around shared territorial objectives without direct intermediation.",
        },
        {
          title: "Institutional Credibility",
          description:
            "Documentation, reporting discipline, and transparent interfaces that sustain long-term trust.",
        },
      ],
    },
    ecosystem: {
      eyebrow: "Ecosystem",
      title: "A structured institutional ecosystem",
      description:
        "CLEVONE SARL sits within a broader architecture of complementary lines — technology, software, media, knowledge, and education — each with a defined role.",
      href: "/ecosystem",
      linkLabel: "Explore ecosystem →",
      operationalBadge: "Operational unit",
      entities: enEcosystemEntities,
      miningDisclaimer: clevoneMiningSeparationDisclaimer,
    },
    featuredSolution: {
      eyebrow: "Business software",
      name: "CLEVONE DMS",
      type: "Commercial software / Digital Management System",
      positioning: "Digital Management System for modern businesses",
      description:
        "A Digital Management System for sales, customers, inventory, suppliers, expenses, revenue, invoices, documents, dashboards, reports, users & permissions, and cloud synchronization.",
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
      note: "Capabilities describe the product architecture and roadmap. This website does not expose a live application backend.",
      href: "/solutions/clevone-dms",
      cta: "Explore CLEVONE DMS",
    },
    filters: {
      eyebrow: "Engagement criteria",
      title: "Clevones is not designed for every actor.",
      description:
        "Engagement follows a deliberate filtering process. Only actors meeting institutional criteria proceed to structured coordination.",
      items: [
        {
          title: "Legitimacy",
          description:
            "Recognized institutional standing, legal foundation, and verifiable operational identity.",
        },
        {
          title: "Strategic relevance",
          description:
            "Alignment with territorial economic governance objectives and long-horizon structural value.",
        },
        {
          title: "Compliance readiness",
          description:
            "Capacity and willingness to operate within documented regulatory and institutional frameworks.",
        },
        {
          title: "Institutional compatibility",
          description:
            "Fit with neutral governance protocols and non-operational coordination requirements.",
        },
        {
          title: "Coordination maturity",
          description:
            "Demonstrated ability to engage in structured, documented multi-actor collaboration.",
        },
        {
          title: "Long-term value",
          description:
            "Commitment to sustained territorial impact beyond short-cycle opportunistic engagement.",
        },
      ],
    },
    insights: {
      eyebrow: "Insights",
      title: "Perspectives on territorial governance",
      description:
        "Analysis on the structural conditions required for durable territorial economic value.",
      href: "/insights",
      linkLabel: "View all insights →",
      articles: insightsPageContent.en.articles.slice(0, 3),
    },
    whyClevones: {
      eyebrow: "Why Clevones",
      title: "A neutral layer for territorial economic coordination.",
      description:
        "Clevones exercises a role of architecture, structuring, and coordination for territorial economic flows — as platform of coordination and ecosystem integrator. The governance platform never intervenes as a direct operator.",
      principles: [
        {
          title: "Governance",
          description:
            "Structured frameworks for decision-making, accountability, and territorial economic discipline.",
        },
        {
          title: "Neutrality",
          description:
            "Independent positioning without operational bias, commercial interest, or actor substitution.",
        },
        {
          title: "Institutional Credibility",
          description:
            "Documentation, reporting discipline, and transparent interfaces that sustain long-term trust.",
        },
      ],
      cta: {
        label: "Explore the challenge",
        href: "/challenge",
      },
    },
    finalCta: {
      title: "Ready to discuss a structured initiative?",
      collaboration: {
        label: "Start a strategic conversation",
        href: "/contact",
      },
      initiative: {
        label: "Explore the challenge",
        href: "/challenge",
      },
    },
    meta: {
      title: "CLEVONES | Technology, Business & Digital Infrastructure",
      description:
        "CLEVONE SARL is a Congolese technology and business company building digital platforms, commercial software, logistics, media, education and institutional solutions.",
    },
  },
  fr: {
    hero: {
      eyebrow: "CLEVONE SARL",
      badge: "RDC et Afrique",
      title:
        "Construire les infrastructures numériques, commerciales et institutionnelles de l'Afrique.",
      subtitle:
        "Technologie • Logiciels de gestion • Logistique • Industrie • Énergie • Médias • Éducation • Conseil",
      valueProposition:
        "Vision : Architecture de gouvernance des flux économiques territoriaux.",
      primaryCta: {
        label: "Découvrir CLEVONE",
        href: "/mission",
      },
      secondaryCta: {
        label: "Nos solutions",
        href: "/domaines",
      },
      benefits: [
        {
          title: "Plateformes numériques",
          description:
            "Logiciels et systèmes numériques qui rendent entreprises et institutions opérables.",
        },
        {
          title: "Infrastructure commerciale",
          description:
            "Progiciels, commerce, logistique et capacité de distribution.",
        },
        {
          title: "Architecture institutionnelle",
          description:
            "Des cadres qui rendent les flux économiques territoriaux lisibles et durables.",
        },
        {
          title: "Ancrée en Afrique",
          description:
            "Une société congolaise, basée à Kisangani, au service de la RDC et de l'Afrique.",
        },
      ],
      proofs: {
        label: "Au sein de l'écosystème CLEVONES",
        items: [
          { name: "CLEVONE DMS", detail: "Progiciel" },
          { name: "CLEVONET", detail: "Infrastructure numérique" },
          { name: "CLEVODIA", detail: "Intelligence économique" },
          { name: "BICUNI", detail: "Savoir scientifique" },
          { name: "Btlearn", detail: "Formation certifiante" },
          {
            name: "Clevone Mining",
            detail: "Entité opérationnelle distincte",
            operational: true,
          },
        ],
      },
      trustLine: "Kisangani · République Démocratique du Congo",
    },
    positioning: {
      eyebrow: "Positionnement",
      title: "Ce qu'est Clevones — et ce qu'elle n'est pas",
      description:
        "Clevones exerce un rôle d'architecture, de structuration et de coordination des flux économiques territoriaux, en tant que plateforme de coordination et intégrateur d'écosystèmes. La plateforme de gouvernance n'intervient jamais comme opérateur direct.",
      isLabel: "Clevones est",
      isNotLabel: "Clevones n'est pas",
      is: positionnementIs,
      isNot: positionnementIsNot,
    },
    structuralProblem: {
      eyebrow: "Ensuite",
      title:
        "Un potentiel sans coordination devient rarement une valeur durable.",
      description:
        "Quand les acteurs, l'information et les responsabilités restent fragmentés, les initiatives restent difficiles à faire confiance et à financer.",
      consequence:
        "Les pages suivantes expliquent le problème, le moment, et pourquoi CLEVONES est construit autrement.",
      cta: {
        label: "Comprendre le défi",
        href: "/defi",
      },
      factors: [
        "Des acteurs fragmentés, opérant sans cadres de gouvernance partagés",
        "Une documentation insuffisante qui fragilise la crédibilité institutionnelle et la traçabilité",
        "Une coordination informelle produisant des résultats fragiles et difficilement reproductibles",
        "Une conformité tardive qui expose les initiatives à des risques réglementaires et réputationnels",
        "L'absence de discipline de reporting qui empêche une redevabilité stratégique",
      ],
    },
    domains: {
      eyebrow: "Champs d'intervention",
      title: "Des architectures territoriales dans des domaines stratégiques",
      description:
        "L'objet social de Clevones définit les domaines dans lesquels des architectures de flux économiques peuvent être conçues et coordonnées, par la plateforme de gouvernance, les entités spécialisées de l'écosystème et, lorsque nécessaire, les filiales. Ces domaines élargissent la capacité ; ils ne redéfinissent pas Clevones comme un opérateur multiservices.",
      items: frDomains,
      href: "/domaines",
      linkLabel: "Voir tous les champs d'intervention",
    },
    methodology: {
      eyebrow: "Méthodologie",
      title: "Une approche rigoureuse de la gouvernance territoriale",
      description:
        "Cinq phases séquentielles structurent chaque engagement, de la lecture territoriale au reporting stratégique.",
      href: "/methodologie",
      linkLabel: "Voir la méthodologie complète →",
      steps: [
        {
          number: "01",
          title: "Lecture territoriale",
          description:
            "Analyse systématique des dynamiques économiques territoriales, des acteurs et des contraintes structurelles.",
        },
        {
          number: "02",
          title: "Cartographie des flux",
          description:
            "Documentation des schémas de circulation économique, des dépendances et des lacunes de coordination.",
        },
        {
          number: "03",
          title: "Structuration de la gouvernance",
          description:
            "Conception de cadres de gouvernance alignés sur les exigences institutionnelles et les réalités territoriales.",
        },
        {
          number: "04",
          title: "Cadre de collaboration",
          description:
            "Mise en place de protocoles de coordination neutres entre les acteurs institutionnels et économiques légitimes.",
        },
        {
          number: "05",
          title: "Reporting stratégique",
          description:
            "Architecture de reporting rigoureuse au service de la transparence, de la redevabilité et de la crédibilité institutionnelle.",
        },
      ],
    },
    pillars: {
      eyebrow: "Piliers stratégiques",
      title: "Fondements de l'intervention institutionnelle",
      description:
        "Six principes gouvernent chaque dimension de l'architecture de gouvernance territoriale de Clevones.",
      items: [
        {
          title: "Gouvernance",
          description:
            "Des cadres structurés pour la décision, la redevabilité et la discipline économique territoriale.",
        },
        {
          title: "Neutralité",
          description:
            "Un positionnement indépendant, sans biais opérationnel, intérêt commercial ni substitution aux acteurs.",
        },
        {
          title: "Conformité",
          description:
            "Le respect des normes réglementaires et institutionnelles applicables dans l'ensemble des activités de coordination.",
        },
        {
          title: "Intelligence territoriale",
          description:
            "Une lecture approfondie des réalités économiques locales pour éclairer l'architecture de gouvernance et l'alignement stratégique.",
        },
        {
          title: "Coordination stratégique",
          description:
            "L'alignement des acteurs légitimes autour d'objectifs territoriaux partagés, sans intermédiation directe.",
        },
        {
          title: "Crédibilité institutionnelle",
          description:
            "Une documentation, une discipline de reporting et des interfaces transparentes qui soutiennent la confiance à long terme.",
        },
      ],
    },
    ecosystem: {
      eyebrow: "Écosystème",
      title: "Un écosystème institutionnel structuré",
      description:
        "CLEVONE SARL s'inscrit dans une architecture plus large de lignes complémentaires — technologies, progiciels, médias, savoir et éducation — chacune dotée d'un rôle défini.",
      href: "/ecosysteme",
      linkLabel: "Explorer l'écosystème →",
      operationalBadge: "Unité opérationnelle",
      entities: frEcosystemEntities,
      miningDisclaimer: clevoneMiningSeparationDisclaimerFr,
    },
    featuredSolution: {
      eyebrow: "Progiciel",
      name: "CLEVONE DMS",
      type: "Progiciel de gestion numérique",
      positioning: "Progiciel de gestion numérique pour les entreprises modernes",
      description:
        "Un progiciel de gestion numérique pour les ventes, les clients, les stocks, les fournisseurs, les dépenses, les recettes, les factures, les documents, les tableaux de bord, les rapports, les utilisateurs et permissions, et la synchronisation cloud.",
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
      note: "Les capacités décrivent l'architecture produit et la feuille de route. Ce site n'expose aucun backend applicatif en ligne.",
      href: "/domaines/clevone-dms",
      cta: "Découvrir CLEVONE DMS",
    },
    filters: {
      eyebrow: "Critères d'engagement",
      title: "Clevones n'est pas conçue pour tous les acteurs.",
      description:
        "L'engagement suit un processus de sélection délibéré. Seuls les acteurs répondant aux critères institutionnels accèdent à une coordination structurée.",
      items: [
        {
          title: "Légitimité",
          description:
            "Une assise institutionnelle reconnue, une base juridique et une identité opérationnelle vérifiable.",
        },
        {
          title: "Pertinence stratégique",
          description:
            "Un alignement avec les objectifs de gouvernance économique territoriale et une valeur structurelle de long terme.",
        },
        {
          title: "Préparation à la conformité",
          description:
            "La capacité et la volonté d'opérer dans des cadres réglementaires et institutionnels documentés.",
        },
        {
          title: "Compatibilité institutionnelle",
          description:
            "Une adéquation avec les protocoles de gouvernance neutre et les exigences de coordination non opérationnelle.",
        },
        {
          title: "Maturité de coordination",
          description:
            "Une capacité démontrée à prendre part à une collaboration multi-acteurs structurée et documentée.",
        },
        {
          title: "Valeur de long terme",
          description:
            "Un engagement en faveur d'un impact territorial durable, au-delà des opportunités de court cycle.",
        },
      ],
    },
    insights: {
      eyebrow: "Analyses",
      title: "Perspectives sur la gouvernance territoriale",
      description:
        "Des analyses sur les conditions structurelles nécessaires à la création d'une valeur économique territoriale durable.",
      href: "/analyses",
      linkLabel: "Voir toutes les analyses →",
      articles: [
        {
          slug: "governance-before-capital",
          category: "Gouvernance économique",
          title:
            "Pourquoi le potentiel territorial exige une gouvernance avant le capital",
          abstract:
            "Le capital déployé sans architecture de gouvernance territoriale amplifie la fragmentation plutôt que la valeur. Cette note examine pourquoi la structuration doit précéder le financement dans les systèmes économiques africains.",
          readingTime: "6 min de lecture",
        },
        {
          slug: "informal-coordination-cost",
          category: "Conformité",
          title:
            "Le coût caché de la coordination informelle dans les systèmes économiques africains",
          abstract:
            "Les réseaux d'acteurs informels produisent un alignement de court terme et une opacité institutionnelle durable. Leur coût cumulé, en exposition à la non-conformité, en défaillances d'audit et en hésitation des capitaux, est systématiquement sous-estimé.",
          readingTime: "7 min de lecture",
        },
        {
          slug: "institutionally-legible-initiative",
          category: "Structuration des flux",
          title:
            "De l'opportunité à l'initiative institutionnellement lisible",
          abstract:
            "Identifier une opportunité ne suffit pas à former une initiative. La lisibilité exige une cartographie documentée des acteurs, des protocoles de gouvernance et des structures prêtes pour la conformité, que les institutions et les investisseurs peuvent évaluer.",
          readingTime: "5 min de lecture",
        },
      ],
    },
    whyClevones: {
      eyebrow: "Pourquoi Clevones",
      title: "Une couche neutre pour la coordination économique territoriale.",
      description:
        "Clevones exerce un rôle d'architecture, de structuration et de coordination des flux économiques territoriaux, en tant que plateforme de coordination et intégrateur d'écosystèmes. La plateforme de gouvernance n'intervient jamais comme opérateur direct.",
      principles: [
        {
          title: "Gouvernance",
          description:
            "Des cadres structurés pour la décision, la redevabilité et la discipline économique territoriale.",
        },
        {
          title: "Neutralité",
          description:
            "Un positionnement indépendant, sans biais opérationnel, intérêt commercial ni substitution aux acteurs.",
        },
        {
          title: "Crédibilité institutionnelle",
          description:
            "Une documentation, une discipline de reporting et des interfaces transparentes qui soutiennent la confiance à long terme.",
        },
      ],
      cta: {
        label: "Comprendre le défi",
        href: "/defi",
      },
    },
    finalCta: {
      title: "Prêt à discuter d'une initiative structurée ?",
      collaboration: {
        label: "Commencer une conversation stratégique",
        href: "/collaboration",
      },
      initiative: {
        label: "Comprendre le défi",
        href: "/defi",
      },
    },
    meta: {
      title: "CLEVONES | Technologie, Business & Infrastructure Numérique",
      description:
        "CLEVONE SARL est une entreprise congolaise développant des plateformes numériques, des logiciels de gestion, des solutions logistiques, médiatiques, éducatives et institutionnelles.",
    },
  },
};
