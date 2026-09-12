import { createPageMetadata } from "@/lib/metadata";

import SignInForm from "@/app/(auth)/sign-in/sign-in-form";
import { redirectIfPortalAuthenticated } from "@/lib/auth/require-portal";
import { platformRoutes } from "@/lib/auth/routes";

export const metadata = createPageMetadata({
  title: "Sign in",
  description: "Client portal sign-in for CLEVONE partners.",
  path: "/sign-in",
  robots: { index: false, follow: false },
});

export default async function SignInPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const resolvedSearchParams = searchParams
    ? await searchParams
    : undefined;
  const callbackUrlRaw = resolvedSearchParams?.callbackUrl;
  const callbackUrl =
    typeof callbackUrlRaw === "string" ? callbackUrlRaw : undefined;

  await redirectIfPortalAuthenticated(callbackUrl);

  return (
    <SignInForm callbackUrl={callbackUrl ?? platformRoutes.portal} />
  );
}
