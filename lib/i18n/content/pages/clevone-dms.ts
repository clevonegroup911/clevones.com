import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
} from "./types";

export type DmsFunctionItem = {
  name: string;
  description: string;
};

export type ClevoneDmsPageContent = {
  meta: PageMeta;
  hero: HeroContent & {
    type: string;
    positioning: string;
  };
  overview: SectionHeadingContent & { paragraphs: readonly string[] };
  capabilities: SectionHeadingContent & {
    items: readonly DmsFunctionItem[];
    note: string;
  };
  audience: SectionHeadingContent & {
    items: readonly { title: string; description: string }[];
  };
  cta: CtaContent;
};

const dmsFunctionsEn: readonly DmsFunctionItem[] = [
  { name: "Sales", description: "Structure commercial activity and follow opportunities through a governed pipeline." },
  { name: "Customers", description: "Maintain a single customer record for commercial and operational follow-up." },
  { name: "Inventory", description: "Track stock movements and availability as part of daily operations." },
  { name: "Suppliers", description: "Record supplier relationships and purchasing context." },
  { name: "Expenses", description: "Capture and classify operating expenses for financial visibility." },
  { name: "Revenue", description: "Follow incoming revenue against commercial activity." },
  { name: "Invoices", description: "Issue and archive invoices in a documented commercial record." },
  { name: "Documents", description: "Store and retrieve business documents alongside operational records." },
  { name: "Dashboards", description: "Give leadership a readable view of commercial and operational indicators." },
  { name: "Reports", description: "Produce structured reports for review, audit, and decision-making." },
  { name: "Users & Permissions", description: "Control access by role so teams work within defined rights." },
  { name: "Cloud Synchronization", description: "Keep records aligned across connected environments." },
];

const dmsFunctionsFr: readonly DmsFunctionItem[] = [
  { name: "Ventes", description: "Structurer l'activité commerciale et suivre les opportunités dans un pipeline gouverné." },
  { name: "Clients", description: "Tenir une fiche client unique pour le suivi commercial et opérationnel." },
  { name: "Stocks", description: "Suivre les mouvements de stock et les disponibilités au quotidien." },
  { name: "Fournisseurs", description: "Enregistrer les relations fournisseurs et le contexte d'achat." },
  { name: "Dépenses", description: "Saisir et classer les charges d'exploitation pour une visibilité financière." },
  { name: "Recettes", description: "Suivre les recettes au regard de l'activité commerciale." },
  { name: "Factures", description: "Émettre et archiver les factures dans un dossier commercial documenté." },
  { name: "Documents", description: "Conserver et retrouver les documents d'entreprise aux côtés des dossiers opérationnels." },
  { name: "Tableaux de bord", description: "Offrir à la direction une lecture des indicateurs commerciaux et opérationnels." },
  { name: "Rapports", description: "Produire des rapports structurés pour l'examen, l'audit et la décision." },
  { name: "Utilisateurs et permissions", description: "Contrôler les accès par rôle afin que les équipes travaillent dans des droits définis." },
  { name: "Synchronisation cloud", description: "Aligner les dossiers entre environnements connectés." },
];

export const clevoneDmsPageContent = {
  en: {
    meta: {
      title: "CLEVONE DMS",
      description:
        "CLEVONE DMS is a Digital Management System for modern businesses — sales, customers, inventory, invoices, dashboards, and governed access.",
    },
    hero: {
      eyebrow: "Business software",
      title: "CLEVONE DMS",
      type: "Commercial software / Digital Management System",
      positioning: "Digital Management System for modern businesses",
      subtitle:
        "A business management system designed for sales, customers, inventory, finance, documents, and reporting — with governed users and cloud synchronization.",
      tagline: "Capabilities and product roadmap",
    },
    overview: {
      eyebrow: "Product",
      title: "One system for commercial operations",
      description:
        "CLEVONE DMS sits in the CLEVONE SARL technology line — software for organizations that need readable commercial records.",
      paragraphs: [
        "CLEVONE DMS is a Digital Management System: a commercial software product for companies that need structured records across sales, customers, stock, suppliers, expenses, revenue, invoices, and documents.",
        "It is presented here as a product of the CLEVONE ecosystem. Functions listed on this page describe intended capabilities. Delivery follows the product roadmap — this site does not expose a live application backend.",
      ],
    },
    capabilities: {
      eyebrow: "Capabilities",
      title: "Core functions",
      description:
        "The modules below describe the intended scope of CLEVONE DMS.",
      items: dmsFunctionsEn,
      note: "These capabilities describe the product architecture and roadmap. Availability of each module follows product development — they are not a live service catalogue on this website.",
    },
    audience: {
      eyebrow: "Who it is for",
      title: "Modern businesses that need governed records",
      items: [
        {
          title: "Commercial teams",
          description: "Follow customers, sales, and invoices in one structured system.",
        },
        {
          title: "Operations",
          description: "Connect inventory, suppliers, and documents to daily work.",
        },
        {
          title: "Leadership",
          description: "Read dashboards and reports without informal spreadsheets as the source of truth.",
        },
      ],
    },
    cta: {
      title: "Discuss CLEVONE DMS",
      description:
        "Institutions and enterprises may inquire about the product roadmap and intended deployment through official channels.",
      actions: [
        { href: "/contact", label: "Contact CLEVONE" },
        { href: "/solutions", label: "All solutions", variant: "outline" },
      ],
    },
  },
  fr: {
    meta: {
      title: "CLEVONE DMS",
      description:
        "CLEVONE DMS est un progiciel de gestion numérique pour les entreprises modernes — ventes, clients, stocks, factures, tableaux de bord et accès gouvernés.",
    },
    hero: {
      eyebrow: "Progiciel",
      title: "CLEVONE DMS",
      type: "Progiciel de gestion numérique",
      positioning: "Progiciel de gestion numérique pour les entreprises modernes",
      subtitle:
        "Progiciel de gestion numérique pour les entreprises modernes",
      tagline: "Capacités et feuille de route produit",
    },
    overview: {
      eyebrow: "Produit",
      title: "Un système pour les opérations commerciales",
      description:
        "CLEVONE DMS s'inscrit dans la ligne technologique de CLEVONE SARL — un logiciel pour les organisations qui ont besoin de dossiers commerciaux lisibles.",
      paragraphs: [
        "CLEVONE DMS est un progiciel de gestion numérique : un logiciel commercial pour les entreprises qui ont besoin de dossiers structurés sur les ventes, les clients, les stocks, les fournisseurs, les dépenses, les recettes, les factures et les documents.",
        "Il est présenté ici comme un produit de l'écosystème CLEVONE. Les fonctions listées décrivent des capacités visées. La livraison suit la feuille de route produit — ce site n'expose aucun backend applicatif en ligne.",
      ],
    },
    capabilities: {
      eyebrow: "Capacités",
      title: "Fonctions principales",
      description:
        "Les modules ci-dessous décrivent le périmètre visé de CLEVONE DMS.",
      items: dmsFunctionsFr,
      note: "Ces capacités décrivent l'architecture produit et la feuille de route. La disponibilité de chaque module suit le développement — il ne s'agit pas d'un catalogue de services en ligne sur ce site.",
    },
    audience: {
      eyebrow: "Destinataires",
      title: "Des entreprises modernes qui ont besoin de dossiers gouvernés",
      items: [
        {
          title: "Équipes commerciales",
          description: "Suivre clients, ventes et factures dans un système structuré.",
        },
        {
          title: "Opérations",
          description: "Relier stocks, fournisseurs et documents au travail quotidien.",
        },
        {
          title: "Direction",
          description: "Lire tableaux de bord et rapports sans que des tableurs informels soient la source de vérité.",
        },
      ],
    },
    cta: {
      title: "Échanger sur CLEVONE DMS",
      description:
        "Institutions et entreprises peuvent s'enquérir de la feuille de route et du déploiement visé par les canaux officiels.",
      actions: [
        { href: "/collaboration", label: "Contacter CLEVONE" },
        { href: "/domaines", label: "Toutes les solutions", variant: "outline" },
      ],
    },
  },
} as const satisfies LocalizedPageContent<ClevoneDmsPageContent>;
