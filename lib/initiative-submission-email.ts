import { productOptions } from "@/lib/constants/contact-form-options";
import type {
  InitiativeSubmissionPayload,
  ProductInquiryPayload,
} from "@/lib/validation/initiative-submission";

export type PreparedInitiativeEmail = {
  subject: string;
  replyTo: string;
  /** Optional first line; defaults to the structured-initiative intro. */
  intro?: { en: string; fr: string };
  sections: Array<{ heading: string; body: string }>;
};

/** Strips control characters and line breaks from values used in headers. */
function headerSafe(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, 120);
}

function prepareProductInquiryEmail(
  submission: ProductInquiryPayload,
): PreparedInitiativeEmail {
  const productLabel =
    productOptions.find((option) => option.value === submission.product)?.label ??
    submission.product;

  return {
    subject: `[Demande produit] ${productLabel} — ${headerSafe(submission.organizationName)}`,
    replyTo: submission.professionalEmail,
    intro: {
      en: "New product inquiry / quote request.",
      fr: "Nouvelle demande produit / devis.",
    },
    sections: [
      {
        heading: "Contact",
        body: [
          `Organization: ${submission.organizationName}`,
          `Contact person: ${submission.contactPerson}`,
          `Professional email: ${submission.professionalEmail}`,
          submission.phone ? `Phone / WhatsApp: ${submission.phone}` : null,
          submission.location ? `City and country: ${submission.location}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      {
        heading: "Request",
        body: [
          `Product: ${productLabel}`,
          submission.estimatedUsers
            ? `Estimated users: ${submission.estimatedUsers}`
            : null,
          "",
          "Need:",
          submission.need,
        ]
          .filter((line) => line !== null)
          .join("\n"),
      },
      {
        heading: "Consent",
        body: "The requester accepted the privacy policy.",
      },
    ],
  };
}

/**
 * Structures a validated submission for email delivery.
 */
export function prepareInitiativeSubmissionEmail(
  submission: InitiativeSubmissionPayload,
): PreparedInitiativeEmail {
  if (submission.intent === "product") {
    return prepareProductInquiryEmail(submission);
  }

  const actorLabel =
    submission.actorType === "other" && submission.actorTypeOther
      ? submission.actorTypeOther
      : submission.actorType;

  return {
    subject: `[Initiative — ${submission.intent}] ${headerSafe(submission.initiativeTitle)}`,
    replyTo: submission.professionalEmail,
    sections: [
      {
        heading: "Organization",
        body: [
          `Organization: ${submission.organizationName}`,
          `Legal status: ${submission.legalStatus}`,
          `Country: ${submission.country}`,
          submission.website ? `Website: ${submission.website}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      {
        heading: "Contact",
        body: [
          `Contact person: ${submission.contactPerson}`,
          `Professional email: ${submission.professionalEmail}`,
          submission.phone ? `Phone: ${submission.phone}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      {
        heading: "Initiative",
        body: [
          `Actor type: ${actorLabel}`,
          `Title: ${submission.initiativeTitle}`,
          `Stage: ${submission.initiativeStage}`,
          `Territory concerned: ${submission.territoryConcerned}`,
          "",
          "Short description:",
          submission.shortDescription,
        ].join("\n"),
      },
      {
        heading: "Compliance and collaboration",
        body: [
          "Compliance status:",
          submission.complianceStatus,
          "",
          "Expected collaboration type:",
          submission.expectedCollaborationType,
          "",
          submission.availableDocumentation
            ? "Available documentation (references only — not attached):"
            : "Available documentation: Not specified",
          submission.availableDocumentation || null,
        ]
          .filter((line) => line !== null)
          .join("\n"),
      },
      {
        heading: "Confirmation",
        body: "The submitter confirmed governance acknowledgment and compliance with institutional review requirements.",
      },
    ],
  };
}
