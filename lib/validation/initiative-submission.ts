import { z } from "zod";

import {
  actorTypes,
  governanceIntents,
  initiativeStages,
  productNeedMaxLength,
  productOptions,
} from "@/lib/constants/contact-form-options";

const actorTypeValues = actorTypes.map((option) => option.value) as [
  (typeof actorTypes)[number]["value"],
  ...(typeof actorTypes)[number]["value"][],
];

const initiativeStageValues = initiativeStages.map((stage) => stage.value) as [
  (typeof initiativeStages)[number]["value"],
  ...(typeof initiativeStages)[number]["value"][],
];

const productValues = productOptions.map((option) => option.value) as [
  (typeof productOptions)[number]["value"],
  ...(typeof productOptions)[number]["value"][],
];

function requiredString(message: string) {
  return z.string({ error: message }).trim().min(1, message);
}

function optionalString(max = 200) {
  return z.string().trim().max(max, `Maximum ${max} characters.`).optional().default("");
}

/**
 * Product inquiry / quote — short customer path.
 * Governance fields (documentation, compliance, territory, neutrality
 * acknowledgment) are not part of this branch and are stripped if sent.
 */
export const productInquirySchema = z.object({
  intent: z.literal("product"),
  organizationName: requiredString("Organization name is required.").max(200),
  contactPerson: requiredString("Contact person is required.").max(200),
  professionalEmail: requiredString("Professional email is required.")
    .max(254)
    .email("Enter a valid email address."),
  phone: optionalString(40),
  location: optionalString(160),
  product: z.enum(productValues, { message: "Select a product." }),
  estimatedUsers: z
    .string()
    .trim()
    .max(6, "Enter a number up to 999999.")
    .regex(/^\d*$/, "Enter a whole number.")
    .optional()
    .default(""),
  need: requiredString("Describe your need.")
    .min(10, "Provide at least 10 characters describing your need.")
    .max(productNeedMaxLength, `Maximum ${productNeedMaxLength} characters.`),
  privacyConsent: z.literal(true, {
    message: "You must accept the privacy policy.",
  }),
});

/** Governance intents — structured initiative path (unchanged requirements). */
export const governanceInitiativeSchema = z.object({
  intent: z.enum(governanceIntents),
  organizationName: requiredString("Organization name is required."),
  legalStatus: requiredString("Legal status is required."),
  country: requiredString("Country is required."),
  website: z.string().trim().optional().default(""),
  contactPerson: requiredString("Contact person is required."),
  professionalEmail: requiredString("Professional email is required.").email(
    "Enter a valid email address.",
  ),
  phone: z.string().trim().optional().default(""),
  actorType: z.enum(actorTypeValues, {
    message: "Select an actor type.",
  }),
  actorTypeOther: z.string().trim().optional().default(""),
  initiativeTitle: requiredString("Initiative title is required."),
  initiativeStage: z.enum(initiativeStageValues, {
    message: "Select an initiative stage.",
  }),
  shortDescription: requiredString("Short description is required.").min(
    40,
    "Provide at least 40 characters describing the initiative.",
  ),
  territoryConcerned: requiredString("Territory concerned is required."),
  availableDocumentation: z.string().trim().optional().default(""),
  complianceStatus: requiredString("Compliance status is required."),
  expectedCollaborationType: requiredString(
    "Expected collaboration type is required.",
  ),
  complianceConfirmation: z.literal(true, {
    message: "You must confirm the governance acknowledgment.",
  }),
});

/** Legacy clients posted without `intent`: they are governance submissions. */
function withDefaultIntent(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (record.intent === undefined) {
      return { ...record, intent: "collaboration" };
    }
  }
  return value;
}

export const initiativeSubmissionSchema = z.preprocess(
  withDefaultIntent,
  z
    .discriminatedUnion(
      "intent",
      [productInquirySchema, governanceInitiativeSchema],
      { error: "Unknown contact intent." },
    )
    .superRefine((data, context) => {
      if (
        data.intent !== "product" &&
        data.actorType === "other" &&
        !data.actorTypeOther
      ) {
        context.addIssue({
          code: "custom",
          message: "Specify the actor type.",
          path: ["actorTypeOther"],
        });
      }
    }),
);

export type InitiativeSubmissionPayload = z.infer<
  typeof initiativeSubmissionSchema
>;
export type ProductInquiryPayload = z.infer<typeof productInquirySchema>;
export type GovernanceInitiativePayload = z.infer<
  typeof governanceInitiativeSchema
>;

export function formatInitiativeSubmissionErrors(
  error: z.ZodError,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    const key = typeof field === "string" ? field : "intent";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
}
