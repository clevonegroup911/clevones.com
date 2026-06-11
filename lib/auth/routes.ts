/** Route constants for future authentication and platform access. */
export const authRoutes = {
  signIn: "/sign-in",
  signOut: "/sign-out",
} as const;

export const platformRoutes = {
  portal: "/portal",
  dashboard: "/portal/dashboard",
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
