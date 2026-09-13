import { z } from "zod";

import type { UserRole, UserStatus } from "@/lib/auth/admin-access";
import { hashPassword } from "@/lib/auth/password";
import { normalizeEmail, normalizePersonName } from "@/lib/auth/normalize";
import { evaluatePasswordStrength } from "@/lib/validation/password-policy";
import { prisma } from "@/lib/db/prisma";

export type ManagedUserRole = "USER" | "ADMIN";

export class ManagedUserError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_INPUT"
      | "EMAIL_TAKEN"
      | "NOT_FOUND"
      | "FORBIDDEN_TARGET"
      | "ALREADY_DISABLED",
  ) {
    super(message);
    this.name = "ManagedUserError";
  }
}

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

export const createManagedUserSchema = z
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
    role: z.enum(["USER", "ADMIN"]),
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

export type CreateManagedUserInput = z.infer<typeof createManagedUserSchema>;

export type ManagedUserSummary = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  mfaEnabled: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export async function listManagedUsers(): Promise<ManagedUserSummary[]> {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      mfaEnabled: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export async function createManagedUser(
  input: CreateManagedUserInput,
): Promise<ManagedUserSummary> {
  const passwordHash = await hashPassword(input.password);
  try {
    return await prisma.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        role: input.role,
        status: "ACTIVE",
        mfaEnabled: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        mfaEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new ManagedUserError("Cet e-mail est déjà utilisé.", "EMAIL_TAKEN");
    }
    throw error;
  }
}

export async function disableManagedUser(userId: string): Promise<ManagedUserSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      mfaEnabled: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new ManagedUserError("Utilisateur introuvable.", "NOT_FOUND");
  }
  if (user.role === "SUPER_ADMIN") {
    throw new ManagedUserError(
      "Un compte SUPER_ADMIN ne peut pas être désactivé ici.",
      "FORBIDDEN_TARGET",
    );
  }
  if (user.status === "DISABLED") {
    throw new ManagedUserError("Compte déjà désactivé.", "ALREADY_DISABLED");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status: "DISABLED" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      mfaEnabled: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}
