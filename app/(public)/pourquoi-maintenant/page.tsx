import { WhyNowPageSection } from "@/components/sections/why-now-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("fr").pages.whyNow.meta,
  path: "/pourquoi-maintenant",
  locale: "fr",
  pageKey: "whyNow",
  hrefLang: true,
});

export default function PourquoiMaintenantPage() {
  return <WhyNowPageSection />;
}
