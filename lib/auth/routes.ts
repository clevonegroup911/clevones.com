/** Route constants for future authentication and platform access. */
export const authRoutes = {
  signIn: "/sign-in",
  signOut: "/sign-out",
} as const;

export const platformRoutes = {
  portal: "/portal",
  dashboard: "/portal/dashboard",
} as const;

export const adminRoutes = {
  root: "/admin",
  login: "/admin/login",
  mfaVerify: "/admin/login/mfa",
  dashboard: "/admin/dashboard",
  securityMfa: "/admin/security/mfa",
  cms: "/admin/cms",
  analytics: "/admin/analytics",
  payments: "/admin/payments",
} as const;

/** Paths that will require a session once auth is integrated. */
export const protectedPaths = [
  platformRoutes.portal,
  platformRoutes.dashboard,
] as const;

export function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isAdminPath(pathname: string): boolean {
  return pathname === adminRoutes.root || pathname.startsWith(`${adminRoutes.root}/`);
}

export function isAdminPublicPath(pathname: string): boolean {
  return (
    pathname === adminRoutes.login || pathname.startsWith(`${adminRoutes.login}/`)
  );
}

export function isAdminProtectedPath(pathname: string): boolean {
  return isAdminPath(pathname) && !isAdminPublicPath(pathname);
}

export function safeAdminCallbackUrl(value: string | null | undefined): string {
  if (!value) {
    return adminRoutes.dashboard;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return adminRoutes.dashboard;
  }

  const [pathname] = value.split("?");
  if (!pathname) {
    return adminRoutes.dashboard;
  }

  if (isAdminProtectedPath(pathname) || isProtectedPath(pathname)) {
    return value;
  }

  return adminRoutes.dashboard;
}

/** Portal post-login redirects: only /portal* (never /admin*). */
export function safePortalCallbackUrl(value: string | null | undefined): string {
  if (!value) {
    return platformRoutes.portal;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return platformRoutes.portal;
  }

  const [pathname] = value.split("?");
  if (!pathname) {
    return platformRoutes.portal;
  }

  if (isProtectedPath(pathname) && !isAdminPath(pathname)) {
    return value;
  }

  return platformRoutes.portal;
}
