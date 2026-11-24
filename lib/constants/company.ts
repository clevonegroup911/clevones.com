/**
 * Official public identity of CLEVONE SARL.
 * Single source of truth for legal, contact, and registered-office data
 * shown on the institutional website. Do not add personal data of
 * associates or directors here.
 */

export const company = {
  brandName: "CLEVONES",
  legalName: "CLEVONE SARL",
  legalForm: {
    en: "Limited liability company (multi-member SARL)",
    fr: "Société à responsabilité limitée pluripersonnelle (SARL)",
  },
  rccm: "CD/KIS/RCCM/26-B-00235",
  rccmLabel: "RCCM",
  nationalId: "25-G4701-N10030B/II",
  nationalIdLabel: "ID Nat.",
  incorporationDateIso: "2026-08-17",
  incorporationDateDisplay: "17/08/2026",
  inpp: "00001,70",
  inppLabel: "INPP",
  onem: "060899A26",
  onemLabel: "ONEM",
  duration: {
    fr: "99 ans à compter de l'immatriculation",
    en: "99 years from registration",
  },
  fiscalYear: {
    fr: "du 1er janvier au 31 décembre",
    en: "1 January to 31 December",
  },
  address: {
    number: "N° 05",
    street: "5e Avenue des Musiciens",
    commune: "Commune de Makiso",
    city: "Kisangani",
    provinceFr: "Province de la Tshopo",
    provinceEn: "Tshopo Province",
    region: "Tshopo",
    countryFr: "République Démocratique du Congo",
    countryEn: "Democratic Republic of the Congo",
    countryCode: "CD",
    shortFr: "Kisangani, RDC",
    shortEn: "Kisangani, DRC",
  },
  phone: {
    display: "+243 828 320 130",
    href: "tel:+243828320130",
  },
  email: {
    display: "contact@clevones.com",
    href: "mailto:contact@clevones.com",
  },
  website: "https://clevones.com",
  strategicVision: "Governance Architecture for Territorial Economic Flows",
  strategicVisionFr: "Architecture de gouvernance des flux économiques territoriaux",
} as const;

/** Primary public definition of the company — not a single-activity slogan. */
/** Activity list shared by the company definition and the home subtitle. */
export const companyActivitiesFr =
  "technologie et logiciels, commerce et distribution, logistique, industrie, énergie, médias, éducation, conseil et événementiel" as const;
export const companyActivitiesEn =
  "technology and software, trade and distribution, logistics, industry, energy, media, education, advisory and events" as const;

export const companyDefinitionFr =
  `CLEVONE SARL est une société commerciale congolaise multisectorielle : ${companyActivitiesFr}.` as const;

export const companyDefinitionEn =
  `CLEVONE SARL is a Congolese multi-sector commercial company: ${companyActivitiesEn}.` as const;

/** Brand vs legal entity — the statutes institute no acronym. */
export const companyBrandStatementFr =
  `${company.brandName} est la marque et le nom de domaine exploités par ${company.legalName}.` as const;

export const companyBrandStatementEn =
  `${company.brandName} is the brand and domain name operated by ${company.legalName}.` as const;

/** Visible legal-existence line (footer of every page, contact, about). */
export const companyRegistrationLine =
  `${company.legalName} · ${company.rccmLabel} ${company.rccm} · ${company.nationalIdLabel} ${company.nationalId}` as const;

export const companyStreetLine = `${company.address.number}, ${company.address.street}` as const;

export const companyAddressLinesFr = [
  companyStreetLine,
  company.address.commune,
  `Ville de ${company.address.city}`,
  company.address.provinceFr,
  company.address.countryFr,
] as const;

export const companyAddressLinesEn = [
  companyStreetLine,
  company.address.commune,
  `${company.address.city}`,
  company.address.provinceEn,
  company.address.countryEn,
] as const;

/** One-line registered office (FR / EN). */
export const companyAddressInlineFr = companyAddressLinesFr.join(", ");
export const companyAddressInlineEn = companyAddressLinesEn.join(", ");

/** JSON-LD streetAddress: « N° 05, 5e Avenue des Musiciens, Commune de Makiso ». */
export const companyStreetAddress = `${companyStreetLine}, ${company.address.commune}` as const;
