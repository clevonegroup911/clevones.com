import readline from "node:readline";

import { prisma } from "@/lib/db/prisma";
import { writeAuditLog, auditActions } from "@/lib/admin/audit";
import { hashPassword } from "@/lib/auth/password";
import { normalizeEmail, normalizePersonName } from "@/lib/auth/normalize";
import {
  createAdminAccountSchema,
  formatZodFieldErrors,
} from "@/lib/validation/admin-auth";

function isAllowAdminCreateInProduction() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  return process.env.ALLOW_ADMIN_CREATE_IN_PRODUCTION === "true";
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

async function askHidden(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const rlAny = rl as unknown as { _writeToOutput?: (s: string) => void };
  const previousWriteToOutput = rlAny._writeToOutput;

  // Prevent echoing the typed password.
  rlAny._writeToOutput = () => {
    /* noop */
  };

  const answer = await ask(rl, question);

  // Restore output handling for subsequent prompts.
  rlAny._writeToOutput = previousWriteToOutput;
  rl.close();

  return answer;
}

async function promptLoopPassword(args: {
  email: string;
  firstName: string;
  lastName: string;
}): Promise<string> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const password = await askHidden("Mot de passe: ");

    const parsed = createAdminAccountSchema.safeParse({
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      password,
    });

    if (parsed.success) {
      return password;
    }

    const errors = formatZodFieldErrors(parsed.error);
    console.log("");
    console.log("Le mot de passe ne répond pas à la robustesse requise :");
    if (errors.password) {
      console.log(`- ${errors.password}`);
    } else {
      console.log("- Veuillez choisir une phrase secrète plus robuste.");
    }
    console.log("");
  }
}

async function main() {
  if (!isAllowAdminCreateInProduction()) {
    console.error(
      "Création d’un compte admin refusée en production. Définissez ALLOW_ADMIN_CREATE_IN_PRODUCTION=true si c’est explicitement voulu.",
    );
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  try {
    const emailRaw = await ask(rl, "Adresse e-mail: ");
    const email = normalizeEmail(emailRaw);

    const firstNameRaw = await ask(rl, "Prénom: ");
    const firstName = normalizePersonName(firstNameRaw);

    const lastNameRaw = await ask(rl, "Nom: ");
    const lastName = normalizePersonName(lastNameRaw);

    const password = await promptLoopPassword({ email, firstName, lastName });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error("Un compte avec cette adresse e-mail existe déjà.");
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);

    const createdUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        mfaEnabled: false,
        lastLoginAt: null,
      },
      select: { id: true, email: true },
    });

    await writeAuditLog({
      actorId: null,
      action: auditActions.USER_CREATED,
      entityType: "User",
      entityId: createdUser.id,
      metadata: {
        email: createdUser.email,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
      ipAddress: null,
      userAgent: "scripts/create-admin.ts",
    });

    // Clear sensitive variable before exit.
    void password;

    console.log("");
    console.log("Admin SUPER_ADMIN créé avec succès.");
    console.log(`ID utilisateur: ${createdUser.id}`);
  } finally {
    rl.close();
  }
}

void main();
