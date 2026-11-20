import {
  company,
  companyAddressLinesEn,
  companyAddressLinesFr,
  companyBrandStatementEn,
  companyBrandStatementFr,
} from "@/lib/constants/company";
import {
  objetSocialLegalEn,
  objetSocialLegalFr,
} from "@/lib/constants/corporate-purpose";
import type { LocalizedPageContent, PageMeta } from "./types";

export type LegalPageContent = {
  meta: PageMeta;
  eyebrow: string;
  title: string;
  introduction: readonly string[];
  identity: {
    title: string;
    facts: readonly { label: string; value: string }[];
    addressLabel: string;
    addressLines: readonly string[];
    /**
     * Directeur de la publication — décision propriétaire D1 en attente.
     * Laisser `undefined` : rien n'est rendu tant que D1 n'est pas tranchée.
     */
    publicationDirector?: { label: string; value: string };
  };
  corporatePurpose: { title: string; intro: string; items: readonly string[]; closing: string };
  contact: {
    title: string;
    text: string;
    email: string;
    phone: string;
    phoneLabel: string;
    location: string;
  };
};

const email = company.email.display;

export const legalPageContent = {
  fr: {
    meta: {
      title: "Mentions légales",
      description:
        "Mentions légales de CLEVONE SARL : éditeur du site, identification officielle, objet social et coordonnées.",
    },
    eyebrow: "Légal",
    title: "Mentions légales",
    introduction: [
      `Le site ${company.website} est édité par ${company.legalName}, ${company.legalForm.fr} régie par l'Acte uniforme OHADA relatif au droit des sociétés commerciales et du GIE (AUSCGIE), immatriculée en République Démocratique du Congo, dont le siège social est à Kisangani.`,
      companyBrandStatementFr,
    ],
    identity: {
      title: "Identification de l'éditeur",
      facts: [
        { label: "Raison sociale", value: company.legalName },
        { label: "Marque publique", value: company.brandName },
        { label: "Forme juridique", value: company.legalForm.fr },
        { label: company.rccmLabel, value: company.rccm },
        { label: company.nationalIdLabel, value: company.nationalId },
        { label: "Date d'immatriculation", value: company.incorporationDateDisplay },
        { label: company.inppLabel, value: company.inpp },
        { label: company.onemLabel, value: company.onem },
        { label: "Durée", value: company.duration.fr },
        { label: "Exercice social", value: company.fiscalYear.fr },
      ],
      addressLabel: "Siège social",
      addressLines: companyAddressLinesFr,
    },
    corporatePurpose: {
      title: "Objet social (résumé des statuts, art. 3)",
      intro: objetSocialLegalFr.intro,
      items: objetSocialLegalFr.items,
      closing: objetSocialLegalFr.closing,
    },
    contact: {
      title: "Contact",
      text: "Pour toute question relative à ce site, veuillez nous contacter :",
      email,
      phone: company.phone.display,
      phoneLabel: "Tél.",
      location: company.address.shortFr,
    },
  },
  en: {
    meta: {
      title: "Legal notice",
      description:
        "CLEVONE SARL legal notice: site publisher, official identification, corporate purpose, and contact details.",
    },
    eyebrow: "Legal",
    title: "Legal notice",
    introduction: [
      `The website ${company.website} is published by ${company.legalName}, a ${company.legalForm.en} governed by the OHADA Uniform Act on commercial companies (AUSCGIE), registered in the Democratic Republic of the Congo, with its registered office in Kisangani.`,
      companyBrandStatementEn,
    ],
    identity: {
      title: "Publisher identification",
      facts: [
        { label: "Legal name", value: company.legalName },
        { label: "Public brand", value: company.brandName },
        { label: "Legal form", value: company.legalForm.en },
        { label: company.rccmLabel, value: company.rccm },
        { label: company.nationalIdLabel, value: company.nationalId },
        { label: "Registration date", value: company.incorporationDateDisplay },
        { label: company.inppLabel, value: company.inpp },
        { label: company.onemLabel, value: company.onem },
        { label: "Duration", value: company.duration.en },
        { label: "Financial year", value: company.fiscalYear.en },
      ],
      addressLabel: "Registered office",
      addressLines: companyAddressLinesEn,
    },
    corporatePurpose: {
      title: "Corporate purpose (summary of statutes, art. 3)",
      intro: objetSocialLegalEn.intro,
      items: objetSocialLegalEn.items,
      closing: objetSocialLegalEn.closing,
    },
    contact: {
      title: "Contact",
      text: "For any question relating to this website, please contact us:",
      email,
      phone: company.phone.display,
      phoneLabel: "Tel",
      location: company.address.shortEn,
    },
  },
} as const satisfies LocalizedPageContent<LegalPageContent>;
