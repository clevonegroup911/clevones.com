import { MFA_CHALLENGE_TTL_SECONDS } from "@/lib/auth/mfa-config";

export const ADMIN_MFA_CHALLENGE_COOKIE = "admin_mfa_challenge";

export function getMfaChallengeCookieOptions(
  nodeEnv = process.env.NODE_ENV,
) {
  return {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "strict" as const,
    path: "/admin",
    maxAge: MFA_CHALLENGE_TTL_SECONDS,
  };
}
