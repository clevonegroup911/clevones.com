export const actorTypes = [
  { value: "institution", label: "Institution" },
  { value: "investor", label: "Investor" },
  { value: "structured-logistics", label: "Structured logistics actor" },
  { value: "strategic-partner", label: "Strategic partner" },
  { value: "academic-research", label: "Academic / research actor" },
  { value: "other", label: "Other" },
] as const;

export const initiativeStages = [
  { value: "concept", label: "Concept" },
  { value: "documented-initiative", label: "Documented initiative" },
  { value: "institutional-discussion", label: "Institutional discussion" },
  { value: "investment-preparation", label: "Investment preparation" },
  { value: "governance-support-required", label: "Governance support required" },
] as const;

export type ActorType = (typeof actorTypes)[number]["value"];
export type InitiativeStage = (typeof initiativeStages)[number]["value"];

export type InitiativeSubmission = {
  organizationName: string;
  legalStatus: string;
  country: string;
  website: string;
  contactPerson: string;
  professionalEmail: string;
  phone: string;
  actorType: ActorType | "";
  actorTypeOther: string;
  initiativeTitle: string;
  initiativeStage: InitiativeStage | "";
  shortDescription: string;
  territoryConcerned: string;
  availableDocumentation: string;
  complianceStatus: string;
  expectedCollaborationType: string;
  governanceAcknowledgment: boolean;
};

export type InitiativeSubmissionField = keyof InitiativeSubmission;

export type InitiativeSubmissionErrors = Partial<
  Record<InitiativeSubmissionField, string>
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInitiativeSubmission(
  data: InitiativeSubmission,
): InitiativeSubmissionErrors {
  const errors: InitiativeSubmissionErrors = {};

  if (!data.organizationName.trim()) {
    errors.organizationName = "Organization name is required.";
  }
  if (!data.legalStatus.trim()) {
    errors.legalStatus = "Legal status is required.";
  }
  if (!data.country.trim()) {
    errors.country = "Country is required.";
  }
  if (!data.contactPerson.trim()) {
    errors.contactPerson = "Contact person is required.";
  }
  if (!data.professionalEmail.trim()) {
    errors.professionalEmail = "Professional email is required.";
  } else if (!EMAIL_PATTERN.test(data.professionalEmail.trim())) {
    errors.professionalEmail = "Enter a valid email address.";
  }
  if (!data.actorType) {
    errors.actorType = "Select an actor type.";
  }
  if (data.actorType === "other" && !data.actorTypeOther.trim()) {
    errors.actorTypeOther = "Specify the actor type.";
  }
  if (!data.initiativeTitle.trim()) {
    errors.initiativeTitle = "Initiative title is required.";
  }
  if (!data.initiativeStage) {
    errors.initiativeStage = "Select an initiative stage.";
  }
  if (!data.shortDescription.trim()) {
    errors.shortDescription = "Short description is required.";
  } else if (data.shortDescription.trim().length < 40) {
    errors.shortDescription =
      "Provide at least 40 characters describing the initiative.";
  }
  if (!data.territoryConcerned.trim()) {
    errors.territoryConcerned = "Territory concerned is required.";
  }
  if (!data.complianceStatus.trim()) {
    errors.complianceStatus = "Compliance status is required.";
  }
  if (!data.expectedCollaborationType.trim()) {
    errors.expectedCollaborationType =
      "Expected collaboration type is required.";
  }
  if (!data.governanceAcknowledgment) {
    errors.governanceAcknowledgment =
      "You must confirm the governance acknowledgment.";
  }

  return errors;
}

export const emptyInitiativeSubmission = (): InitiativeSubmission => ({
  organizationName: "",
  legalStatus: "",
  country: "",
  website: "",
  contactPerson: "",
  professionalEmail: "",
  phone: "",
  actorType: "",
  actorTypeOther: "",
  initiativeTitle: "",
  initiativeStage: "",
  shortDescription: "",
  territoryConcerned: "",
  availableDocumentation: "",
  complianceStatus: "",
  expectedCollaborationType: "",
  governanceAcknowledgment: false,
});

export type InitiativeSubmissionApiSuccess = {
  success: true;
  message: string;
};

export type InitiativeSubmissionApiValidationFailure = {
  success: false;
  errors: Record<string, string>;
};

export type InitiativeSubmissionApiServerFailure = {
  success: false;
  error: string;
};

export type InitiativeSubmissionApiResponse =
  | InitiativeSubmissionApiSuccess
  | InitiativeSubmissionApiValidationFailure
  | InitiativeSubmissionApiServerFailure;

function toInitiativeSubmissionPayload(data: InitiativeSubmission) {
  const { governanceAcknowledgment, ...rest } = data;

  return {
    ...rest,
    complianceConfirmation: governanceAcknowledgment,
  };
}

function mapApiErrorsToFormErrors(
  errors: Record<string, string>,
): InitiativeSubmissionErrors {
  const mapped: InitiativeSubmissionErrors = {};

  for (const [field, message] of Object.entries(errors)) {
    if (field === "complianceConfirmation") {
      mapped.governanceAcknowledgment = message;
      continue;
    }

    if (field in emptyInitiativeSubmission()) {
      mapped[field as InitiativeSubmissionField] = message;
    }
  }

  return mapped;
}

/**
 * Submits a structured initiative to the institutional review API.
 */
export async function submitInitiativeSubmission(
  data: InitiativeSubmission,
): Promise<InitiativeSubmissionApiSuccess> {
  const response = await fetch("/api/initiative-submission", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toInitiativeSubmissionPayload(data)),
  });

  let result: InitiativeSubmissionApiResponse;

  try {
    result = (await response.json()) as InitiativeSubmissionApiResponse;
  } catch {
    throw new Error(
      "The submission could not be processed. Please verify your connection and try again.",
    );
  }

  if (result.success) {
    return result;
  }

  if ("errors" in result) {
    const formErrors = mapApiErrorsToFormErrors(result.errors);
    const error = new Error("Validation failed.") as Error & {
      formErrors?: InitiativeSubmissionErrors;
    };
    error.formErrors = formErrors;
    throw error;
  }

  throw new Error(
    result.error ??
      "The submission could not be recorded at this time. Please try again later.",
  );
}
