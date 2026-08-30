import { company } from "@/lib/constants/company";
import { objetSocialLegalFr } from "@/lib/constants/corporate-purpose";
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
      `Le site ${company.website} est édité par ${company.legalName}, ${company.legalForm.fr}, immatriculée en République Démocratique du Congo, dont le siège social est à Kisangani.`,
      "L'objet social définit les champs juridiques dans lesquels la société et son écosystème peuvent intervenir. La vision stratégique oriente ce travail ; elle ne réduit pas la société à une activité unique.",
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
        { label: "Capital social", value: company.shareCapital },
      ],
      addressLabel: "Siège social",
      addressLines: [
        company.address.street,
        company.address.commune,
        `Ville de ${company.address.city}`,
        company.address.countryFr,
      ],
    },
    corporatePurpose: {
      title: "Objet social",
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
      `The website ${company.website} is published by ${company.legalName}, a ${company.legalForm.en}, incorporated in the Democratic Republic of the Congo, with its registered office in Kisangani.`,
      "The corporate purpose defines the legal fields in which the company and its ecosystem may intervene. Strategic vision orients that work; it does not reduce the company to a single activity.",
    ],
    identity: {
      title: "Publisher identification",
      facts: [
        { label: "Legal name", value: company.legalName },
        { label: "Public brand", value: company.brandName },
        { label: "Legal form", value: company.legalForm.en },
        { label: company.rccmLabel, value: company.rccm },
        { label: company.nationalIdLabel, value: company.nationalId },
        { label: "Incorporation date", value: company.incorporationDateDisplay },
        { label: "Share capital", value: company.shareCapital },
      ],
      addressLabel: "Registered office",
      addressLines: [
        company.address.street,
        company.address.commune,
        company.address.city,
        company.address.countryEn,
      ],
    },
    corporatePurpose: {
      title: "Corporate purpose",
      intro: "The company has the following corporate purpose in the Democratic Republic of Congo and abroad:",
      items: [
        "technology, digital transformation, and the design and development of software, business applications, digital platforms, and IT services;",
        "transport, logistics, and supply-chain management services;",
        "industry, production, engineering, innovation, and the development of solutions for productive sectors;",
        "energy and the development of solutions, services, and innovations in the energy sector;",
        "media, communication, audiovisual production, publishing, content creation, and creative industries;",
        "education, training, skills development, and capacity building;",
        "strategic advisory, organization, management, and professional services, in compliance with applicable regulations;",
        "support for companies, organizations, and institutions in their administrative, regulatory, compliance, and governance procedures;",
        "sports, culture, and the organization, production, and promotion of sports, cultural, artistic, and professional events;",
        "trade, distribution, e-commerce, sale, purchase, import, export, and marketing of goods, products, and services authorized by law.",
      ],
      closing:
        "The company may also create subsidiaries, take equity participations in other companies, enter into partnerships, and carry out any commercial, financial, movable, or immovable operations directly or indirectly related to its corporate purpose or likely to promote its development, in compliance with applicable law.",
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
