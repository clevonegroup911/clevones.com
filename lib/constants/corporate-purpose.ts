/**
 * Canonical corporate vision and legal purpose (objet social) for CLEVONE SARL.
 *
 * Vision is a strategic orientation — not the company's unique legal activity.
 * Objet social defines the lawful fields in which the company may intervene.
 */

export const corporateVision = {
  title: "Turn local potential into lasting economic activity",
  titleFr: "Transformer le potentiel local en activité économique durable",
  statement:
    "CLEVONE SARL builds software, trade and service capacity in the DRC so that local potential becomes lasting economic activity. Its advisory line also helps institutions structure multi-party initiatives, with clear roles and documented decisions.",
  statementFr:
    "CLEVONE SARL développe des capacités logicielles, commerciales et de services en RDC pour que le potentiel local devienne une activité économique durable. Sa ligne conseil aide aussi les institutions à structurer des initiatives multi-acteurs, avec des rôles clairs et des décisions documentées.",
} as const;

export const corporateMission = {
  title: "Build digital, commercial and institutional infrastructure for Africa",
  titleFr: "Construire les infrastructures numériques, commerciales et institutionnelles de l'Afrique",
  statement:
    "CLEVONE SARL is a Congolese multi-sector company based in Kisangani. It develops and sells software and digital services, trades and distributes goods, and works in logistics, industry, energy, media, education, advisory and events — for businesses, institutions and partners in the DRC and across Africa.",
  statementFr:
    "CLEVONE SARL est une société congolaise multisectorielle basée à Kisangani. Elle développe et vend des logiciels et services numériques, fait du commerce et de la distribution, et intervient en logistique, industrie, énergie, médias, éducation, conseil et événementiel — pour les entreprises, les institutions et les partenaires en RDC et en Afrique.",
} as const;

/**
 * Strategic framing: objet social domains are lawful fields of a multi-sector
 * company. The strategic vision orients how those fields are structured; it
 * does not replace them as the unique legal activity.
 */
export const domainsFraming = {
  eyebrow: "Fields of activity",
  eyebrowFr: "Domaines d'activité",
  title: "Nine fields of activity, set by our statutes",
  titleFr: "Neuf domaines d'activité, fixés par nos statuts",
  description:
    "CLEVONE SARL's corporate purpose (statutes, art. 3) sets nine fields of activity. The company works in them with its own products and services, or with partners. Regulated activities are carried out only once the required authorizations are obtained.",
  descriptionFr:
    "L'objet social de CLEVONE SARL (statuts, art. 3) fixe neuf domaines d'activité. La société y intervient avec ses propres produits et services, ou avec des partenaires. Les activités réglementées ne sont exercées qu'après obtention des autorisations requises.",
} as const;

export type InterventionDomain = {
  id: string;
  /** Point of the objet social (statuts, art. 3) this domain reflects. */
  statutePoint: number;
  title: string;
  titleFr: string;
  /** What CLEVONE SARL does in this field, stated plainly. */
  architectureRole: string;
  architectureRoleFr: string;
  /** Short card line (solutions page). */
  summary: string;
  summaryFr: string;
  /** Regulatory caveat — statuts, art. 3: authorization before exercise. */
  regulatoryNote?: string;
  regulatoryNoteFr?: string;
  /** Public ecosystem surfaces that already embody this domain, when applicable. */
  ecosystemLink?: string;
};

export const regulatoryNote = {
  authorizations: {
    en: "subject to the required authorizations",
    fr: "sous réserve des autorisations requises",
  },
  approvals: {
    en: "subject to the required approvals",
    fr: "sous réserve des agréments requis",
  },
  regulatedProfessions: {
    en: "excluding activities reserved to regulated professions",
    fr: "hors activités réservées aux professions réglementées",
  },
} as const;

/** Points 1 to 9 of the objet social (statuts, art. 3). Points 10–11 are corporate capacities, see objetSocialLegal*. */
export const interventionDomains: readonly InterventionDomain[] = [
  {
    id: "technology",
    statutePoint: 1,
    title: "Technology & software",
    titleFr: "Technologies et logiciels",
    architectureRole:
      "Design, development, integration, operation, maintenance and sale of software, applications, platforms, digital services and IT infrastructure.",
    architectureRoleFr:
      "Conception, développement, intégration, exploitation, maintenance et commercialisation de logiciels, applications, plateformes, services numériques et infrastructures informatiques.",
    summary: "Software, platforms and digital services — including CLEVONE DMS.",
    summaryFr: "Logiciels, plateformes et services numériques — dont CLEVONE DMS.",
    ecosystemLink: "CLEVONE DMS · CLEVONET",
  },
  {
    id: "logistics",
    statutePoint: 2,
    title: "Transport & logistics",
    titleFr: "Transport et logistique",
    architectureRole:
      "Transport, logistics, handling, supply chains and flow coordination, subject to the required authorizations.",
    architectureRoleFr:
      "Transport, logistique, manutention, chaînes d'approvisionnement et coordination des flux, sous réserve des autorisations requises.",
    summary: "Transport, handling and supply chains.",
    summaryFr: "Transport, manutention et chaînes d'approvisionnement.",
    regulatoryNote: regulatoryNote.authorizations.en,
    regulatoryNoteFr: regulatoryNote.authorizations.fr,
  },
  {
    id: "industry",
    statutePoint: 3,
    title: "Industry & production",
    titleFr: "Industrie et production",
    architectureRole:
      "Production, processing, engineering and development of products and services for productive sectors.",
    architectureRoleFr:
      "Production, transformation, ingénierie et développement de produits et services pour les secteurs productifs.",
    summary: "Production, processing and engineering for productive sectors.",
    summaryFr: "Production, transformation et ingénierie pour les secteurs productifs.",
  },
  {
    id: "energy",
    statutePoint: 4,
    title: "Energy",
    titleFr: "Énergie",
    architectureRole:
      "Energy solutions and equipment, energy efficiency and renewables, subject to the required approvals.",
    architectureRoleFr:
      "Solutions et équipements énergétiques, efficacité énergétique et renouvelables, sous réserve des agréments requis.",
    summary: "Energy equipment, efficiency and renewables.",
    summaryFr: "Équipements énergétiques, efficacité et renouvelables.",
    regulatoryNote: regulatoryNote.approvals.en,
    regulatoryNoteFr: regulatoryNote.approvals.fr,
  },
  {
    id: "media",
    statutePoint: 5,
    title: "Media & communication",
    titleFr: "Médias et communication",
    architectureRole:
      "Communication, audiovisual, publishing, content production and distribution, creative industries.",
    architectureRoleFr:
      "Communication, audiovisuel, édition, production et diffusion de contenus, industries créatives.",
    summary: "Communication, audiovisual, publishing and content.",
    summaryFr: "Communication, audiovisuel, édition et contenus.",
    ecosystemLink: "CLEVODIA",
  },
  {
    id: "education",
    statutePoint: 6,
    title: "Education & training",
    titleFr: "Éducation et formation",
    architectureRole:
      "Education, vocational training, skills, applied research, scientific documentation and capacity building.",
    architectureRoleFr:
      "Éducation, formation professionnelle, compétences, recherche appliquée, documentation scientifique et renforcement des capacités.",
    summary: "Vocational training, skills and scientific documentation.",
    summaryFr: "Formation professionnelle, compétences et documentation scientifique.",
    ecosystemLink: "Btlearn · BICUNI",
  },
  {
    id: "advisory",
    statutePoint: 7,
    title: "Advisory & governance",
    titleFr: "Conseil et gouvernance",
    architectureRole:
      "Strategic, organizational, administrative and financial advisory; compliance, governance, transformation and project management support, excluding activities reserved to regulated professions.",
    architectureRoleFr:
      "Conseil stratégique, organisationnel, administratif et financier ; accompagnement en conformité, gouvernance, transformation et gestion de projets, hors activités réservées aux professions réglementées.",
    summary: "Strategy, compliance, governance and project management.",
    summaryFr: "Stratégie, conformité, gouvernance et gestion de projets.",
    regulatoryNote: regulatoryNote.regulatedProfessions.en,
    regulatoryNoteFr: regulatoryNote.regulatedProfessions.fr,
  },
  {
    id: "events",
    statutePoint: 8,
    title: "Sports, culture & events",
    titleFr: "Sports, culture et événementiel",
    architectureRole:
      "Organization, production, management and promotion of sporting, cultural, artistic and professional events.",
    architectureRoleFr:
      "Organisation, production, gestion et promotion d'événements sportifs, culturels, artistiques et professionnels.",
    summary: "Sporting, cultural and professional events.",
    summaryFr: "Événements sportifs, culturels et professionnels.",
  },
  {
    id: "commerce",
    statutePoint: 9,
    title: "Trade & distribution",
    titleFr: "Commerce et distribution",
    architectureRole:
      "General trade, distribution, purchase, sale, commercial representation and import-export of lawful goods, products and services.",
    architectureRoleFr:
      "Commerce général, distribution, achat, vente, représentation commerciale et import-export de biens, produits et services licites.",
    summary: "General trade, distribution and import-export.",
    summaryFr: "Commerce général, distribution et import-export.",
  },
] as const;

export const corporateDevelopmentClause = {
  title: "Subsidiaries, partnerships, and related operations",
  statement:
    "CLEVONE SARL may create or acquire participations, subsidiaries, branches and joint ventures, and enter into partnerships, representation, subcontracting, cooperation and commercial agreements related to its corporate purpose, in accordance with applicable law.",
  statementFr:
    "CLEVONE SARL peut créer ou acquérir des participations, filiales, succursales et joint-ventures, et conclure des partenariats, représentations, sous-traitances, coopérations et conventions commerciales liés à son objet social, dans le respect de la législation applicable.",
} as const;

/** Objet social summary (statuts, art. 3) for the legal notice — 11 points. */
export const objetSocialLegalFr = {
  intro:
    "CLEVONE SARL a pour objet, en République Démocratique du Congo et à l'étranger :",
  items: [
    "les technologies et la transformation numérique : conception, développement, intégration, exploitation, maintenance et commercialisation de logiciels, applications, plateformes, services numériques, solutions informatiques, infrastructures et services technologiques ;",
    "le transport, la logistique, la manutention, les chaînes d'approvisionnement, la coordination des flux et les services connexes, sous réserve des autorisations requises ;",
    "l'industrie, la production, la transformation, l'innovation, l'ingénierie de solutions et le développement de produits et services pour les secteurs productifs ;",
    "l'énergie, les solutions et équipements énergétiques, l'efficacité énergétique et les énergies renouvelables, sous réserve des agréments requis ;",
    "les médias, la communication, l'audiovisuel, l'édition, la production et la diffusion de contenus, les industries créatives ;",
    "l'éducation, la formation professionnelle, les compétences, la recherche appliquée, la documentation scientifique et le renforcement des capacités ;",
    "le conseil stratégique, organisationnel, administratif et financier ; l'accompagnement en conformité, gouvernance, transformation et gestion de projets, hors activités réservées aux professions réglementées ;",
    "les sports et la culture : organisation, production, gestion et promotion d'événements sportifs, culturels, artistiques et professionnels ;",
    "le commerce général, la distribution, l'achat, la vente, la représentation commerciale et l'import-export de biens, produits et services licites ;",
    "la création, l'acquisition et la gestion de participations, filiales, succursales et joint-ventures ;",
    "les partenariats, la représentation, la sous-traitance, la coopération et les conventions commerciales.",
  ],
  closing:
    "Toute activité soumise à autorisation ne peut être exercée qu'après obtention des autorisations requises (statuts, art. 3). Activité principale déclarée au RCCM : commerce de détail.",
} as const;

export const objetSocialLegalEn = {
  intro:
    "CLEVONE SARL's corporate purpose, in the Democratic Republic of the Congo and abroad, covers:",
  items: [
    "technology and digital transformation: design, development, integration, operation, maintenance and sale of software, applications, platforms, digital services, IT solutions, infrastructure and technology services;",
    "transport, logistics, handling, supply chains, flow coordination and related services, subject to the required authorizations;",
    "industry, production, processing, innovation, solution engineering and development of products and services for productive sectors;",
    "energy, energy solutions and equipment, energy efficiency and renewables, subject to the required approvals;",
    "media, communication, audiovisual, publishing, content production and distribution, creative industries;",
    "education, vocational training, skills, applied research, scientific documentation and capacity building;",
    "strategic, organizational, administrative and financial advisory; compliance, governance, transformation and project management support, excluding activities reserved to regulated professions;",
    "sports and culture: organization, production, management and promotion of sporting, cultural, artistic and professional events;",
    "general trade, distribution, purchase, sale, commercial representation and import-export of lawful goods, products and services;",
    "creation, acquisition and management of participations, subsidiaries, branches and joint ventures;",
    "partnerships, representation, subcontracting, cooperation and commercial agreements.",
  ],
  closing:
    "Any activity subject to authorization may only be carried out once the required authorizations have been obtained (statutes, art. 3). Main activity declared to the RCCM: retail trade.",
} as const;

/**
 * Clarifies the structural relationship between legal capacity and brand posture.
 * Used wherever breadth of objet social could be misread as operational substitution.
 */
export const capacityVsPlatformClarification = {
  en: "CLEVONE SARL's corporate purpose (statutes, art. 3) sets the fields in which the company develops, sells and operates products and services. Activities subject to authorization are carried out only once the required authorizations are obtained.",
  fr: "L'objet social de CLEVONE SARL (statuts, art. 3) fixe les domaines dans lesquels la société développe, vend et exploite des produits et services. Les activités soumises à autorisation ne sont exercées qu'après obtention des autorisations requises.",
} as const;
