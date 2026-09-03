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
  dashboard: "/admin/dashboard",
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
  if (!pathname || !isAdminProtectedPath(pathname)) {
    return adminRoutes.dashboard;
  }

  return value;
}
