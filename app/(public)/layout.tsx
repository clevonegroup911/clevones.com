import { headers } from "next/headers";

import { SiteShell } from "@/components/layout/site-shell";
import { trackPageView } from "@/lib/analytics";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  await trackPageView({
    path: requestHeaders.get("x-pathname") || "/",
    locale: requestHeaders.get("x-locale"),
    actorKind: "ANONYMOUS",
  });

  return <SiteShell>{children}</SiteShell>;
}
