import { z } from "zod";

import { normalizeEmail, normalizePersonName } from "@/lib/auth/normalize";
import { evaluatePasswordStrength } from "@/lib/validation/password-policy";

const personNameSchema = z
  .string({ error: "Ce champ est requis." })
  .transform(normalizePersonName)
  .pipe(
    z
      .string()
      .min(1, "Ce champ est requis.")
      .max(80, "Ce champ ne peut pas dépasser 80 caractères.")
      .regex(
        /^[\p{L}\p{M} .'-]+$/u,
        "Utilisez uniquement des lettres, espaces, apostrophes ou tirets.",
      ),
  );

export const adminLoginSchema = z.object({
  email: z
    .string({ error: "L'adresse e-mail est requise." })
    .trim()
    .min(1, "L'adresse e-mail est requise.")
    .email("Entrez une adresse e-mail valide.")
    .transform(normalizeEmail),
  password: z
    .string({ error: "Le mot de passe est requis." })
    .min(1, "Le mot de passe est requis.")
    .max(128, "Le mot de passe est trop long."),
  callbackUrl: z.string().optional(),
});

export const createAdminAccountSchema = z
  .object({
    email: z
      .string({ error: "L'adresse e-mail est requise." })
      .trim()
      .min(1, "L'adresse e-mail est requise.")
      .email("Entrez une adresse e-mail valide.")
      .transform(normalizeEmail),
    firstName: personNameSchema,
    lastName: personNameSchema,
    password: z.string({ error: "Le mot de passe est requis." }),
  })
  .superRefine((data, context) => {
    const issues = evaluatePasswordStrength(data.password, {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    for (const issue of issues) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: ["password"],
      });
    }
  });

export const adminMfaPasswordSchema = z.object({
  password: z
    .string({ error: "Le mot de passe est requis." })
    .min(1, "Le mot de passe est requis.")
    .max(128, "Le mot de passe est trop long."),
});

export const adminTotpCodeSchema = z
  .string({ error: "Le code d'authentification est requis." })
  .trim()
  .regex(/^\d{6}$/, "Entrez un code à 6 chiffres.");

export const adminMfaChallengeCodeSchema = z
  .string({ error: "Le code est requis." })
  .trim()
  .min(6, "Le code est requis.")
  .max(32, "Le code est invalide.");

export const adminMfaConfirmSchema = z.object({
  code: adminTotpCodeSchema,
});

export const adminMfaVerifySchema = z.object({
  code: adminMfaChallengeCodeSchema,
});

export const adminMfaDisableSchema = z.object({
  password: adminMfaPasswordSchema.shape.password,
  code: adminMfaChallengeCodeSchema,
});

export type AdminLoginPayload = z.infer<typeof adminLoginSchema>;
export type CreateAdminAccountPayload = z.infer<typeof createAdminAccountSchema>;
export type AdminMfaVerifyPayload = z.infer<typeof adminMfaVerifySchema>;
export type AdminMfaDisablePayload = z.infer<typeof adminMfaDisableSchema>;

export function formatZodFieldErrors(
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
