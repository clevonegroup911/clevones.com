import { LegalPage } from "@/components/sections/legal-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("en").pages.legal.meta,
  path: "/legal-notice",
  locale: "en",
  pageKey: "legal",
  hrefLang: true,
  robots: { index: false, follow: true },
});

export default function LegalNoticePage() {
  return <LegalPage />;
}
