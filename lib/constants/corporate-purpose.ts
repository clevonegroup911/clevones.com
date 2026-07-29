/**
 * Canonical corporate vision and legal purpose (objet social) for Clevones.
 *
 * Vision defines brand identity and operating posture.
 * Objet social defines legal fields of intervention.
 * They must reinforce each other: domains expand capacity; they never replace
 * the role of architect of territorial economic flows.
 */

export const corporateVision = {
  title: "Transform territorial potential into durable economic assets",
  statement:
    "Clevones designs, structures, and coordinates architectures of territorial economic flows. Through technology, logistics, digital infrastructure, economic intelligence, and coordination platforms, it converts complex territorial potential into governed, durable economic value.",
  statementFr:
    "Clevones conçoit, structure et coordonne des architectures de flux économiques territoriaux. Grâce aux technologies, à la logistique, aux infrastructures numériques, à l'intelligence économique et aux plateformes de coordination, elle transforme le potentiel territorial en actifs économiques durables.",
} as const;

export const corporateMission = {
  title: "Architect, structure, and coordinate territorial economic systems",
  statement:
    "Clevones acts as a neutral governance and coordination layer for territorial economic initiatives in the Democratic Republic of Congo and across Africa — structuring frameworks, aligning legitimate actors, and disciplining strategic reporting without substituting operational actors.",
  statementFr:
    "Clevones agit comme couche neutre de gouvernance et de coordination des initiatives économiques territoriales en République Démocratique du Congo et en Afrique — en structurant les cadres, en alignant les acteurs légitimes et en disciplinant le reporting stratégique, sans se substituer aux acteurs opérationnels.",
} as const;

/**
 * Strategic framing: objet social domains are fields of territorial architecture,
 * not a catalogue of commercial services offered by the governance platform.
 */
export const domainsFraming = {
  eyebrow: "Fields of intervention",
  eyebrowFr: "Champs d'intervention",
  title: "Legal capacity in service of territorial architecture",
  titleFr: "Une capacité juridique au service de l'architecture territoriale",
  description:
    "Clevones' corporate purpose defines the domains within which the company may design, structure, and coordinate territorial economic architectures — directly, through its ecosystem, or via subsidiaries and partnerships. These fields expand institutional capacity; they do not redefine Clevones as a multi-service operator.",
  descriptionFr:
    "L'objet social de Clevones définit les domaines dans lesquels la société peut concevoir, structurer et coordonner des architectures économiques territoriales — directement, via son écosystème, ou par filiales et partenariats. Ces champs élargissent la capacité institutionnelle ; ils ne redéfinissent pas Clevones comme une société de services.",
} as const;

export type InterventionDomain = {
  id: string;
  title: string;
  titleFr: string;
  /** How this domain serves territorial flow architecture — not a service pitch. */
  architectureRole: string;
  architectureRoleFr: string;
  /** Ecosystem entities that already embody this domain, when applicable. */
  ecosystemLink?: string;
};

export const interventionDomains: readonly InterventionDomain[] = [
  {
    id: "technology",
    title: "Technology & digital transformation",
    titleFr: "Technologies et transformation numérique",
    architectureRole:
      "Software, digital solutions, and technology services that make territorial coordination legible, auditable, and scalable.",
    architectureRoleFr:
      "Logiciels, solutions numériques et services technologiques qui rendent la coordination territoriale lisible, auditable et scalable.",
    ecosystemLink: "Clevonet",
  },
  {
    id: "logistics",
    title: "Transport, logistics & supply chains",
    titleFr: "Transport, logistique et chaînes d'approvisionnement",
    architectureRole:
      "Governance and structuring of circulation systems — corridors, supply chains, and logistics coordination without informal brokerage.",
    architectureRoleFr:
      "Gouvernance et structuration des systèmes de circulation — corridors, chaînes d'approvisionnement et coordination logistique, sans courtage informel.",
  },
  {
    id: "industry",
    title: "Industry, production & productive innovation",
    titleFr: "Industrie, production et innovation productive",
    architectureRole:
      "Structuring of productive initiatives into documented, compliant architectures that can sustain long-horizon territorial value.",
    architectureRoleFr:
      "Structuration d'initiatives productives en architectures documentées et conformes, capables de soutenir une valeur territoriale de long terme.",
    ecosystemLink: "Clevone Mining",
  },
  {
    id: "energy",
    title: "Energy",
    titleFr: "Énergie",
    architectureRole:
      "Development and coordination of energy-related solutions and innovations as components of territorial economic infrastructure.",
    architectureRoleFr:
      "Développement et coordination de solutions et d'innovations énergétiques comme composantes de l'infrastructure économique territoriale.",
  },
  {
    id: "media",
    title: "Media, communication & creative industries",
    titleFr: "Médias, communication et industries créatives",
    architectureRole:
      "Economic intelligence, strategic communication, and content architectures that inform institutional decision-making.",
    architectureRoleFr:
      "Intelligence économique, communication stratégique et architectures de contenus qui éclairent la décision institutionnelle.",
    ecosystemLink: "Clevodia",
  },
  {
    id: "education",
    title: "Education, training & capacity building",
    titleFr: "Éducation, formation et renforcement des capacités",
    architectureRole:
      "Skills, knowledge infrastructures, and certified learning that strengthen the human and institutional capacity of territorial systems.",
    architectureRoleFr:
      "Compétences, infrastructures de savoir et formations certifiantes qui renforcent la capacité humaine et institutionnelle des systèmes territoriaux.",
    ecosystemLink: "Btlearn Inc. / Bicuni",
  },
  {
    id: "advisory",
    title: "Strategic advisory, compliance & governance",
    titleFr: "Conseil stratégique, conformité et gouvernance",
    architectureRole:
      "Strategic, organizational, administrative, and financial advisory — including regulatory, compliance, and governance accompaniment within applicable law.",
    architectureRoleFr:
      "Conseil stratégique, organisationnel, administratif et financier — y compris l'accompagnement réglementaire, de conformité et de gouvernance, dans le respect du droit applicable.",
  },
  {
    id: "events",
    title: "Sports, culture & professional events",
    titleFr: "Sports, culture et événements professionnels",
    architectureRole:
      "Organization and promotion of sporting, cultural, artistic, and professional events as structured platforms for territorial visibility and coordination.",
    architectureRoleFr:
      "Organisation et promotion d'événements sportifs, culturels, artistiques et professionnels comme plateformes structurées de visibilité et de coordination territoriales.",
  },
  {
    id: "commerce",
    title: "Commerce & authorized distribution",
    titleFr: "Commerce et distribution autorisée",
    architectureRole:
      "Corporate capacity for lawful trade, distribution, import, and export. Commercial execution, when it occurs, is exercised through structurally separated entities — never as informal brokerage under the Clevones governance platform.",
    architectureRoleFr:
      "Capacité sociale pour le commerce, la distribution, l'importation et l'exportation autorisés. L'exécution commerciale, lorsqu'elle intervient, s'exerce via des entités structurellement séparées — jamais comme courtage informel sous la plateforme de gouvernance Clevones.",
  },
] as const;

export const corporateDevelopmentClause = {
  title: "Subsidiaries, partnerships, and related operations",
  statement:
    "Clevones may create subsidiaries, take equity participations, conclude partnerships, and undertake commercial, financial, movable, or immovable operations that relate directly or indirectly to its corporate purpose, or that may favour its development, in accordance with applicable law.",
  statementFr:
    "Clevones peut créer des filiales, prendre des participations, conclure des partenariats et réaliser toutes opérations commerciales, financières, mobilières ou immobilières se rattachant directement ou indirectement à son objet social, ou susceptibles d'en favoriser le développement, dans le respect de la législation applicable.",
} as const;

/** Full legal objet social text for mentions légales (verbatim structure, institutional register). */
export const objetSocialLegalFr = {
  intro:
    "La société a pour objet, en République Démocratique du Congo et à l'étranger :",
  items: [
    "les technologies, la transformation numérique, le développement de logiciels, de solutions numériques et de services technologiques ;",
    "le transport, la logistique et les services de gestion des chaînes d'approvisionnement ;",
    "l'industrie, la production, l'innovation et le développement de solutions destinées aux secteurs productifs ;",
    "l'énergie et le développement de solutions, services et innovations dans le domaine énergétique ;",
    "les médias, la communication, l'audiovisuel, l'édition, la création de contenus et les industries créatives ;",
    "l'éducation, la formation, le développement des compétences et le renforcement des capacités ;",
    "le conseil stratégique, organisationnel, administratif et financier, dans le respect de la réglementation en vigueur ;",
    "l'accompagnement des entreprises, des organisations et des institutions dans leurs démarches administratives, réglementaires, de conformité et de gouvernance ;",
    "les sports, la culture, l'organisation, la production et la promotion d'événements sportifs, culturels, artistiques et professionnels ;",
    "le commerce, la distribution, la vente, l'achat, l'importation, l'exportation et la commercialisation de biens, produits et services autorisés par la loi.",
  ],
  closing:
    "La société peut également créer des filiales, prendre des participations dans d'autres sociétés, conclure des partenariats et réaliser toutes opérations commerciales, financières, mobilières ou immobilières se rattachant directement ou indirectement à son objet social ou susceptibles d'en favoriser le développement dans le respect de la législation applicable.",
} as const;

/**
 * Clarifies the structural relationship between legal capacity and brand posture.
 * Used wherever breadth of objet social could be misread as operational substitution.
 */
export const capacityVsPlatformClarification = {
  en: "Clevones' corporate purpose defines the legal fields in which the company and its ecosystem may intervene. The Clevones governance platform itself remains a neutral architecture, structuring, and coordination layer — not an operator, trader, resource exploiter, or informal broker.",
  fr: "L'objet social de Clevones définit les champs juridiques dans lesquels la société et son écosystème peuvent intervenir. La plateforme de gouvernance Clevones demeure une couche neutre d'architecture, de structuration et de coordination — et non un opérateur, un négociant, un exploitant de ressources ou un facilitateur informel.",
} as const;
