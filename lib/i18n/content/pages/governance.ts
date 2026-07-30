import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
  TitledDescription,
} from "./types";

export type GovernancePageContent = {
  meta: PageMeta;
  hero: HeroContent;
  doctrine: SectionHeadingContent & { paragraphs: readonly string[] };
  compliance: SectionHeadingContent & { items: readonly TitledDescription[] };
  dataHandling: SectionHeadingContent & { paragraphs: readonly string[] };
  filtering: SectionHeadingContent & { filters: readonly TitledDescription[] };
  notEligible: SectionHeadingContent & {
    paragraphs: readonly string[];
    exclusions: readonly string[];
    excludedLabel: string;
  };
  cta: CtaContent;
};

const clientFilters = {
  en: [
    { title: "Legitimacy", description: "Recognized standing, legal foundation, and verifiable identity." },
    { title: "Strategic relevance", description: "Alignment with territorial governance objectives and long-term value." },
    { title: "Compliance readiness", description: "Capacity to operate within documented regulatory frameworks." },
    { title: "Institutional compatibility", description: "Fit with neutral governance protocols and coordination requirements." },
    { title: "Coordination maturity", description: "Ability to engage in structured, documented multi-actor collaboration." },
    { title: "Long-term value", description: "Commitment to sustained impact beyond short-cycle opportunism." },
  ],
  fr: [
    { title: "Légitimité", description: "Statut reconnu, fondement juridique et identité vérifiable." },
    { title: "Pertinence stratégique", description: "Alignement sur les objectifs de gouvernance territoriale et la valeur de long terme." },
    { title: "Préparation à la conformité", description: "Capacité à opérer dans des cadres réglementaires documentés." },
    { title: "Compatibilité institutionnelle", description: "Adéquation avec les protocoles de gouvernance neutre et les exigences de coordination." },
    { title: "Maturité de coordination", description: "Capacité à participer à une collaboration multi-acteurs structurée et documentée." },
    { title: "Valeur de long terme", description: "Engagement en faveur d'un impact durable au-delà de l'opportunisme à court terme." },
  ],
} as const;

export const governancePageContent = {
  en: {
    meta: { title: "Governance", description: "Clevones' governance doctrine, compliance principles, and institutional eligibility framework." },
    hero: {
      eyebrow: "Governance",
      title: "Rules before discretion. Documentation before action.",
      subtitle: "Every engagement follows explicit frameworks — roles, reporting, compliance, and accountability defined before collaboration begins.",
      tagline: "Governed. Documented. Compliant.",
    },
    doctrine: {
      eyebrow: "Governance doctrine",
      title: "Structure before discretion. Documentation before action.",
      paragraphs: [
        "Clevones does not coordinate through informal channels or undocumented arrangements.",
        "Every engagement starts with defined roles, responsibilities, and compliance expectations.",
        "Governance design stays separate from operational execution. Clevones coordinates — it does not substitute legitimate actors.",
        "Compliance is a structural requirement, not an afterthought.",
      ],
    },
    compliance: {
      eyebrow: "Compliance principles",
      title: "Built into every engagement",
      description: "These principles are embedded in governance architecture — not applied selectively.",
      items: [
        { title: "Actor identification", description: "Every entity is verified for standing, legal foundation, and identity before engagement." },
        { title: "Documentation discipline", description: "Decisions and protocols are recorded in governed formats — not informal channels." },
        { title: "Controlled data handling", description: "Information is processed within defined boundaries. Access follows documented protocols." },
        { title: "Non-sensitive intelligence", description: "Territorial reading uses structured, appropriate information — no sensitive operational data." },
        { title: "Auditability", description: "Governance outputs and compliance checkpoints support institutional review over time." },
        { title: "Role-based access", description: "Actors access only what their institutional function requires." },
        { title: "Institutional compatibility", description: "Frameworks align with applicable regulatory standards and governance traditions." },
      ],
    },
    dataHandling: {
      eyebrow: "Data handling",
      title: "Clear information boundaries",
      paragraphs: [
        "Clevones does not expose sensitive operational data. Proprietary logistics, confidential commercial information, and actor-specific intelligence are excluded by design.",
        "The platform works only with structured, non-sensitive, authorized information — classified and cleared for institutional use.",
      ],
    },
    filtering: {
      eyebrow: "Client filtering framework",
      title: "Six criteria for engagement",
      description: "Not every actor or initiative proceeds to coordination. Clevones applies six filters before governed engagement begins.",
      filters: clientFilters.en,
    },
    notEligible: {
      eyebrow: "Not eligible",
      title: "Requests that may not be reviewed",
      paragraphs: [
        "Clevones filters deliberately to protect institutional credibility. Speculative proposals, informal requests, and undocumented initiatives may not proceed.",
        "This protects governance integrity — not a rejection of territorial potential. Actors should establish structural readiness before re-engaging.",
      ],
      exclusions: [
        "Speculative proposals without documented institutional foundation",
        "Informal coordination requests lacking governed protocols",
        "Undocumented initiatives without governance or compliance framework",
        "Engagements that cannot demonstrate compliance readiness",
      ],
      excludedLabel: "Excluded",
    },
    cta: {
      title: "See how the platform works",
      description: "Governance defines the rules. The platform shows how territory, actors, and flows connect.",
      actions: [{ href: "/ecosystem", label: "See how the platform works" }],
    },
  },
  fr: {
    meta: { title: "Gouvernance", description: "La doctrine de gouvernance, les principes de conformité et le cadre d'éligibilité institutionnelle de Clevones." },
    hero: {
      eyebrow: "Gouvernance",
      title: "Des règles avant la discrétion. De la documentation avant l'action.",
      subtitle: "Chaque engagement suit des cadres explicites — rôles, reporting, conformité et responsabilité définis avant le début de la collaboration.",
      tagline: "Gouverné. Documenté. Conforme.",
    },
    doctrine: {
      eyebrow: "Doctrine de gouvernance",
      title: "La structure avant la discrétion. La documentation avant l'action.",
      paragraphs: [
        "Clevones ne coordonne pas par des canaux informels ou des arrangements non documentés.",
        "Chaque engagement commence par des rôles, responsabilités et attentes de conformité définis.",
        "La conception de la gouvernance reste distincte de l'exécution opérationnelle. Clevones coordonne — elle ne se substitue pas aux acteurs légitimes.",
        "La conformité est une exigence structurelle, non une réflexion après coup.",
      ],
    },
    compliance: {
      eyebrow: "Principes de conformité",
      title: "Intégrés à chaque engagement",
      description: "Ces principes sont intégrés à l'architecture de gouvernance — ils ne sont pas appliqués de manière sélective.",
      items: [
        { title: "Identification des acteurs", description: "Chaque entité est vérifiée quant à son statut, son fondement juridique et son identité avant tout engagement." },
        { title: "Discipline documentaire", description: "Les décisions et protocoles sont consignés dans des formats gouvernés — non dans des canaux informels." },
        { title: "Traitement contrôlé des données", description: "Les informations sont traitées dans des limites définies. L'accès suit des protocoles documentés." },
        { title: "Information non sensible", description: "La lecture territoriale repose sur des informations structurées et appropriées — sans données opérationnelles sensibles." },
        { title: "Auditabilité", description: "Les résultats de gouvernance et les points de conformité soutiennent l'examen institutionnel dans le temps." },
        { title: "Accès fondé sur les rôles", description: "Les acteurs n'accèdent qu'à ce que leur fonction institutionnelle exige." },
        { title: "Compatibilité institutionnelle", description: "Les cadres s'alignent sur les normes réglementaires applicables et les traditions de gouvernance." },
      ],
    },
    dataHandling: {
      eyebrow: "Traitement des données",
      title: "Des limites informationnelles claires",
      paragraphs: [
        "Clevones n'expose pas de données opérationnelles sensibles. La logistique propriétaire, les informations commerciales confidentielles et les renseignements propres aux acteurs sont exclus par conception.",
        "La plateforme travaille uniquement avec des informations structurées, non sensibles et autorisées — classifiées et validées pour un usage institutionnel.",
      ],
    },
    filtering: {
      eyebrow: "Cadre de sélection des acteurs",
      title: "Six critères d'engagement",
      description: "Tout acteur ou toute initiative ne relève pas de la coordination. Clevones applique six filtres avant le début d'un engagement gouverné.",
      filters: clientFilters.fr,
    },
    notEligible: {
      eyebrow: "Non éligible",
      title: "Demandes susceptibles de ne pas être examinées",
      paragraphs: [
        "Clevones filtre délibérément pour protéger la crédibilité institutionnelle. Les propositions spéculatives, les demandes informelles et les initiatives non documentées peuvent ne pas aboutir.",
        "Cela protège l'intégrité de la gouvernance — ce n'est pas un rejet du potentiel territorial. Les acteurs doivent établir leur préparation structurelle avant de se présenter à nouveau.",
      ],
      exclusions: [
        "Propositions spéculatives sans fondement institutionnel documenté",
        "Demandes de coordination informelle dépourvues de protocoles gouvernés",
        "Initiatives non documentées sans cadre de gouvernance ou de conformité",
        "Engagements ne pouvant démontrer leur préparation à la conformité",
      ],
      excludedLabel: "Exclu",
    },
    cta: {
      title: "Voir comment fonctionne la plateforme",
      description: "La gouvernance définit les règles. La plateforme montre comment territoire, acteurs et flux se relient.",
      actions: [{ href: "/ecosysteme", label: "Voir comment fonctionne la plateforme" }],
    },
  },
} as const satisfies LocalizedPageContent<GovernancePageContent>;
