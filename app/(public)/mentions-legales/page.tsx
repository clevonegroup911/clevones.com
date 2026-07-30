import { createPageMetadata } from "@/lib/metadata";

import { LegalPage } from "@/components/sections/legal-page";
import { getContent } from "@/lib/i18n";

export const metadata = createPageMetadata({
  ...getContent("fr").pages.legal.meta,
  path: "/mentions-legales",
  locale: "fr",
  pageKey: "legal",
  hrefLang: true,
  robots: { index: false, follow: true },
});

export default function MentionsLegalesPage() {
  return <LegalPage />;
}
