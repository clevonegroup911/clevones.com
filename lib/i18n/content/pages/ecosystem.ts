import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
  TitledDescription,
} from "./types";

export type EcosystemEntityContent = {
  name: string;
  domain: string;
  href: string;
  role: string;
  description: string;
  operational: boolean;
  central?: boolean;
};

export type PlatformFlowStep = {
  title: string;
  description: string;
};

export type EcosystemPageContent = {
  meta: PageMeta;
  breadcrumb: { home: string; current: string; navLabel: string };
  hero: HeroContent & {
    actions: readonly { href: string; label: string; variant?: "primary" | "secondary" | "outline" }[];
  };
  whyPlatform: SectionHeadingContent & {
    paragraphs: readonly string[];
    items: readonly TitledDescription[];
  };
  architecture: SectionHeadingContent & {
    steps: readonly PlatformFlowStep[];
  };
  layers: SectionHeadingContent & {
    items: readonly TitledDescription[];
  };
  modules: SectionHeadingContent & {
    communication: string;
    entities: readonly EcosystemEntityContent[];
    rosterEyebrow: string;
    rosterTitle: string;
    rosterDescription: string;
    centralBadge: string;
  };
  map: SectionHeadingContent;
  disclaimer: string;
  disclaimerEyebrow: string;
  decisionFlow: SectionHeadingContent & {
    paragraphs: readonly string[];
    items: readonly TitledDescription[];
    doctrineLink: { href: string; label: string };
  };
  cta: CtaContent;
};

/**
 * Platform page (PageKey `ecosystem`, URLs /ecosystem · /ecosysteme).
 * Explains how CLEVONES functions — model before technology.
 * Entity roster and mining separation: existing repository truth only.
 */
export const ecosystemPageContent = {
  en: {
    meta: {
      title: "Platform — How CLEVONES Works",
      description:
        "How CLEVONES functions as a neutral coordination layer: territory, actors, flows, data, coordination, decision, execution, and measurement — without operational substitution.",
    },
    breadcrumb: {
      home: "Home",
      current: "Platform",
      navLabel: "Breadcrumb",
    },
    hero: {
      eyebrow: "Platform",
      title: "One hub. Clear roles. Governed coordination.",
      subtitle:
        "CLEVONES connects territory, actors, flows, and decisions — before execution, without substituting operators.",
      tagline: "Model first. Coordination before improvisation.",
      actions: [
        {
          href: "#architecture",
          label: "See how the platform works",
        },
      ],
    },
    whyPlatform: {
      eyebrow: "Why a platform",
      title: "Isolated tools don't create governed coordination.",
      description:
        "When each function runs in a silo, no one shares rules, visibility, or a neutral place to structure decisions.",
      paragraphs: [
        "A logistics system, a spreadsheet, or a bilateral agreement can each be useful. Alone, they don't create institutional clarity.",
        "Without a coordination layer, actors duplicate effort, data stays fragmented, and serious counterparties can't evaluate what's proposed.",
      ],
      items: [
        {
          title: "Fragmented visibility",
          description: "Each tool holds a partial view. No shared picture of how actors, flows, and decisions connect.",
        },
        {
          title: "Informal decision paths",
          description: "When coordination happens outside documented frameworks, accountability depends on individuals.",
        },
        {
          title: "Execution without structure",
          description: "Launching operations before roles and compliance are defined amplifies risk instead of creating value.",
        },
      ],
    },
    architecture: {
      eyebrow: "Architecture",
      title: "From territory to measurable coordination",
      description: "One sequence. Technology serves it — it doesn't replace it.",
      steps: [
        {
          title: "Territory",
          description: "Read the institutional and economic context — before design or capital.",
        },
        {
          title: "Actors",
          description: "Identify legitimate institutions, enterprises, logistics actors, and strategic counterparts by role.",
        },
        {
          title: "Flows",
          description: "Map economic circulation, dependencies, and gaps as architecture — not operational plans.",
        },
        {
          title: "Platform",
          description: "CLEVONES provides the neutral hub where rules, documentation, and coordination align actors.",
        },
        {
          title: "Execution",
          description: "Operational delivery stays with specialized or field entities. The governance platform does not execute extraction.",
        },
        {
          title: "Evidence",
          description: "Reporting and documentation close the loop — making decisions auditable over time.",
        },
      ],
    },
    layers: {
      eyebrow: "Layers",
      title: "Five layers of the coordination model",
      description: "Each layer has one job. Together they form the platform.",
      items: [
        {
          title: "Territorial layer",
          description: "Context, constraints, and institutional setting — the foundation for every design choice.",
        },
        {
          title: "Coordination layer",
          description: "Neutral interfaces that align actors around documented objectives, roles, and protocols.",
        },
        {
          title: "Knowledge layer",
          description: "Structured information and educational capacity that support informed institutional decisions.",
        },
        {
          title: "Governance layer",
          description: "Roles, reporting lines, compliance checkpoints, and escalation paths.",
        },
        {
          title: "Execution layer",
          description: "Operational activity delivered by specialized or separated entities — never confused with governance.",
        },
      ],
    },
    modules: {
      eyebrow: "Modules",
      title: "Specialized entities connect through the hub",
      description: "Each entity has a defined mandate. Coordination passes through CLEVONES. Field operations stay separated.",
      communication:
        "Modules extend domain capacity — media and economic analysis, secure digital coordination, scientific knowledge, certified education, and (where applicable) separated operations — while governance stays central.",
      rosterEyebrow: "Entity roster",
      rosterTitle: "Each entity, a defined mandate",
      rosterDescription: "Specialized platforms serve distinct functions — coordinated through governance, never substituting it.",
      centralBadge: "Governance platform",
      entities: [
        {
          name: "Clevones",
          domain: "clevones.com",
          href: "https://clevones.com",
          role: "Governance of territorial economic flows",
          description:
            "The neutral platform for governance, coordination, compliance, and strategic reporting — architect of flows and integrator of the ecosystem.",
          operational: false,
          central: true,
        },
        {
          name: "Clevodia",
          domain: "clevones.media",
          href: "https://clevones.media",
          role: "Media and economic intelligence",
          description:
            "Economic analysis and strategic reporting on institutions, territories, and flows — extending the media and creative industries domain.",
          operational: false,
        },
        {
          name: "Clevonet",
          domain: "extranet.clevones.com",
          href: "https://extranet.clevones.com",
          role: "Extranet and secure infrastructure",
          description:
            "Secure access, collaboration workflows, reporting, document management, and sovereign digital coordination — the digital infrastructure layer.",
          operational: false,
        },
        {
          name: "Bicuni",
          domain: "bicuni.online",
          href: "https://bicuni.online",
          role: "Scientific digital library",
          description:
            "Digital archive for theses, dissertations, academic publications, and scientific knowledge — supporting education and capacity-building.",
          operational: false,
        },
        {
          name: "Btlearn Inc.",
          domain: "btlearn.org",
          href: "https://btlearn.org",
          role: "Certified education",
          description:
            "Certified training in languages, IT, business, leadership, cloud, and professional skills — strengthening human and institutional capacity.",
          operational: false,
        },
        {
          name: "Clevone Mining",
          domain: "mining.clevones.com",
          href: "https://mining.clevones.com",
          role: "Operational mining unit — extraction and transformation",
          description:
            "A distinct operational unit for responsible extraction, local transformation, and compliance. All field operations are conducted under Clevone Mining only — never under the Clevones governance platform.",
          operational: true,
        },
      ],
    },
    map: {
      eyebrow: "Hub topology",
      title: "Governance at the center, specialization at the perimeter",
      description: "Neutral platforms coordinate through Clevones. Field operations are structurally separated and clearly identified.",
    },
    disclaimerEyebrow: "Critical distinction",
    disclaimer: "Clevone Mining is operationally distinct from Clevones. Clevones remains a neutral governance and coordination platform.",
    decisionFlow: {
      eyebrow: "Governance of decisions",
      title: "How decisions circulate",
      description: "Decisions follow documented roles, reporting, and review — not informal discretion.",
      paragraphs: [
        "Reading and flow mapping inform governance design. Governance defines who decides, who reports, and how compliance is verified.",
        "Collaboration protocols align legitimate actors. Strategic reporting sustains accountability over time.",
      ],
      items: [
        {
          title: "Roles before action",
          description: "Responsibilities and escalation paths are defined before coordination opens.",
        },
        {
          title: "Documentation discipline",
          description: "Decisions and protocols are recorded in governed formats — not informal channels.",
        },
        {
          title: "Separation of execution",
          description: "Operational delivery stays with specialized or field entities. The hub preserves neutrality.",
        },
      ],
      doctrineLink: {
        href: "/governance",
        label: "Read the governance doctrine",
      },
    },
    cta: {
      title: "Review documented evidence",
      description: "Credibility rests on verifiable architecture, methodology, and documentation.",
      actions: [{ href: "/evidence", label: "Review documented evidence" }],
    },
  },
  fr: {
    meta: {
      title: "Plateforme — Comment fonctionne CLEVONES",
      description:
        "Comment CLEVONES fonctionne comme couche neutre de coordination : territoire, acteurs, flux, données, coordination, décision, exécution et mesure — sans substitution opérationnelle.",
    },
    breadcrumb: {
      home: "Accueil",
      current: "Plateforme",
      navLabel: "Fil d'Ariane",
    },
    hero: {
      eyebrow: "Plateforme",
      title: "Un hub. Des rôles clairs. Une coordination gouvernée.",
      subtitle:
        "CLEVONES relie territoire, acteurs, flux et décisions — avant l'exécution, sans se substituer aux opérateurs.",
      tagline: "Le modèle d'abord. La coordination avant l'improvisation.",
      actions: [
        {
          href: "#architecture",
          label: "Voir comment fonctionne la plateforme",
        },
      ],
    },
    whyPlatform: {
      eyebrow: "Pourquoi une plateforme",
      title: "Des outils isolés ne créent pas une coordination gouvernée.",
      description:
        "Lorsque chaque fonction opère en silo, personne ne partage les règles, la visibilité ou un lieu neutre pour structurer les décisions.",
      paragraphs: [
        "Un système logistique, un tableur ou un accord bilatéral peuvent chacun être utiles. Seuls, ils ne créent pas de clarté institutionnelle.",
        "Sans couche de coordination, les acteurs dupliquent les efforts, les données restent fragmentées et les contreparties sérieuses ne peuvent pas évaluer ce qui est proposé.",
      ],
      items: [
        {
          title: "Visibilité fragmentée",
          description: "Chaque outil détient une vue partielle. Aucune image partagée de la façon dont acteurs, flux et décisions se relient.",
        },
        {
          title: "Chemins de décision informels",
          description: "Lorsque la coordination se fait hors cadres documentés, la redevabilité dépend des personnes.",
        },
        {
          title: "Exécution sans structure",
          description: "Lancer des opérations avant que rôles et conformité soient définis amplifie le risque au lieu de créer de la valeur.",
        },
      ],
    },
    architecture: {
      eyebrow: "Architecture",
      title: "Du territoire à une coordination mesurable",
      description: "Une séquence unique. La technologie la sert — elle ne la remplace pas.",
      steps: [
        {
          title: "Territoire",
          description: "Lire le contexte institutionnel et économique — avant conception ou capital.",
        },
        {
          title: "Acteurs",
          description: "Identifier institutions, entreprises, acteurs logistiques et contreparties stratégiques légitimes par rôle.",
        },
        {
          title: "Flux",
          description: "Cartographier circulation économique, dépendances et lacunes comme architecture — non comme plans opérationnels.",
        },
        {
          title: "Plateforme",
          description: "CLEVONES fournit le hub neutre où règles, documentation et coordination alignent les acteurs.",
        },
        {
          title: "Exécution",
          description: "La livraison opérationnelle reste aux entités spécialisées ou de terrain. La plateforme de gouvernance n'exécute pas l'extraction.",
        },
        {
          title: "Preuves",
          description: "Reporting et documentation ferment la boucle — rendant les décisions auditables dans le temps.",
        },
      ],
    },
    layers: {
      eyebrow: "Couches",
      title: "Cinq couches du modèle de coordination",
      description: "Chaque couche a une fonction. Ensemble, elles forment la plateforme.",
      items: [
        {
          title: "Couche territoriale",
          description: "Contexte, contraintes et cadre institutionnel — fondation de tout choix de conception.",
        },
        {
          title: "Couche de coordination",
          description: "Interfaces neutres qui alignent les acteurs autour d'objectifs, de rôles et de protocoles documentés.",
        },
        {
          title: "Couche de connaissance",
          description: "Informations structurées et capacités éducatives au service de décisions institutionnelles éclairées.",
        },
        {
          title: "Couche de gouvernance",
          description: "Rôles, lignes de reporting, points de conformité et voies d'escalade.",
        },
        {
          title: "Couche d'exécution",
          description: "Activité opérationnelle délivrée par des entités spécialisées ou séparées — jamais confondue avec la gouvernance.",
        },
      ],
    },
    modules: {
      eyebrow: "Modules",
      title: "Les entités spécialisées se connectent via le hub",
      description: "Chaque entité a un mandat défini. La coordination passe par CLEVONES. Les opérations de terrain restent séparées.",
      communication:
        "Les modules étendent les capacités de domaine — médias et analyse économique, coordination numérique sécurisée, savoir scientifique, éducation certifiante et (le cas échéant) opérations séparées — tandis que la gouvernance reste centrale.",
      rosterEyebrow: "Registre des entités",
      rosterTitle: "Chaque entité, un mandat défini",
      rosterDescription: "Des plateformes spécialisées servent des fonctions distinctes — coordonnées par la gouvernance, jamais en la substituant.",
      centralBadge: "Plateforme de gouvernance",
      entities: [
        {
          name: "Clevones",
          domain: "clevones.com",
          href: "https://clevones.com",
          role: "Gouvernance des flux économiques territoriaux",
          description:
            "La plateforme neutre de gouvernance, coordination, conformité et reporting stratégique — architecte des flux et intégrateur de l'écosystème.",
          operational: false,
          central: true,
        },
        {
          name: "Clevodia",
          domain: "clevones.media",
          href: "https://clevones.media",
          role: "Médias et intelligence économique",
          description:
            "Analyse économique et reporting stratégique sur institutions, territoires et flux — prolongeant le domaine des médias et des industries créatives.",
          operational: false,
        },
        {
          name: "Clevonet",
          domain: "extranet.clevones.com",
          href: "https://extranet.clevones.com",
          role: "Extranet et infrastructure sécurisée",
          description:
            "Accès sécurisé, flux de travail collaboratifs, reporting, gestion documentaire et coordination numérique souveraine — la couche d'infrastructure numérique.",
          operational: false,
        },
        {
          name: "Bicuni",
          domain: "bicuni.online",
          href: "https://bicuni.online",
          role: "Bibliothèque numérique scientifique",
          description:
            "Archive numérique de thèses, mémoires, publications académiques et savoirs scientifiques — au service de l'éducation et du renforcement des capacités.",
          operational: false,
        },
        {
          name: "Btlearn Inc.",
          domain: "btlearn.org",
          href: "https://btlearn.org",
          role: "Formation certifiante",
          description:
            "Formations certifiantes en langues, informatique, gestion, leadership, cloud et compétences professionnelles — renforçant les capacités humaines et institutionnelles.",
          operational: false,
        },
        {
          name: "Clevone Mining",
          domain: "mining.clevones.com",
          href: "https://mining.clevones.com",
          role: "Unité minière opérationnelle — extraction et transformation",
          description:
            "Une unité opérationnelle distincte consacrée à l'extraction responsable, à la transformation locale et à la conformité. Toutes les opérations de terrain sont conduites exclusivement par Clevone Mining — jamais par la plateforme de gouvernance Clevones.",
          operational: true,
        },
      ],
    },
    map: {
      eyebrow: "Topologie du hub",
      title: "La gouvernance au centre, la spécialisation en périphérie",
      description: "Les plateformes neutres se coordonnent par Clevones. Les opérations de terrain sont structurellement séparées et clairement identifiées.",
    },
    disclaimerEyebrow: "Distinction critique",
    disclaimer: "Clevone Mining est opérationnellement distincte de Clevones. Clevones demeure une plateforme neutre de gouvernance et de coordination.",
    decisionFlow: {
      eyebrow: "Gouvernance des décisions",
      title: "Comment circulent les décisions",
      description: "Les décisions suivent des rôles, un reporting et un examen documentés — non une discrétion informelle.",
      paragraphs: [
        "La lecture et la cartographie des flux informent la conception de la gouvernance. Celle-ci définit qui décide, qui rend compte et comment la conformité est vérifiée.",
        "Les protocoles de collaboration alignent les acteurs légitimes. Le reporting stratégique soutient la redevabilité dans le temps.",
      ],
      items: [
        {
          title: "Les rôles avant l'action",
          description: "Responsabilités et voies d'escalade sont définies avant l'ouverture de la coordination.",
        },
        {
          title: "Discipline documentaire",
          description: "Décisions et protocoles sont consignés dans des formats gouvernés — non dans des canaux informels.",
        },
        {
          title: "Séparation de l'exécution",
          description: "La livraison opérationnelle reste aux entités spécialisées ou de terrain. Le hub préserve la neutralité.",
        },
      ],
      doctrineLink: {
        href: "/gouvernance",
        label: "Lire la doctrine de gouvernance",
      },
    },
    cta: {
      title: "Consulter les preuves documentées",
      description: "La crédibilité repose sur une architecture, une méthodologie et une documentation vérifiables.",
      actions: [{ href: "/preuves", label: "Consulter les preuves documentées" }],
    },
  },
} as const satisfies LocalizedPageContent<EcosystemPageContent>;
