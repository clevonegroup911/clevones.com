import type {
  ActorType,
  GovernanceIntent,
  InitiativeStage,
  ProductOption,
} from "@/lib/constants/contact-form-options";
import {
  formatInitiativeSubmissionErrors,
  initiativeSubmissionSchema,
} from "@/lib/validation/initiative-submission";

export {
  actorTypes,
  initiativeStages,
  productOptions,
  type ActorType,
  type InitiativeStage,
} from "@/lib/constants/contact-form-options";

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

export function toInitiativeSubmissionPayload(
  data: InitiativeSubmission,
  intent: GovernanceIntent = "collaboration",
) {
  const { governanceAcknowledgment, ...rest } = data;

  return {
    intent,
    ...rest,
    complianceConfirmation: governanceAcknowledgment,
  };
}

export function validateInitiativeSubmission(
  data: InitiativeSubmission,
  intent: GovernanceIntent = "collaboration",
): InitiativeSubmissionErrors {
  const parsed = initiativeSubmissionSchema.safeParse(
    toInitiativeSubmissionPayload(data, intent),
  );

  if (parsed.success) {
    return {};
  }

  return mapApiErrorsToFormErrors(
    formatInitiativeSubmissionErrors(parsed.error),
  );
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
  intent: GovernanceIntent = "collaboration",
): Promise<InitiativeSubmissionApiSuccess> {
  return postContactPayload(
    toInitiativeSubmissionPayload(data, intent),
    mapApiErrorsToFormErrors,
  );
}

/* ─── Product inquiry / quote (short customer path) ─────────────────────── */

export type ProductInquiry = {
  organizationName: string;
  contactPerson: string;
  professionalEmail: string;
  phone: string;
  location: string;
  product: ProductOption | "";
  estimatedUsers: string;
  need: string;
  privacyConsent: boolean;
};

export type ProductInquiryField = keyof ProductInquiry;
export type ProductInquiryErrors = Partial<Record<ProductInquiryField, string>>;

export const emptyProductInquiry = (
  product: ProductOption | "" = "",
): ProductInquiry => ({
  organizationName: "",
  contactPerson: "",
  professionalEmail: "",
  phone: "",
  location: "",
  product,
  estimatedUsers: "",
  need: "",
  privacyConsent: false,
});

export function toProductInquiryPayload(data: ProductInquiry) {
  return { intent: "product" as const, ...data };
}

function mapProductErrors(errors: Record<string, string>): ProductInquiryErrors {
  const mapped: ProductInquiryErrors = {};
  const known = emptyProductInquiry();
  for (const [field, message] of Object.entries(errors)) {
    if (field in known) {
      mapped[field as ProductInquiryField] = message;
    }
  }
  return mapped;
}

export function validateProductInquiry(data: ProductInquiry): ProductInquiryErrors {
  const parsed = initiativeSubmissionSchema.safeParse(toProductInquiryPayload(data));
  if (parsed.success) {
    return {};
  }
  return mapProductErrors(formatInitiativeSubmissionErrors(parsed.error));
}

export async function submitProductInquiry(
  data: ProductInquiry,
): Promise<InitiativeSubmissionApiSuccess> {
  return postContactPayload(toProductInquiryPayload(data), mapProductErrors);
}

async function postContactPayload<E>(
  payload: unknown,
  mapErrors: (errors: Record<string, string>) => E,
): Promise<InitiativeSubmissionApiSuccess> {
  const response = await fetch("/api/initiative-submission", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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
    const formErrors = mapErrors(result.errors);
    const error = new Error("Validation failed.") as Error & {
      formErrors?: E;
    };
    error.formErrors = formErrors;
    throw error;
  }

  throw new Error(
    result.error ??
      "The submission could not be recorded at this time. Please try again later.",
  );
}
