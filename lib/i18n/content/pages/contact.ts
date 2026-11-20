import {
  governanceAcknowledgmentText,
  governanceAcknowledgmentTextFr,
} from "@/lib/constants/brand-positioning";
import {
  productNeedMaxLength,
  type ContactIntentValue,
} from "@/lib/constants/contact-form-options";
import type { HeroContent, LocalizedPageContent, PageMeta } from "./types";

export type ContactIntent = ContactIntentValue;

export type ProductFormContent = {
  sections: { contact: string; request: string; consent: string };
  fields: Record<
    | "organizationName"
    | "contactPerson"
    | "professionalEmail"
    | "phone"
    | "location"
    | "product"
    | "estimatedUsers"
    | "need",
    { label: string; hint?: string }
  >;
  productOptions: readonly { value: string; label: string }[];
  selectProduct: string;
  privacyConsent: { before: string; linkLabel: string; href: string; after: string };
  success: { eyebrow: string; title: string; fallbackMessage: string; continuation: string; submitAnother: string };
  formAriaLabel: string;
};
export type ContactPageContent = {
  meta: PageMeta;
  hero: HeroContent;
  directory: {
    title: string;
    location: string;
    phoneLabel: string;
    emailLabel: string;
  };
  intentSelector: { label: string };
  intents: Record<ContactIntent, HeroContent & { submitLabel: string; href: string; navLabel: string }>;
  productForm: ProductFormContent;
  form: {
    governanceAcknowledgment: string; submitLabel: string;
    sections: { organization: string; actorType: string; initiative: string; confirmation: string };
    fields: Record<string, { label: string; hint?: string }>;
    actorTypeLegend: string; actorTypes: readonly { value: string; label: string }[];
    initiativeStages: readonly { value: string; label: string }[]; selectStage: string;
    success: { eyebrow: string; title: string; fallbackMessage: string; continuation: string; submitAnother: string };
    errorTitle: string; requiredNotice: string; submitting: string; formAriaLabel: string;
  };
  guidance: { title: string; description: string; steps: readonly string[] };
  productGuidance: { title: string; description: string; steps: readonly string[] };
};

const actorValues = ["institution", "investor", "structured-logistics", "strategic-partner", "academic-research", "business-customer", "other"] as const;
const stageValues = ["concept", "documented-initiative", "institutional-discussion", "investment-preparation", "governance-support-required"] as const;

export const contactPageContent = {
  en: {
    meta: { title: "Contact", description: "Contact CLEVONE SARL in Kisangani: product inquiry or quote (CLEVONE DMS and other solutions), or a multi-party initiative." },
    hero: {
      eyebrow: "Contact",
      title: "Contact CLEVONE SARL",
      subtitle: "Ask about a product, request a quote, or present a multi-party initiative. Choose your request below.",
    },
    directory: {
      title: "Official contact",
      location: "Kisangani, Democratic Republic of the Congo",
      phoneLabel: "Tel",
      emailLabel: "Email",
    },
    intentSelector: { label: "Your request" },
    intents: {
      product: {
        eyebrow: "Product inquiry / quote",
        title: "Ask about a product or request a quote",
        subtitle: "CLEVONE DMS or another solution: describe your need and we will reply by email.",
        submitLabel: "Send my request",
        href: "/contact?intent=product",
        navLabel: "Product inquiry / quote",
      },
      collaboration: {
        eyebrow: "Initiative",
        title: "Start a strategic conversation",
        subtitle: "For institutions and partners carrying a multi-party initiative. We review documented initiatives only.",
        submitLabel: "Submit initiative",
        href: "/contact?intent=collaboration",
        navLabel: "Strategic conversation",
      },
      initiative: {
        eyebrow: "Structured initiative",
        title: "Submit a structured initiative",
        subtitle: "Provide documented details for review under the five-step framework.",
        submitLabel: "Submit initiative",
        href: "/contact?intent=initiative",
        navLabel: "Structured initiative",
      },
      eligibility: {
        eyebrow: "Eligibility review",
        title: "Check eligibility",
        subtitle: "See if your initiative meets the criteria for a CLEVONE coordination mission.",
        submitLabel: "Request eligibility review",
        href: "/contact?intent=eligibility",
        navLabel: "Eligibility review",
      },
    },
    productForm: {
      sections: { contact: "Your details", request: "Your request", consent: "Consent" },
      fields: {
        organizationName: { label: "Organization" },
        contactPerson: { label: "Contact person" },
        professionalEmail: { label: "Professional email" },
        phone: { label: "Phone / WhatsApp" },
        location: { label: "City and country" },
        product: { label: "Product" },
        estimatedUsers: { label: "Estimated number of users" },
        need: { label: "Your need", hint: `What you want to manage or improve (up to ${productNeedMaxLength} characters).` },
      },
      productOptions: [
        { value: "clevone-dms", label: "CLEVONE DMS" },
        { value: "other-solution", label: "Other solution" },
      ],
      selectProduct: "Select a product",
      privacyConsent: {
        before: "I accept that CLEVONE SARL uses this information to answer my request, as described in the ",
        linkLabel: "privacy policy",
        href: "/privacy",
        after: ".",
      },
      success: {
        eyebrow: "Request received",
        title: "Request received",
        fallbackMessage: "Your product inquiry has been received.",
        continuation: "We will reply by email through our official channels.",
        submitAnother: "Send another request",
      },
      formAriaLabel: "Product inquiry or quote request",
    },
    form: {
      governanceAcknowledgment: governanceAcknowledgmentText,
      submitLabel: "Submit initiative",
      sections: { organization: "Organization", actorType: "Actor type", initiative: "Initiative", confirmation: "Confirmation" },
      fields: {
        organizationName: { label: "Organization name" },
        legalStatus: { label: "Legal status", hint: "e.g. public institution, registered company, fund" },
        country: { label: "Country" },
        website: { label: "Website" },
        contactPerson: { label: "Contact person" },
        professionalEmail: { label: "Professional email" },
        phone: { label: "Phone / WhatsApp" },
        actorTypeOther: { label: "Specify actor type" },
        initiativeTitle: { label: "Initiative title" },
        initiativeStage: { label: "Initiative stage" },
        shortDescription: { label: "Short description", hint: "Scope, objectives, and governance needs." },
        territoryConcerned: { label: "Territory concerned" },
        availableDocumentation: { label: "Available documentation", hint: "Studies, frameworks, agreements, or audit references." },
        complianceStatus: { label: "Compliance status", hint: "Regulatory, ESG, or institutional compliance position." },
        expectedCollaborationType: { label: "Expected collaboration type", hint: "Governance design, coordination, reporting, or advisory scope." },
      },
      actorTypeLegend: "Actor type",
      actorTypes: [
        { value: actorValues[0], label: "Institution" },
        { value: actorValues[1], label: "Investor" },
        { value: actorValues[2], label: "Structured logistics actor" },
        { value: actorValues[3], label: "Strategic partner" },
        { value: actorValues[4], label: "Academic / research actor" },
        { value: actorValues[5], label: "Business customer" },
        { value: actorValues[6], label: "Other" },
      ],
      initiativeStages: [
        { value: stageValues[0], label: "Concept" },
        { value: stageValues[1], label: "Documented initiative" },
        { value: stageValues[2], label: "Institutional discussion" },
        { value: stageValues[3], label: "Investment preparation" },
        { value: stageValues[4], label: "Governance support required" },
      ],
      selectStage: "Select a stage",
      success: {
        eyebrow: "Submission received",
        title: "Submission received",
        fallbackMessage: "Your initiative has been recorded for institutional review.",
        continuation: "The CLEVONE team will assess eligibility and respond through official channels.",
        submitAnother: "Submit another initiative",
      },
      errorTitle: "Submission not recorded",
      requiredNotice: "Required fields are marked with *.",
      submitting: "Submitting…",
      formAriaLabel: "Structured initiative submission",
    },
    guidance: {
      title: "What happens next",
      description: "Initiatives are reviewed on a structured basis.",
      steps: [
        "Submit organization details, actor type, and initiative documentation.",
        "CLEVONE applies governance and compliance filters.",
        "Qualified initiatives receive a structured response.",
      ],
    },
    productGuidance: {
      title: "What happens next",
      description: "A short form, a direct answer.",
      steps: [
        "Tell us who you are and what you need.",
        "We check availability and scope for your organization.",
        "We reply by email, with a quote when relevant.",
      ],
    },
  },
  fr: {
    meta: { title: "Contact", description: "Contactez CLEVONE SARL à Kisangani : demande produit ou devis (CLEVONE DMS et autres solutions), ou initiative multi-acteurs." },
    hero: {
      eyebrow: "Contact",
      title: "Contacter CLEVONE SARL",
      subtitle: "Une question produit, un devis ou une initiative multi-acteurs ? Choisissez votre demande ci-dessous.",
    },
    directory: {
      title: "Contact officiel",
      location: "Kisangani, République Démocratique du Congo",
      phoneLabel: "Tél.",
      emailLabel: "Email",
    },
    intentSelector: { label: "Votre demande" },
    intents: {
      product: {
        eyebrow: "Demande produit / devis",
        title: "Une question produit ou un devis",
        subtitle: "CLEVONE DMS ou une autre solution : décrivez votre besoin, nous vous répondons par e-mail.",
        submitLabel: "Envoyer ma demande",
        href: "/collaboration?intent=product",
        navLabel: "Demande produit / devis",
      },
      collaboration: {
        eyebrow: "Initiative",
        title: "Commencer une conversation stratégique",
        subtitle: "Pour les institutions et partenaires porteurs d'une initiative multi-acteurs. Nous examinons uniquement les initiatives documentées.",
        submitLabel: "Soumettre l'initiative",
        href: "/collaboration?intent=collaboration",
        navLabel: "Conversation stratégique",
      },
      initiative: {
        eyebrow: "Initiative structurée",
        title: "Soumettre une initiative structurée",
        subtitle: "Fournissez les éléments documentés pour un examen selon le cadre en cinq étapes.",
        submitLabel: "Soumettre l'initiative",
        href: "/collaboration?intent=initiative",
        navLabel: "Initiative structurée",
      },
      eligibility: {
        eyebrow: "Examen d'éligibilité",
        title: "Vérifier l'éligibilité",
        subtitle: "Vérifiez si votre initiative répond aux critères d'une mission de coordination CLEVONE.",
        submitLabel: "Demander un examen d'éligibilité",
        href: "/collaboration?intent=eligibility",
        navLabel: "Examen d'éligibilité",
      },
    },
    productForm: {
      sections: { contact: "Vos coordonnées", request: "Votre demande", consent: "Consentement" },
      fields: {
        organizationName: { label: "Organisation" },
        contactPerson: { label: "Personne de contact" },
        professionalEmail: { label: "E-mail professionnel" },
        phone: { label: "Téléphone / WhatsApp" },
        location: { label: "Ville et pays" },
        product: { label: "Produit" },
        estimatedUsers: { label: "Nombre d'utilisateurs estimé" },
        need: { label: "Votre besoin", hint: `Ce que vous voulez gérer ou améliorer (${productNeedMaxLength} caractères maximum).` },
      },
      productOptions: [
        { value: "clevone-dms", label: "CLEVONE DMS" },
        { value: "other-solution", label: "Autre solution" },
      ],
      selectProduct: "Sélectionnez un produit",
      privacyConsent: {
        before: "J'accepte que CLEVONE SARL utilise ces informations pour répondre à ma demande, comme décrit dans la ",
        linkLabel: "politique de confidentialité",
        href: "/confidentialite",
        after: ".",
      },
      success: {
        eyebrow: "Demande reçue",
        title: "Demande reçue",
        fallbackMessage: "Votre demande produit a bien été reçue.",
        continuation: "Nous vous répondrons par e-mail via nos canaux officiels.",
        submitAnother: "Envoyer une autre demande",
      },
      formAriaLabel: "Demande produit ou devis",
    },
    form: {
      governanceAcknowledgment: governanceAcknowledgmentTextFr,
      submitLabel: "Soumettre l'initiative",
      sections: { organization: "Organisation", actorType: "Type d'acteur", initiative: "Initiative", confirmation: "Confirmation" },
      fields: {
        organizationName: { label: "Nom de l'organisation" },
        legalStatus: { label: "Statut juridique", hint: "p. ex. institution publique, société enregistrée, fonds" },
        country: { label: "Pays" },
        website: { label: "Site web" },
        contactPerson: { label: "Personne de contact" },
        professionalEmail: { label: "Adresse e-mail professionnelle" },
        phone: { label: "Téléphone / WhatsApp" },
        actorTypeOther: { label: "Précisez le type d'acteur" },
        initiativeTitle: { label: "Intitulé de l'initiative" },
        initiativeStage: { label: "Stade de l'initiative" },
        shortDescription: { label: "Brève description", hint: "Périmètre, objectifs et besoins de gouvernance." },
        territoryConcerned: { label: "Territoire concerné" },
        availableDocumentation: { label: "Documentation disponible", hint: "Études, cadres, accords ou références d'audit." },
        complianceStatus: { label: "Statut de conformité", hint: "Situation réglementaire, ESG ou de conformité institutionnelle." },
        expectedCollaborationType: { label: "Type de collaboration attendu", hint: "Conception de gouvernance, coordination, reporting ou conseil." },
      },
      actorTypeLegend: "Type d'acteur",
      actorTypes: [
        { value: actorValues[0], label: "Institution" },
        { value: actorValues[1], label: "Investisseur" },
        { value: actorValues[2], label: "Acteur logistique structuré" },
        { value: actorValues[3], label: "Partenaire stratégique" },
        { value: actorValues[4], label: "Acteur académique / de recherche" },
        { value: actorValues[5], label: "Entreprise cliente" },
        { value: actorValues[6], label: "Autre" },
      ],
      initiativeStages: [
        { value: stageValues[0], label: "Concept" },
        { value: stageValues[1], label: "Initiative documentée" },
        { value: stageValues[2], label: "Échange institutionnel" },
        { value: stageValues[3], label: "Préparation à l'investissement" },
        { value: stageValues[4], label: "Appui à la gouvernance requis" },
      ],
      selectStage: "Sélectionnez un stade",
      success: {
        eyebrow: "Soumission reçue",
        title: "Soumission reçue",
        fallbackMessage: "Votre initiative a été enregistrée pour examen institutionnel.",
        continuation: "L'équipe CLEVONE évaluera l'éligibilité et répondra par les canaux officiels.",
        submitAnother: "Soumettre une autre initiative",
      },
      errorTitle: "Soumission non enregistrée",
      requiredNotice: "Les champs obligatoires sont indiqués par *.",
      submitting: "Envoi en cours…",
      formAriaLabel: "Soumission d'une initiative structurée",
    },
    guidance: {
      title: "Étapes suivantes",
      description: "Les initiatives sont examinées de manière structurée.",
      steps: [
        "Soumettez les informations sur l'organisation, le type d'acteur et la documentation de l'initiative.",
        "CLEVONE applique des filtres de gouvernance et de conformité.",
        "Les initiatives qualifiées reçoivent une réponse structurée.",
      ],
    },
    productGuidance: {
      title: "Étapes suivantes",
      description: "Un formulaire court, une réponse directe.",
      steps: [
        "Dites-nous qui vous êtes et ce dont vous avez besoin.",
        "Nous vérifions la disponibilité et le périmètre pour votre organisation.",
        "Nous vous répondons par e-mail, avec un devis si nécessaire.",
      ],
    },
  },
} as const satisfies LocalizedPageContent<ContactPageContent>;
