import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";

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

function wipeSensitive(value: { current: string }) {
  value.current = "";
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const onClose = () => {
      reject(Object.assign(new Error("Interrupted"), { code: "SIGINT" }));
    };
    rl.once("close", onClose);
    rl.question(question, (answer) => {
      rl.off("close", onClose);
      resolve(answer);
    });
  });
}

/**
 * Prompt for a secret without echoing any typed characters.
 * Does not use readline — caller must close any active Interface first.
 */
function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    output.write(question);

    let value = "";
    const wasTTY = Boolean(input.isTTY);

    const cleanup = () => {
      input.off("data", onData);
      if (wasTTY && typeof input.setRawMode === "function") {
        input.setRawMode(false);
      }
    };

    const fail = (error: Error) => {
      cleanup();
      wipeSensitive({ current: value });
      value = "";
      reject(error);
    };

    const onData = (chunk: Buffer | string) => {
      const str = typeof chunk === "string" ? chunk : chunk.toString("utf8");

      for (const char of str) {
        if (char === "\u0003") {
          fail(Object.assign(new Error("Interrupted"), { code: "SIGINT" }));
          return;
        }

        if (char === "\r" || char === "\n") {
          cleanup();
          output.write("\n");
          resolve(value);
          return;
        }

        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }

        if (char === "\u0015") {
          value = "";
          continue;
        }

        // Ignore other control / escape sequences.
        if (char < " " || char === "\u001b") {
          continue;
        }

        value += char;
      }
    };

    if (wasTTY && typeof input.setRawMode === "function") {
      input.setRawMode(true);
    }
    input.resume();
    input.on("data", onData);
  });
}

async function promptConfirmedPassword(args: {
  email: string;
  firstName: string;
  lastName: string;
}): Promise<string> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const passwordHolder = { current: await askHidden("Mot de passe: ") };
    const confirmHolder = {
      current: await askHidden("Confirmer le mot de passe: "),
    };

    if (passwordHolder.current !== confirmHolder.current) {
      wipeSensitive(passwordHolder);
      wipeSensitive(confirmHolder);
      console.log("");
      console.log("Les mots de passe ne correspondent pas. Réessayez.");
      console.log("");
      continue;
    }

    const parsed = createAdminAccountSchema.safeParse({
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      password: passwordHolder.current,
    });

    if (parsed.success) {
      const password = passwordHolder.current;
      wipeSensitive(passwordHolder);
      wipeSensitive(confirmHolder);
      return password;
    }

    wipeSensitive(passwordHolder);
    wipeSensitive(confirmHolder);

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

  let rl: readline.Interface | null = null;
  const passwordHolder = { current: "" };

  const onSigInt = () => {
    wipeSensitive(passwordHolder);
    if (rl) {
      rl.close();
      rl = null;
    }
    console.error("\nOpération annulée.");
    process.exit(130);
  };

  process.once("SIGINT", onSigInt);

  try {
    rl = readline.createInterface({
      input,
      output,
      terminal: true,
    });

    rl.on("SIGINT", () => {
      onSigInt();
    });

    const emailRaw = await ask(rl, "Adresse e-mail: ");
    const email = normalizeEmail(emailRaw);

    const firstNameRaw = await ask(rl, "Prénom: ");
    const firstName = normalizePersonName(firstNameRaw);

    const lastNameRaw = await ask(rl, "Nom: ");
    const lastName = normalizePersonName(lastNameRaw);

    // Close the only readline Interface before raw password prompts.
    rl.close();
    rl = null;

    passwordHolder.current = await promptConfirmedPassword({
      email,
      firstName,
      lastName,
    });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      wipeSensitive(passwordHolder);
      console.error("Un compte avec cette adresse e-mail existe déjà.");
      process.exit(1);
    }

    const passwordHash = await hashPassword(passwordHolder.current);
    wipeSensitive(passwordHolder);

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

    console.log("");
    console.log("Admin SUPER_ADMIN créé avec succès.");
    console.log(`ID utilisateur: ${createdUser.id}`);
  } catch (error) {
    wipeSensitive(passwordHolder);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "SIGINT"
    ) {
      console.error("\nOpération annulée.");
      process.exit(130);
    }
    throw error;
  } finally {
    wipeSensitive(passwordHolder);
    if (rl) {
      rl.close();
      rl = null;
    }
    process.off("SIGINT", onSigInt);
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
