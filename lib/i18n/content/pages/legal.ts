import type { LocalizedPageContent, PageMeta } from "./types";

export type LegalPageContent = {
  meta: PageMeta;
  eyebrow: string;
  title: string;
  introduction: readonly string[];
  corporatePurpose: { title: string; intro: string; items: readonly string[]; closing: string };
  contact: { title: string; text: string; email: string };
};

const email = "contact@clevones.com";

export const legalPageContent = {
  fr: {
    meta: { title: "Mentions légales", description: "Mentions légales de Clevones : éditeur du site, objet social officiel, plateforme de gouvernance des flux économiques territoriaux, et coordonnées de contact." },
    eyebrow: "Légal",
    title: "Mentions légales",
    introduction: [
      "Le site https://clevones.com est édité par Clevones, société intervenant en République Démocratique du Congo et à l'étranger. Clevones conçoit, structure et coordonne des architectures de flux économiques territoriaux.",
      "L'objet social de Clevones définit les champs juridiques dans lesquels la société et son écosystème peuvent intervenir. La plateforme de gouvernance Clevones demeure une couche neutre d'architecture, de structuration et de coordination — et non un opérateur, un négociant, un exploitant de ressources ou un facilitateur informel.",
    ],
    corporatePurpose: {
      title: "Objet social",
      intro: "La société a pour objet, en République Démocratique du Congo et à l'étranger :",
      items: ["les technologies, la transformation numérique, le développement de logiciels, de solutions numériques et de services technologiques ;", "le transport, la logistique et les services de gestion des chaînes d'approvisionnement ;", "l'industrie, la production, l'innovation et le développement de solutions destinées aux secteurs productifs ;", "l'énergie et le développement de solutions, services et innovations dans le domaine énergétique ;", "les médias, la communication, l'audiovisuel, l'édition, la création de contenus et les industries créatives ;", "l'éducation, la formation, le développement des compétences et le renforcement des capacités ;", "le conseil stratégique, organisationnel, administratif et financier, dans le respect de la réglementation en vigueur ;", "l'accompagnement des entreprises, des organisations et des institutions dans leurs démarches administratives, réglementaires, de conformité et de gouvernance ;", "les sports, la culture, l'organisation, la production et la promotion d'événements sportifs, culturels, artistiques et professionnels ;", "le commerce, la distribution, la vente, l'achat, l'importation, l'exportation et la commercialisation de biens, produits et services autorisés par la loi."],
      closing: "La société peut également créer des filiales, prendre des participations dans d'autres sociétés, conclure des partenariats et réaliser toutes opérations commerciales, financières, mobilières ou immobilières se rattachant directement ou indirectement à son objet social ou susceptibles d'en favoriser le développement dans le respect de la législation applicable.",
    },
    contact: { title: "Contact", text: "Pour toute question relative à ce site, veuillez nous contacter à l'adresse", email },
  },
  en: {
    meta: { title: "Legal notice", description: "Clevones legal notice: site publisher, official corporate purpose, territorial economic flow governance platform, and contact details." },
    eyebrow: "Legal",
    title: "Legal notice",
    introduction: [
      "The website https://clevones.com is published by Clevones, a company operating in the Democratic Republic of Congo and abroad. Clevones designs, structures, and coordinates architectures of territorial economic flows.",
      "Clevones' corporate purpose defines the legal fields in which the company and its ecosystem may intervene. The Clevones governance platform remains a neutral architecture, structuring, and coordination layer — not an operator, trader, resource exploiter, or informal broker.",
    ],
    corporatePurpose: {
      title: "Corporate purpose",
      intro: "The company has the following corporate purpose in the Democratic Republic of Congo and abroad:",
      items: ["technology, digital transformation, and the development of software, digital solutions, and technology services;", "transport, logistics, and supply-chain management services;", "industry, production, innovation, and the development of solutions for productive sectors;", "energy and the development of solutions, services, and innovations in the energy sector;", "media, communication, audiovisual production, publishing, content creation, and creative industries;", "education, training, skills development, and capacity building;", "strategic, organizational, administrative, and financial advisory, in compliance with applicable regulations;", "support for companies, organizations, and institutions in their administrative, regulatory, compliance, and governance procedures;", "sports, culture, and the organization, production, and promotion of sports, cultural, artistic, and professional events;", "trade, distribution, sale, purchase, import, export, and marketing of goods, products, and services authorized by law."],
      closing: "The company may also create subsidiaries, take equity participations in other companies, enter into partnerships, and carry out any commercial, financial, movable, or immovable operations directly or indirectly related to its corporate purpose or likely to promote its development, in compliance with applicable law.",
    },
    contact: { title: "Contact", text: "For any question relating to this website, please contact us at", email },
  },
} as const satisfies LocalizedPageContent<LegalPageContent>;
