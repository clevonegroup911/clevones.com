import type { HeroContent, LocalizedPageContent, PageMeta } from "./types";

export type ContactIntent = "initiative" | "eligibility" | "collaboration";
export type ContactPageContent = {
  meta: PageMeta;
  hero: HeroContent;
  intents: Record<ContactIntent, HeroContent & { submitLabel: string; href: string }>;
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
};

const actorValues = ["institution", "investor", "structured-logistics", "strategic-partner", "academic-research", "other"] as const;
const stageValues = ["concept", "documented-initiative", "institutional-discussion", "investment-preparation", "governance-support-required"] as const;

export const contactPageContent = {
  en: {
    meta: { title: "Contact", description: "Submit a structured initiative or initiate a strategic collaboration with Clevones." },
    hero: {
      eyebrow: "Contact",
      title: "Start a strategic conversation",
      subtitle: "Clevones reviews structured, documented initiatives only.",
    },
    intents: {
      collaboration: {
        eyebrow: "Contact",
        title: "Start a strategic conversation",
        subtitle: "Tell us about your initiative. We review documented proposals only.",
        submitLabel: "Submit initiative",
        href: "/contact?intent=collaboration",
      },
      initiative: {
        eyebrow: "Structured initiative",
        title: "Submit a structured initiative",
        subtitle: "Provide documented details for governed assessment under the Five-Step Framework.",
        submitLabel: "Submit initiative",
        href: "/contact?intent=initiative",
      },
      eligibility: {
        eyebrow: "Eligibility review",
        title: "Check eligibility",
        subtitle: "See if your initiative meets Clevones governance criteria before formal coordination.",
        submitLabel: "Request eligibility review",
        href: "/contact?intent=eligibility",
      },
    },
    form: {
      governanceAcknowledgment: "I understand that Clevones is a neutral governance platform — not an operator, trader, or direct intermediary.",
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
        { value: actorValues[5], label: "Other" },
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
        continuation: "The Clevones team will assess eligibility and respond through official channels.",
        submitAnother: "Submit another initiative",
      },
      errorTitle: "Submission not recorded",
      requiredNotice: "Required fields are marked with *.",
      submitting: "Submitting…",
      formAriaLabel: "Structured initiative submission",
    },
    guidance: {
      title: "What happens next",
      description: "Clevones reviews submissions on a structured basis.",
      steps: [
        "Submit organization details, actor type, and initiative documentation.",
        "Clevones applies governance and compliance filters.",
        "Qualified initiatives receive a structured response.",
      ],
    },
  },
  fr: {
    meta: { title: "Collaboration", description: "Soumettez une initiative structurée ou initiez une collaboration stratégique avec Clevones." },
    hero: {
      eyebrow: "Contact",
      title: "Commencer une conversation stratégique",
      subtitle: "Clevones examine uniquement les initiatives structurées et documentées.",
    },
    intents: {
      collaboration: {
        eyebrow: "Contact",
        title: "Commencer une conversation stratégique",
        subtitle: "Parlez-nous de votre initiative. Nous examinons uniquement les propositions documentées.",
        submitLabel: "Soumettre l'initiative",
        href: "/collaboration?intent=collaboration",
      },
      initiative: {
        eyebrow: "Initiative structurée",
        title: "Soumettre une initiative structurée",
        subtitle: "Fournissez les éléments documentés pour une évaluation gouvernée selon le Cadre en cinq étapes.",
        submitLabel: "Soumettre l'initiative",
        href: "/collaboration?intent=initiative",
      },
      eligibility: {
        eyebrow: "Examen d'éligibilité",
        title: "Vérifier l'éligibilité",
        subtitle: "Vérifiez si votre initiative répond aux critères de gouvernance Clevones avant toute coordination formelle.",
        submitLabel: "Demander un examen d'éligibilité",
        href: "/collaboration?intent=eligibility",
      },
    },
    form: {
      governanceAcknowledgment: "Je comprends que Clevones est une plateforme neutre de gouvernance — non un opérateur, un négociant ou un intermédiaire direct.",
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
        { value: actorValues[5], label: "Autre" },
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
        continuation: "L'équipe Clevones évaluera l'éligibilité et répondra par les canaux officiels.",
        submitAnother: "Soumettre une autre initiative",
      },
      errorTitle: "Soumission non enregistrée",
      requiredNotice: "Les champs obligatoires sont indiqués par *.",
      submitting: "Envoi en cours…",
      formAriaLabel: "Soumission d'une initiative structurée",
    },
    guidance: {
      title: "Étapes suivantes",
      description: "Clevones examine les soumissions de manière structurée.",
      steps: [
        "Soumettez les informations sur l'organisation, le type d'acteur et la documentation de l'initiative.",
        "Clevones applique des filtres de gouvernance et de conformité.",
        "Les initiatives qualifiées reçoivent une réponse structurée.",
      ],
    },
  },
} as const satisfies LocalizedPageContent<ContactPageContent>;
