import type { CtaContent, HeroContent, LocalizedPageContent, PageMeta } from "./types";

export type FaqPageContent = {
  meta: PageMeta;
  hero: HeroContent;
  items: readonly { question: string; answer: string }[];
  cta: CtaContent;
};

export const faqPageContent = {
  en: {
    meta: { title: "FAQ", description: "Answers about CLEVONE SARL: activities, products, corporate purpose, coordination missions and how to get in touch." },
    hero: {
      eyebrow: "FAQ",
      title: "Clear answers. No jargon.",
      subtitle: "Activities, products, corporate purpose and how to reach us — explained directly.",
    },
    items: [
      {
        question: "What is CLEVONES / CLEVONE SARL?",
        answer: "CLEVONE SARL is a Congolese multi-sector commercial company based in Kisangani (RCCM CD/KIS/RCCM/26-B-00235). CLEVONES is the brand and domain name it operates.",
      },
      {
        question: "Does CLEVONE sell products and services?",
        answer: "Yes. Its corporate purpose covers developing, selling and operating software and digital services, as well as general trade, distribution and import-export. The main activity declared to the RCCM is retail trade. CLEVONE DMS is its featured software product.",
      },
      {
        question: "What is the corporate purpose (objet social)?",
        answer: "Technology and software, transport and logistics, industry, energy, media, education, advisory, sports and events, and trade and distribution — plus participations and partnerships. Regulated activities are carried out only once the required authorizations are obtained.",
      },
      {
        question: "Then what does “neutrality” mean?",
        answer: "It is a conflict-of-interest rule for coordination missions only. When CLEVONE coordinates a multi-party initiative, it is not also the operator, trader or paid intermediary of that initiative; any operational role of another CLEVONE activity is declared in advance and kept separate.",
      },
      {
        question: "What is CLEVONE DMS?",
        answer: "A management software for businesses: sales, customers, stock, suppliers, expenses, invoices, documents, dashboards, reports, user access and cloud sync. Ask for a quote to check availability for your organization.",
      },
      {
        question: "How does the ecosystem relate to the company?",
        answer: "The ecosystem groups CLEVONE SARL's activity lines and projects (CLEVONE DMS, CLEVONET, CLEVODIA, BICUNI, Btlearn…). No separate legal registration is claimed on this site except for CLEVONE SARL.",
      },
      {
        question: "Who can contact CLEVONE?",
        answer: "Businesses and organizations interested in a product or service, and institutions, funders or partners carrying a multi-party initiative. Coordination missions follow documented criteria: legitimacy, compliance readiness and long-term value.",
      },
      {
        question: "How do I get started?",
        answer: "Use the contact form: choose “Product inquiry / quote” for a product or service, or one of the initiative options for a coordination mission.",
      },
    ],
    cta: {
      title: "Ready to talk?",
      description: "A product question, a quote or an initiative: start with the contact form.",
      actions: [{ href: "/contact", label: "Contact CLEVONE" }],
    },
  },
  fr: {
    meta: { title: "FAQ", description: "Réponses sur CLEVONE SARL : activités, produits, objet social, missions de coordination et prise de contact." },
    hero: {
      eyebrow: "FAQ",
      title: "Des réponses claires. Sans jargon.",
      subtitle: "Activités, produits, objet social et prise de contact — expliqués directement.",
    },
    items: [
      {
        question: "Qu'est-ce que CLEVONES / CLEVONE SARL ?",
        answer: "CLEVONE SARL est une société commerciale congolaise multisectorielle basée à Kisangani (RCCM CD/KIS/RCCM/26-B-00235). CLEVONES est la marque et le nom de domaine qu'elle exploite.",
      },
      {
        question: "CLEVONE vend-elle des produits et services ?",
        answer: "Oui. Son objet social couvre le développement, la vente et l'exploitation de logiciels et services numériques, ainsi que le commerce général, la distribution et l'import-export. L'activité principale déclarée au RCCM est le commerce de détail. CLEVONE DMS est son logiciel phare.",
      },
      {
        question: "Quel est l'objet social ?",
        answer: "Technologie et logiciels, transport et logistique, industrie, énergie, médias, éducation, conseil, sports et événementiel, commerce et distribution — plus participations et partenariats. Les activités réglementées ne sont exercées qu'après obtention des autorisations requises.",
      },
      {
        question: "Que signifie alors « neutralité » ?",
        answer: "C'est une règle de conflit d'intérêts propre aux missions de coordination. Quand CLEVONE coordonne une initiative multi-acteurs, elle n'en est pas en même temps l'opérateur, le négociant ou l'intermédiaire rémunéré ; tout rôle opérationnel d'une autre activité de CLEVONE est déclaré à l'avance et séparé.",
      },
      {
        question: "Qu'est-ce que CLEVONE DMS ?",
        answer: "Un logiciel de gestion pour entreprises : ventes, clients, stocks, fournisseurs, dépenses, factures, documents, tableaux de bord, rapports, accès utilisateurs et synchronisation cloud. Demandez un devis pour vérifier sa disponibilité pour votre organisation.",
      },
      {
        question: "Quel lien entre l'écosystème et la société ?",
        answer: "L'écosystème regroupe les lignes d'activité et projets de CLEVONE SARL (CLEVONE DMS, CLEVONET, CLEVODIA, BICUNI, Btlearn…). Aucune immatriculation juridique distincte n'est affirmée sur ce site, hormis celle de CLEVONE SARL.",
      },
      {
        question: "Qui peut contacter CLEVONE ?",
        answer: "Les entreprises et organisations intéressées par un produit ou un service, et les institutions, financeurs ou partenaires porteurs d'une initiative multi-acteurs. Les missions de coordination suivent des critères documentés : légitimité, préparation à la conformité et valeur de long terme.",
      },
      {
        question: "Comment commencer ?",
        answer: "Utilisez le formulaire de contact : choisissez « Demande produit / devis » pour un produit ou un service, ou l'une des options initiative pour une mission de coordination.",
      },
    ],
    cta: {
      title: "Prêt à échanger ?",
      description: "Une question produit, un devis ou une initiative : commencez par le formulaire de contact.",
      actions: [{ href: "/collaboration", label: "Contacter CLEVONE" }],
    },
  },
} as const satisfies LocalizedPageContent<FaqPageContent>;
