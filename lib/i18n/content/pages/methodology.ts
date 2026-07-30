import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
  TitledDescription,
} from "./types";

export type MethodologyStepContent = {
  number: string;
  title: string;
  summary: string;
  paragraphs: readonly string[];
  highlights: readonly string[];
};

export type MethodologyPageContent = {
  meta: PageMeta;
  hero: HeroContent;
  introduction: SectionHeadingContent & { paragraphs: readonly string[] };
  steps: readonly MethodologyStepContent[];
  principles: readonly TitledDescription[];
  cta: CtaContent;
};

export const methodologyPageContent = {
  en: {
    meta: { title: "Methodology", description: "The Clevones Five-Step Governance Framework for territorial initiatives." },
    hero: {
      eyebrow: "Methodology",
      title: "Five steps. One governed sequence.",
      subtitle: "Every territorial initiative moves through the same five phases — from reading the territory to strategic reporting.",
    },
    introduction: {
      eyebrow: "Introduction",
      title: "Structure before action",
      paragraphs: [
        "Clevones does not improvise. Every engagement follows five sequential phases.",
        "Each phase produces documented outputs. Governance is designed before execution begins.",
        "The same framework applies to every engagement — consistently, without exception.",
      ],
    },
    steps: [
      {
        number: "01",
        title: "Territorial Reading",
        summary: "Understand the territory before designing anything.",
        paragraphs: [
          "We assess the territorial environment using only non-sensitive, institutionally appropriate information.",
          "No field operations. No resource claims. No commercial positioning. Just a clear picture of context.",
        ],
        highlights: [
          "Regulatory and administrative context",
          "Infrastructure and corridor constraints",
          "Legitimate actor categories by role",
          "Existing coordination mechanisms",
        ],
      },
      {
        number: "02",
        title: "Flow Mapping",
        summary: "Map how economic value moves — without exposing sensitive data.",
        paragraphs: [
          "We document how value circulates: dependencies, gaps, and relationships between legitimate actors.",
          "The output is an architectural map, not an operational plan. Sensitive commercial data stays out.",
        ],
        highlights: [
          "Value circulation pathways",
          "Structural dependencies",
          "Coordination gaps",
          "Neutral flow architecture",
        ],
      },
      {
        number: "03",
        title: "Governance Structuring",
        summary: "Define who decides, who reports, and how compliance is verified.",
        paragraphs: [
          "Flow architecture becomes governance frameworks: roles, reporting lines, and accountability.",
          "Every actor knows their function. No ambiguity. No informal discretion.",
        ],
        highlights: [
          "Roles and responsibilities",
          "Reporting architecture",
          "Compliance checkpoints",
          "Escalation mechanisms",
        ],
      },
      {
        number: "04",
        title: "Collaboration Framework",
        summary: "Structured protocols for institutions, partners, investors, and strategic actors.",
        paragraphs: [
          "Legitimate actors engage through documented protocols — not commercial intermediation.",
          "Collaboration is controlled, recorded, and institutionally disciplined.",
        ],
        highlights: [
          "Institutional alignment protocols",
          "Partner coordination interfaces",
          "Investor engagement frameworks",
          "Strategic actor integration",
        ],
      },
      {
        number: "05",
        title: "Strategic Reporting",
        summary: "Executive reports, governance notes, and decision-support documents.",
        paragraphs: [
          "Every phase produces documented outputs for institutional stakeholders.",
          "Reporting is ongoing — not a final deliverable, but a governance discipline.",
        ],
        highlights: [
          "Executive summaries",
          "Governance status notes",
          "Readiness assessments",
          "Decision-support materials",
        ],
      },
    ],
    principles: [
      { title: "Neutrality", description: "No commercial interest, operational bias, or actor substitution." },
      { title: "Documentation", description: "Structured, auditable outputs — not verbal agreements." },
      { title: "Compliance", description: "Aligned with regulatory and institutional standards from day one." },
      { title: "Non-sensitive intelligence", description: "Territorial reading excludes proprietary or operational data." },
      { title: "Controlled collaboration", description: "Documented protocols — not informal arrangements." },
      { title: "Institutional discipline", description: "Structure before execution. Governance before capital." },
    ],
    cta: {
      title: "See how decisions are governed",
      description: "The methodology defines the sequence. Governance defines the rules.",
      actions: [{ href: "/governance", label: "See how decisions are governed" }],
    },
  },
  fr: {
    meta: { title: "Méthodologie", description: "Le Cadre de gouvernance Clevones en cinq étapes pour les initiatives territoriales." },
    hero: {
      eyebrow: "Méthodologie",
      title: "Cinq étapes. Une séquence gouvernée.",
      subtitle: "Chaque initiative territoriale suit les mêmes cinq phases — de la lecture du territoire au reporting stratégique.",
    },
    introduction: {
      eyebrow: "Introduction",
      title: "La structure avant l'action",
      paragraphs: [
        "Clevones n'improvise pas. Chaque engagement suit cinq phases séquentielles.",
        "Chaque phase produit des livrables documentés. La gouvernance est conçue avant l'exécution.",
        "Le même cadre s'applique à chaque engagement — de manière constante, sans exception.",
      ],
    },
    steps: [
      {
        number: "01",
        title: "Lecture territoriale",
        summary: "Comprendre le territoire avant de concevoir quoi que ce soit.",
        paragraphs: [
          "Nous évaluons l'environnement territorial à partir d'informations non sensibles et appropriées au cadre institutionnel.",
          "Pas d'opérations de terrain. Pas de revendications de ressources. Pas de positionnement commercial. Un portrait clair du contexte.",
        ],
        highlights: [
          "Contexte réglementaire et administratif",
          "Contraintes d'infrastructure et de corridors",
          "Catégories d'acteurs légitimes par rôle",
          "Mécanismes de coordination existants",
        ],
      },
      {
        number: "02",
        title: "Cartographie des flux",
        summary: "Cartographier la circulation de la valeur — sans exposer de données sensibles.",
        paragraphs: [
          "Nous documentons comment la valeur circule : dépendances, lacunes et relations entre acteurs légitimes.",
          "Le résultat est une cartographie architecturale, pas un plan opérationnel. Les données commerciales sensibles restent exclues.",
        ],
        highlights: [
          "Parcours de circulation de la valeur",
          "Dépendances structurelles",
          "Lacunes de coordination",
          "Architecture neutre des flux",
        ],
      },
      {
        number: "03",
        title: "Structuration de la gouvernance",
        summary: "Définir qui décide, qui rend compte et comment la conformité est vérifiée.",
        paragraphs: [
          "L'architecture des flux devient des cadres de gouvernance : rôles, lignes de reporting et responsabilité.",
          "Chaque acteur connaît sa fonction. Pas d'ambiguïté. Pas de pouvoir discrétionnaire informel.",
        ],
        highlights: [
          "Rôles et responsabilités",
          "Architecture de reporting",
          "Points de contrôle de conformité",
          "Mécanismes d'escalade",
        ],
      },
      {
        number: "04",
        title: "Cadre de collaboration",
        summary: "Protocoles structurés pour institutions, partenaires, investisseurs et acteurs stratégiques.",
        paragraphs: [
          "Les acteurs légitimes s'engagent par des protocoles documentés — non par de l'intermédiation commerciale.",
          "La collaboration est contrôlée, consignée et disciplinée sur le plan institutionnel.",
        ],
        highlights: [
          "Protocoles d'alignement institutionnel",
          "Interfaces de coordination des partenaires",
          "Cadres d'engagement des investisseurs",
          "Intégration des acteurs stratégiques",
        ],
      },
      {
        number: "05",
        title: "Reporting stratégique",
        summary: "Rapports exécutifs, notes de gouvernance et documents d'aide à la décision.",
        paragraphs: [
          "Chaque phase produit des livrables documentés pour les parties prenantes institutionnelles.",
          "Le reporting est continu — non un livrable final, mais une discipline de gouvernance.",
        ],
        highlights: [
          "Synthèses exécutives",
          "Notes d'état de gouvernance",
          "Évaluations de préparation",
          "Supports d'aide à la décision",
        ],
      },
    ],
    principles: [
      { title: "Neutralité", description: "Aucun intérêt commercial, biais opérationnel ni substitution d'acteurs." },
      { title: "Documentation", description: "Des livrables structurés et auditables — non des accords verbaux." },
      { title: "Conformité", description: "Alignée dès le départ sur les normes réglementaires et institutionnelles." },
      { title: "Information non sensible", description: "La lecture territoriale exclut les données propriétaires ou opérationnelles." },
      { title: "Collaboration contrôlée", description: "Des protocoles documentés — non des arrangements informels." },
      { title: "Discipline institutionnelle", description: "La structure avant l'exécution. La gouvernance avant le capital." },
    ],
    cta: {
      title: "Voir comment les décisions sont gouvernées",
      description: "La méthodologie définit la séquence. La gouvernance définit les règles.",
      actions: [{ href: "/gouvernance", label: "Voir comment les décisions sont gouvernées" }],
    },
  },
} as const satisfies LocalizedPageContent<MethodologyPageContent>;
