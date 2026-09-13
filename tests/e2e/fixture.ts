/**
 * E2E-only fixture identity. These values are synthetic and must never be
 * production credentials. Screenshots must not include typed secrets.
 */
export const E2E_ADMIN_EMAIL = "e2e.admin@example.test";
export const E2E_ADMIN_PASSWORD = "E2ePlaywright!Admin9";
/** RFC 4648 test vector — not a production TOTP secret. */
export const E2E_TOTP_SECRET_BASE32 = "JBSWY3DPEHPK3PXP";
export const E2E_ADMIN_ID = "e2e_t009_super_admin";
export const E2E_ADMIN_FIRST_NAME = "E2e";
export const E2E_ADMIN_LAST_NAME = "Admin";

/** Synthetic USER for portal sign-in e2e (never production). */
export const E2E_USER_EMAIL = "e2e.user@example.test";
export const E2E_USER_PASSWORD = "E2ePlaywright!User9";
export const E2E_USER_ID = "e2e_t033_portal_user";
export const E2E_USER_FIRST_NAME = "E2e";
export const E2E_USER_LAST_NAME = "Client";
