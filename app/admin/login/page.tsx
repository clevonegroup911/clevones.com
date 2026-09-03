import { createPageMetadata } from "@/lib/metadata";

import LoginForm from "@/app/admin/login/login-form";
import { redirectIfAdminAuthenticated } from "@/lib/auth/require-admin";
import { adminRoutes } from "@/lib/auth";

export const metadata = createPageMetadata({
  title: "Admin login",
  description: "Secure administrative access for Clevones.",
  path: "/admin/login",
  robots: { index: false, follow: false },
});

export default async function AdminLoginPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
}>) {
  const resolvedSearchParams = searchParams
    ? await searchParams
    : undefined;
  const callbackUrlRaw = resolvedSearchParams?.callbackUrl;
  const callbackUrl =
    typeof callbackUrlRaw === "string" ? callbackUrlRaw : undefined;

  await redirectIfAdminAuthenticated(callbackUrl);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <LoginForm callbackUrl={callbackUrl ?? adminRoutes.dashboard} />
      </div>
    </div>
  );
}
