import { logoutPortalUser } from "@/app/(auth)/actions";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Sign out",
  description: "End the client portal session.",
  path: "/sign-out",
  robots: { index: false, follow: false },
});

/** Clears portal_session only (via logoutPortalUser) and redirects to /sign-in. */
export default async function SignOutPage() {
  await logoutPortalUser();
}
