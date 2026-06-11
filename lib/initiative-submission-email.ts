import type { InitiativeSubmissionPayload } from "@/lib/validation/initiative-submission";

export type PreparedInitiativeEmail = {
  subject: string;
  replyTo: string;
  sections: Array<{ heading: string; body: string }>;
};

/**
 * Structures a validated submission for future email delivery.
 * No provider is connected yet.
 */
export function prepareInitiativeSubmissionEmail(
  submission: InitiativeSubmissionPayload,
): PreparedInitiativeEmail {
  const actorLabel =
    submission.actorType === "other" && submission.actorTypeOther
      ? submission.actorTypeOther
      : submission.actorType;

  return {
    subject: `Structured initiative submission — ${submission.initiativeTitle}`,
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
