import type { SecretStatusItem } from "@/lib/x200/actions/types";

/**
 * Secrets status only — never values.
 * If provider not configured → ROTATION_UNAVAILABLE / MISSING.
 */
export function buildSecretsStatus(
  env: NodeJS.ProcessEnv = process.env,
): SecretStatusItem[] {
  const items: Array<{
    id: string;
    envKey: string;
    provider: string;
  }> = [
    { id: "database", envKey: "DATABASE_URL", provider: "postgres-env" },
    { id: "auth_secret", envKey: "AUTH_SECRET", provider: "app-env" },
    { id: "app_origin", envKey: "APP_ORIGIN", provider: "app-env" },
  ];

  return items.map((item) => {
    const configured = Boolean(env[item.envKey]?.trim());
    // No rotation provider wired in-repo.
    const rotationProvider = env.SECRET_ROTATION_PROVIDER?.trim();
    if (!configured) {
      return {
        id: item.id,
        configured: false,
        provider: item.provider,
        lastRotation: null,
        expiry: null,
        rotationRequired: true,
        status: "MISSING" as const,
      };
    }
    if (!rotationProvider) {
      return {
        id: item.id,
        configured: true,
        provider: item.provider,
        lastRotation: null,
        expiry: null,
        rotationRequired: false,
        status: "ROTATION_UNAVAILABLE" as const,
      };
    }
    return {
      id: item.id,
      configured: true,
      provider: rotationProvider,
      lastRotation: null,
      expiry: null,
      rotationRequired: false,
      status: "CONFIGURED" as const,
    };
  });
}
