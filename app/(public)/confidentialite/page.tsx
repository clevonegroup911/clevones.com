import { createPageMetadata } from "@/lib/metadata";

import { PrivacyPage } from "@/components/sections/privacy-page";
import { getContent } from "@/lib/i18n";

export const metadata = createPageMetadata({
  ...getContent("fr").pages.privacy.meta,
  path: "/confidentialite",
  locale: "fr",
  pageKey: "privacy",
  hrefLang: true,
  robots: { index: false, follow: true },
});

export default function ConfidentialitePage() {
  return <PrivacyPage />;
}
