import { z } from "zod";

import { actorTypes, initiativeStages } from "@/lib/contact-form";

const actorTypeValues = actorTypes.map((option) => option.value) as [
  (typeof actorTypes)[number]["value"],
  ...(typeof actorTypes)[number]["value"][],
];

const initiativeStageValues = initiativeStages.map((stage) => stage.value) as [
  (typeof initiativeStages)[number]["value"],
  ...(typeof initiativeStages)[number]["value"][],
];

export const initiativeSubmissionSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(1, "Organization name is required."),
    legalStatus: z.string().trim().min(1, "Legal status is required."),
    country: z.string().trim().min(1, "Country is required."),
    website: z.string().trim().optional().default(""),
    contactPerson: z.string().trim().min(1, "Contact person is required."),
    professionalEmail: z
      .string()
      .trim()
      .min(1, "Professional email is required.")
      .email("Enter a valid email address."),
    phone: z.string().trim().optional().default(""),
    actorType: z.enum(actorTypeValues, {
      message: "Select an actor type.",
    }),
    actorTypeOther: z.string().trim().optional().default(""),
    initiativeTitle: z
      .string()
      .trim()
      .min(1, "Initiative title is required."),
    initiativeStage: z.enum(initiativeStageValues, {
      message: "Select an initiative stage.",
    }),
    shortDescription: z
      .string()
      .trim()
      .min(1, "Short description is required.")
      .min(
        40,
        "Provide at least 40 characters describing the initiative.",
      ),
    territoryConcerned: z
      .string()
      .trim()
      .min(1, "Territory concerned is required."),
    availableDocumentation: z.string().trim().optional().default(""),
    complianceStatus: z
      .string()
      .trim()
      .min(1, "Compliance status is required."),
    expectedCollaborationType: z
      .string()
      .trim()
      .min(1, "Expected collaboration type is required."),
    complianceConfirmation: z.literal(true, {
      message: "You must confirm the governance acknowledgment.",
    }),
  })
  .superRefine((data, context) => {
    if (data.actorType === "other" && !data.actorTypeOther) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Specify the actor type.",
        path: ["actorTypeOther"],
      });
    }
  });

export type InitiativeSubmissionPayload = z.infer<
  typeof initiativeSubmissionSchema
>;

export function formatInitiativeSubmissionErrors(
  error: z.ZodError,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}
