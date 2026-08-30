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
  shareCapital: "460 000 CDF",
  address: {
    street: "5e Avenue des Musiciens",
    commune: "Commune de Makiso",
    city: "Kisangani",
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
export const companyDefinitionFr =
  "CLEVONE SARL est une entreprise congolaise multisectorielle qui développe des solutions technologiques, numériques, commerciales, logistiques, institutionnelles, médiatiques, éducatives et de conseil." as const;

export const companyDefinitionEn =
  "CLEVONE SARL is a Congolese multi-sector company that develops technological, digital, commercial, logistics, institutional, media, educational and advisory solutions." as const;

export const companyAddressLinesFr = [
  company.address.street,
  company.address.commune,
  `Ville de ${company.address.city}`,
  company.address.countryFr,
] as const;

export const companyAddressLinesEn = [
  company.address.street,
  company.address.commune,
  `${company.address.city}`,
  company.address.countryEn,
] as const;

export const companyStreetAddress = `${company.address.street}, ${company.address.commune}` as const;
