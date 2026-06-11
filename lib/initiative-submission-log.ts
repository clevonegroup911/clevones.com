import type { InitiativeSubmissionPayload } from "@/lib/validation/initiative-submission";

/**
 * Logs submission metadata in development without exposing document
 * references or private contact details beyond what is needed for debugging.
 */
export function logInitiativeSubmissionInDevelopment(
  submission: InitiativeSubmissionPayload,
): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const safeRecord = {
    receivedAt: new Date().toISOString(),
    organizationName: submission.organizationName,
    legalStatus: submission.legalStatus,
    country: submission.country,
    contactPerson: submission.contactPerson,
    professionalEmail: submission.professionalEmail,
    actorType: submission.actorType,
    actorTypeOther: submission.actorTypeOther || undefined,
    initiativeTitle: submission.initiativeTitle,
    initiativeStage: submission.initiativeStage,
    territoryConcerned: submission.territoryConcerned,
    shortDescriptionLength: submission.shortDescription.length,
    complianceStatusLength: submission.complianceStatus.length,
    expectedCollaborationTypeLength:
      submission.expectedCollaborationType.length,
    complianceConfirmation: submission.complianceConfirmation,
    websiteProvided: Boolean(submission.website),
    phoneProvided: Boolean(submission.phone),
    documentationReferencesProvided: Boolean(
      submission.availableDocumentation,
    ),
    documentationReferencesLength: submission.availableDocumentation.length,
  };

  console.info(
    "[initiative-submission] Received structured submission:",
    safeRecord,
  );
}
