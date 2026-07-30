import { PrivacyPage } from "@/components/sections/privacy-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("en").pages.privacy.meta,
  path: "/privacy",
  locale: "en",
  pageKey: "privacy",
  hrefLang: true,
  robots: { index: false, follow: true },
});

export default function PrivacyPageRoute() {
  return <PrivacyPage />;
}
