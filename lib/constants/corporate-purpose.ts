/**
 * Canonical corporate vision and legal purpose (objet social) for CLEVONE SARL.
 *
 * Vision is a strategic orientation — not the company's unique legal activity.
 * Objet social defines the lawful fields in which the company may intervene.
 */

export const corporateVision = {
  title: "Transform territorial potential into durable economic assets",
  statement:
    "CLEVONE SARL designs, structures, and coordinates digital, commercial, and institutional systems. Through technology, business software, logistics, industry, energy, media, education, and advisory, it converts complex territorial potential into durable economic value.",
  statementFr:
    "CLEVONE SARL conçoit, structure et coordonne des systèmes numériques, commerciaux et institutionnels. Grâce aux technologies, aux progiciels, à la logistique, à l'industrie, à l'énergie, aux médias, à l'éducation et au conseil, elle transforme le potentiel territorial en valeur économique durable.",
} as const;

export const corporateMission = {
  title: "Build digital, commercial and institutional infrastructure for Africa",
  statement:
    "CLEVONE SARL is a Congolese multi-sector company based in Kisangani. It develops software and digital platforms, supports logistics and productive systems, and provides media, education, and advisory capabilities — for institutions, enterprises, and partners in the Democratic Republic of Congo and across Africa.",
  statementFr:
    "CLEVONE SARL est une société congolaise multisectorielle basée à Kisangani. Elle développe des logiciels et des plateformes numériques, appuie la logistique et les systèmes productifs, et fournit des capacités médias, éducatives et de conseil — pour les institutions, les entreprises et les partenaires en République Démocratique du Congo et en Afrique.",
} as const;

/**
 * Strategic framing: objet social domains are lawful fields of a multi-sector
 * company. The strategic vision orients how those fields are structured; it
 * does not replace them as the unique legal activity.
 */
export const domainsFraming = {
  eyebrow: "Fields of intervention",
  eyebrowFr: "Champs d'intervention",
  title: "Lawful multi-sector capacity",
  titleFr: "Une capacité juridique multisectorielle",
  description:
    "CLEVONE SARL's corporate purpose defines the domains in which the company may operate — directly, through its ecosystem, or via subsidiaries and partnerships. The strategic vision — Governance Architecture for Territorial Economic Flows — orients how digital, commercial, and institutional systems are structured. It is not the company's unique legal activity.",
  descriptionFr:
    "L'objet social de CLEVONE SARL définit les domaines dans lesquels la société peut intervenir — directement, via son écosystème, ou par filiales et partenariats. La vision stratégique — Architecture de gouvernance des flux économiques territoriaux — oriente la structuration des systèmes numériques, commerciaux et institutionnels. Elle n'est pas l'unique activité juridique de la société.",
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
      "Software, digital platforms, business systems, and technology services that make organizations and territories legible, auditable, and scalable.",
    architectureRoleFr:
      "Logiciels, plateformes numériques, systèmes d'entreprise et services technologiques qui rendent les organisations et les territoires lisibles, auditables et scalables.",
    ecosystemLink: "CLEVONET · CLEVONE DMS",
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
    ecosystemLink: "CLEVODIA",
  },
  {
    id: "education",
    title: "Education, training & capacity building",
    titleFr: "Éducation, formation et renforcement des capacités",
    architectureRole:
      "Skills, knowledge infrastructures, and certified learning that strengthen the human and institutional capacity of territorial systems.",
    architectureRoleFr:
      "Compétences, infrastructures de savoir et formations certifiantes qui renforcent la capacité humaine et institutionnelle des systèmes territoriaux.",
    ecosystemLink: "Btlearn / BICUNI",
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
    "CLEVONE SARL may create subsidiaries, take equity participations, conclude partnerships, and undertake commercial, financial, movable, or immovable operations that relate directly or indirectly to its corporate purpose, or that may favour its development, in accordance with applicable law.",
  statementFr:
    "CLEVONE SARL peut créer des filiales, prendre des participations, conclure des partenariats et réaliser toutes opérations commerciales, financières, mobilières ou immobilières se rattachant directement ou indirectement à son objet social, ou susceptibles d'en favoriser le développement, dans le respect de la législation applicable.",
} as const;

/** Full legal objet social text for mentions légales (verbatim structure, institutional register). */
export const objetSocialLegalFr = {
  intro:
    "La société a pour objet, en République Démocratique du Congo et à l'étranger :",
  items: [
    "les technologies, la transformation numérique, la conception et le développement de logiciels, de progiciels, de plateformes numériques et de services informatiques ;",
    "le transport, la logistique et les services de gestion des chaînes d'approvisionnement ;",
    "l'industrie, la production, l'ingénierie, l'innovation et le développement de solutions destinées aux secteurs productifs ;",
    "l'énergie et le développement de solutions, services et innovations dans le domaine énergétique ;",
    "les médias, la communication, l'audiovisuel, l'édition, la création de contenus et les industries créatives ;",
    "l'éducation, la formation, le développement des compétences et le renforcement des capacités ;",
    "le conseil stratégique, l'organisation, la gestion et les services professionnels, dans le respect de la réglementation en vigueur ;",
    "l'accompagnement des entreprises, des organisations et des institutions dans leurs démarches administratives, réglementaires, de conformité et de gouvernance ;",
    "les sports, la culture, l'organisation, la production et la promotion d'événements sportifs, culturels, artistiques et professionnels ;",
    "le commerce, la distribution, le e-commerce, la vente, l'achat, l'importation, l'exportation et la commercialisation de biens, produits et services autorisés par la loi.",
  ],
  closing:
    "La société peut également créer des filiales, prendre des participations dans d'autres sociétés, conclure des partenariats et réaliser toutes opérations commerciales, financières, mobilières ou immobilières se rattachant directement ou indirectement à son objet social ou susceptibles d'en favoriser le développement dans le respect de la législation applicable.",
} as const;

/**
 * Clarifies the structural relationship between legal capacity and brand posture.
 * Used wherever breadth of objet social could be misread as operational substitution.
 */
export const capacityVsPlatformClarification = {
  en: "CLEVONE SARL's corporate purpose defines the legal fields in which the company and its ecosystem may intervene. Strategic vision orients that work; it does not reduce the company to a single activity.",
  fr: "L'objet social de CLEVONE SARL définit les champs juridiques dans lesquels la société et son écosystème peuvent intervenir. La vision stratégique oriente ce travail ; elle ne réduit pas la société à une activité unique.",
} as const;
