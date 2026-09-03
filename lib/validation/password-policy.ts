const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  "password1234",
  "password123!",
  "admin123456!",
  "changeme1234",
  "qwerty123456",
  "letmein12345",
  "welcome12345",
  "superadmin123",
]);

export type PasswordPolicyIssue = {
  message: string;
};

export function evaluatePasswordStrength(
  password: string,
  context?: { email?: string; firstName?: string; lastName?: string },
): PasswordPolicyIssue[] {
  const issues: PasswordPolicyIssue[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push({
      message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    });
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    issues.push({
      message: `Le mot de passe ne peut pas dépasser ${MAX_PASSWORD_LENGTH} caractères.`,
    });
  }

  if (password !== password.trim()) {
    issues.push({
      message: "Le mot de passe ne doit pas commencer ou se terminer par un espace.",
    });
  }

  if (!/[a-z]/.test(password)) {
    issues.push({
      message: "Le mot de passe doit contenir au moins une lettre minuscule.",
    });
  }

  if (!/[A-Z]/.test(password)) {
    issues.push({
      message: "Le mot de passe doit contenir au moins une lettre majuscule.",
    });
  }

  if (!/\d/.test(password)) {
    issues.push({
      message: "Le mot de passe doit contenir au moins un chiffre.",
    });
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push({
      message: "Le mot de passe doit contenir au moins un caractère spécial.",
    });
  }

  const normalizedPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.has(normalizedPassword)) {
    issues.push({
      message: "Ce mot de passe est trop courant. Choisissez une phrase secrète unique.",
    });
  }

  const sensitiveValues = [context?.email, context?.firstName, context?.lastName]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => {
      const trimmed = value.trim().toLowerCase();
      const localPart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
      return [trimmed, localPart].filter((part) => part.length >= 3);
    });

  if (
    sensitiveValues.some((value) => normalizedPassword.includes(value))
  ) {
    issues.push({
      message:
        "Le mot de passe ne doit pas contenir l'adresse e-mail, le prénom ou le nom.",
    });
  }

  return issues;
}
