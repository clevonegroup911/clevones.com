import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
  TitledDescription,
} from "./types";

export type EvidenceLinkItem = {
  title: string;
  description: string;
  href: string;
  label: string;
};

export type EvidencePageContent = {
  meta: PageMeta;
  breadcrumb: { home: string; current: string; navLabel: string };
  hero: HeroContent & {
    actions: readonly {
      href: string;
      label: string;
      variant?: "primary" | "secondary" | "outline";
    }[];
  };
  methodology: SectionHeadingContent & {
    paragraphs: readonly string[];
    link: { href: string; label: string };
  };
  architecture: SectionHeadingContent & {
    paragraphs: readonly string[];
    link: { href: string; label: string };
  };
  documentation: SectionHeadingContent & {
    paragraphs: readonly string[];
    items: readonly EvidenceLinkItem[];
  };
  transparency: SectionHeadingContent & {
    paragraphs: readonly string[];
    items: readonly TitledDescription[];
  };
  standards: SectionHeadingContent & {
    items: readonly TitledDescription[];
    link: { href: string; label: string };
  };
  quality: SectionHeadingContent & {
    items: readonly TitledDescription[];
  };
  roadmap: SectionHeadingContent & {
    paragraphs: readonly string[];
    items: readonly TitledDescription[];
  };
  cta: CtaContent;
};

/**
 * Evidence page — system credibility from repository-demonstrable artefacts only.
 * No clients, awards, ratings, growth metrics, or success stories.
 */
export const evidencePageContent = {
  en: {
    meta: {
      title: "Evidence — Documentation and System Credibility",
      description:
        "Why decision-makers can evaluate CLEVONES through documented methodology, architecture, governance doctrine, versioned content, and transparent publication status — without fabricated case studies.",
    },
    breadcrumb: {
      home: "Home",
      current: "Evidence",
      navLabel: "Breadcrumb",
    },
    hero: {
      eyebrow: "Evidence",
      title: "Credibility comes from structure — not claims.",
      subtitle: "This page shows what exists today: methodology, architecture, governance doctrine, and honest publication status.",
      tagline: "Demonstrable. Versioned. Honest about status.",
      actions: [{ href: "#methodology", label: "Review the evidence base" }],
    },
    methodology: {
      eyebrow: "Methodology",
      title: "A published five-step framework",
      description: "Engagements follow the Five-Step Governance Framework — documented on the Methodology page.",
      paragraphs: [
        "Territorial Reading, Flow Mapping, Governance Structuring, Collaboration Framework, and Strategic Reporting form one governed sequence.",
        "The framework is versioned in the repository — not an informal pitch.",
      ],
      link: { href: "/methodology", label: "Read the Methodology" },
    },
    architecture: {
      eyebrow: "Architecture",
      title: "A published coordination model",
      description: "Platform architecture explains how territory, actors, flows, modules, and execution relate.",
      paragraphs: [
        "The hub-and-perimeter model, entity mandates, and Clevone Mining separation are documented on the Platform page.",
        "No invented partners or metrics are needed to evaluate the model. The architecture is readable as structure.",
      ],
      link: { href: "/ecosystem", label: "Explore the Platform" },
    },
    documentation: {
      eyebrow: "Documentation",
      title: "Institutional pages as source of truth",
      description: "Public documentation lives in bilingual institutional pages with honest publication status.",
      paragraphs: [
        "Positioning, About, Solutions, Methodology, Governance, Platform, FAQ, and Legal/Privacy pages are versioned institutional surfaces.",
        "Insights publish strategic notes. Where full article bodies are forthcoming, the site says so.",
      ],
      items: [
        {
          title: "Governance doctrine",
          description: "Structure before discretion. Documentation before action. Compliance as a structural requirement.",
          href: "/governance",
          label: "Open Governance",
        },
        {
          title: "Strategic notes",
          description: "Editorial insights index with honest forthcoming status where analysis is not yet published.",
          href: "/insights",
          label: "Open Insights",
        },
        {
          title: "Positioning doctrine",
          description: "What CLEVONES is and is not — without fabricated market claims.",
          href: "/positioning",
          label: "Open Positioning",
        },
      ],
    },
    transparency: {
      eyebrow: "Transparency",
      title: "What this site will not invent",
      description: "Institutional trust requires stating limits as clearly as strengths.",
      paragraphs: [
        "CLEVONES does not present fabricated clients, awards, ratings, growth figures, partner logos, testimonials, or success stories.",
        "Where a document is not yet published, status is disclosed. Evaluation should rest on what exists today.",
      ],
      items: [
        {
          title: "No fabricated proof",
          description: "Absence of invented metrics is intentional. Structural documentation is the evidence base.",
        },
        {
          title: "Honest publication status",
          description: "Articles may mark full analysis as forthcoming rather than fill space with unverifiable claims.",
        },
        {
          title: "Operational separation disclosed",
          description: "Clevone Mining is identified as operationally distinct from the governance platform.",
        },
      ],
    },
    standards: {
      eyebrow: "Standards",
      title: "Governance and eligibility standards on record",
      description: "Compliance principles, data-handling boundaries, and eligibility filters are published.",
      items: [
        {
          title: "Compliance principles",
          description: "Actor identification, documentation discipline, controlled data handling, auditability, role-based access.",
        },
        {
          title: "Eligibility filters",
          description: "Legitimacy, strategic relevance, compliance readiness, institutional compatibility, coordination maturity, long-term value.",
        },
        {
          title: "Explicit non-eligibility",
          description: "Speculative proposals, informal requests, undocumented initiatives, and engagements without compliance readiness may not proceed.",
        },
      ],
      link: { href: "/governance", label: "Read Governance standards" },
    },
    quality: {
      eyebrow: "Quality",
      title: "Engineering and editorial discipline",
      description: "Quality is shown through process controls — not invented certifications.",
      items: [
        {
          title: "Versioned source of truth",
          description: "Institutional copy and architecture decisions are maintained in the Git repository.",
        },
        {
          title: "Bilingual parity",
          description: "EN and FR pages share the same architecture. Language switching resolves to the same logical page.",
        },
        {
          title: "Static verification gates",
          description: "TypeScript checking, linting, and production build before pages are considered complete.",
        },
        {
          title: "SEO and accessibility structure",
          description: "Pages ship with title, description, canonical, Open Graph, JSON-LD, breadcrumbs, and sitemap entries.",
        },
        {
          title: "Traceability of claims",
          description: "Mission rules forbid inventing clients, statistics, partners, awards, or case studies.",
        },
      ],
    },
    roadmap: {
      eyebrow: "Roadmap",
      title: "Documented product journey",
      description: "What exists is the CEOS institutional journey. Future work is only what prior missions have recorded.",
      paragraphs: [
        "Delivered surfaces include Home, Challenge, Why Now, Positioning, About, Solutions, Methodology, Governance, Platform, Evidence, FAQ, Contact, Legal, and Privacy.",
        "No commercial product roadmap or growth targets are claimed here.",
      ],
      items: [
        {
          title: "Narrative journey",
          description: "Challenge → Why Now → Positioning → About → Solutions → Methodology → Governance → Platform → Evidence → FAQ → Contact.",
        },
        {
          title: "Evidence distinct from Insights",
          description: "Evidence is system credibility. Insights remain the editorial notes library.",
        },
        {
          title: "Access distinct from Platform",
          description: "Sign-in and client portal are labeled Access — never confused with the Platform page.",
        },
      ],
    },
    cta: {
      title: "Read the institutional FAQ",
      description: "Role, eligibility, ecosystem boundaries, and how collaboration starts — answered structurally.",
      actions: [{ href: "/faq", label: "Read institutional FAQ" }],
    },
  },
  fr: {
    meta: {
      title: "Preuves — Documentation et crédibilité du système",
      description:
        "Pourquoi un décideur peut évaluer CLEVONES via une méthodologie, une architecture, une doctrine de gouvernance, un contenu versionné et un statut de publication transparent — sans cas inventés.",
    },
    breadcrumb: {
      home: "Accueil",
      current: "Preuves",
      navLabel: "Fil d'Ariane",
    },
    hero: {
      eyebrow: "Preuves",
      title: "La crédibilité vient de la structure — non des revendications.",
      subtitle: "Cette page montre ce qui existe aujourd'hui : méthodologie, architecture, doctrine de gouvernance et statut de publication honnête.",
      tagline: "Démontrable. Versionné. Honnête sur le statut.",
      actions: [{ href: "#methodology", label: "Consulter la base de preuves" }],
    },
    methodology: {
      eyebrow: "Méthodologie",
      title: "Un cadre publié en cinq étapes",
      description: "Les engagements suivent le Cadre de gouvernance en cinq étapes — documenté sur la page Méthodologie.",
      paragraphs: [
        "Lecture territoriale, cartographie des flux, structuration de la gouvernance, cadre de collaboration et reporting stratégique forment une séquence gouvernée.",
        "Ce cadre est versionné dans le dépôt — non un argumentaire informel.",
      ],
      link: { href: "/methodologie", label: "Lire la Méthodologie" },
    },
    architecture: {
      eyebrow: "Architecture",
      title: "Un modèle de coordination publié",
      description: "L'architecture de plateforme explique comment territoire, acteurs, flux, modules et exécution se relient.",
      paragraphs: [
        "Le modèle hub et périphérie, les mandats des entités et la séparation de Clevone Mining sont documentés sur la page Plateforme.",
        "Aucun partenaire inventé ni métrique n'est nécessaire pour évaluer le modèle. L'architecture se lit comme une structure.",
      ],
      link: { href: "/ecosysteme", label: "Explorer la Plateforme" },
    },
    documentation: {
      eyebrow: "Documentation",
      title: "Les pages institutionnelles comme source de vérité",
      description: "La documentation publique vit dans des pages institutionnelles bilingues avec un statut de publication honnête.",
      paragraphs: [
        "Positionnement, À propos, Solutions, Méthodologie, Gouvernance, Plateforme, FAQ et Mentions / Confidentialité sont des surfaces institutionnelles versionnées.",
        "Analyses publie des notes stratégiques. Lorsque le corps complet d'un article est à venir, le site le dit.",
      ],
      items: [
        {
          title: "Doctrine de gouvernance",
          description: "La structure avant la discrétion. La documentation avant l'action. La conformité comme exigence structurelle.",
          href: "/gouvernance",
          label: "Ouvrir Gouvernance",
        },
        {
          title: "Notes stratégiques",
          description: "Index éditorial des analyses avec statut « à venir » explicite lorsque l'analyse complète n'est pas encore publiée.",
          href: "/analyses",
          label: "Ouvrir Analyses",
        },
        {
          title: "Doctrine de positionnement",
          description: "Ce que CLEVONES est et n'est pas — sans revendications de marché inventées.",
          href: "/positionnement",
          label: "Ouvrir Positionnement",
        },
      ],
    },
    transparency: {
      eyebrow: "Transparence",
      title: "Ce que ce site n'inventera pas",
      description: "La confiance institutionnelle exige d'énoncer les limites aussi clairement que les forces.",
      paragraphs: [
        "CLEVONES ne présente pas de clients, awards, notes, chiffres de croissance, logos partenaires, témoignages ou success stories inventés.",
        "Lorsqu'un document n'est pas encore publié, le statut est divulgué. L'évaluation doit reposer sur ce qui existe aujourd'hui.",
      ],
      items: [
        {
          title: "Pas de preuves fabriquées",
          description: "L'absence de métriques inventées est intentionnelle. La documentation structurelle constitue la base de preuves.",
        },
        {
          title: "Statut de publication honnête",
          description: "Les articles peuvent marquer l'analyse complète comme à venir plutôt que de combler l'espace par des affirmations non vérifiables.",
        },
        {
          title: "Séparation opérationnelle divulguée",
          description: "Clevone Mining est identifiée comme opérationnellement distincte de la plateforme de gouvernance.",
        },
      ],
    },
    standards: {
      eyebrow: "Standards",
      title: "Standards de gouvernance et d'éligibilité publiés",
      description: "Principes de conformité, limites de traitement des données et filtres d'éligibilité sont publiés.",
      items: [
        {
          title: "Principes de conformité",
          description: "Identification des acteurs, discipline documentaire, traitement contrôlé des données, auditabilité, accès fondé sur les rôles.",
        },
        {
          title: "Filtres d'éligibilité",
          description: "Légitimité, pertinence stratégique, préparation à la conformité, compatibilité institutionnelle, maturité de coordination, valeur de long terme.",
        },
        {
          title: "Non-éligibilité explicite",
          description: "Propositions spéculatives, demandes informelles, initiatives non documentées et engagements sans préparation à la conformité peuvent ne pas aboutir.",
        },
      ],
      link: { href: "/gouvernance", label: "Lire les standards de Gouvernance" },
    },
    quality: {
      eyebrow: "Qualité",
      title: "Discipline d'ingénierie et éditoriale",
      description: "La qualité se montre par des contrôles de processus — non par des certifications inventées.",
      items: [
        {
          title: "Source de vérité versionnée",
          description: "Les contenus institutionnels et les décisions d'architecture sont maintenus dans le dépôt Git.",
        },
        {
          title: "Parité bilingue",
          description: "Les pages EN et FR partagent la même architecture. Le changement de langue résout la même page logique.",
        },
        {
          title: "Portes de vérification statique",
          description: "Vérification TypeScript, lint et build de production avant de considérer les pages comme complètes.",
        },
        {
          title: "Structure SEO et accessibilité",
          description: "Les pages livrent title, description, canonical, Open Graph, JSON-LD, fil d'Ariane et entrées sitemap.",
        },
        {
          title: "Traçabilité des affirmations",
          description: "Les règles de mission interdisent d'inventer clients, statistiques, partenaires, awards ou cas.",
        },
      ],
    },
    roadmap: {
      eyebrow: "Feuille de route",
      title: "Parcours produit documenté",
      description: "Ce qui existe est le parcours institutionnel CEOS. Le futur n'est énoncé que s'il a déjà été consigné dans les missions antérieures.",
      paragraphs: [
        "Les surfaces livrées incluent Accueil, Défi, Pourquoi maintenant, Positionnement, À propos, Solutions, Méthodologie, Gouvernance, Plateforme, Preuves, FAQ, Contact, Mentions et Confidentialité.",
        "Aucune feuille de route commerciale ni cible de croissance n'est revendiquée ici.",
      ],
      items: [
        {
          title: "Parcours narratif",
          description: "Défi → Pourquoi maintenant → Positionnement → À propos → Solutions → Méthodologie → Gouvernance → Plateforme → Preuves → FAQ → Contact.",
        },
        {
          title: "Preuves distinctes des Analyses",
          description: "Preuves = crédibilité du système. Analyses = bibliothèque de notes éditoriales.",
        },
        {
          title: "Accès distinct de la Plateforme",
          description: "Connexion et portail client sont libellés Accès — jamais confondus avec la page Plateforme.",
        },
      ],
    },
    cta: {
      title: "Lire la FAQ institutionnelle",
      description: "Rôle, éligibilité, frontières de l'écosystème et démarrage de la collaboration — réponses structurelles.",
      actions: [{ href: "/questions-frequentes", label: "Lire la FAQ institutionnelle" }],
    },
  },
} as const satisfies LocalizedPageContent<EvidencePageContent>;
