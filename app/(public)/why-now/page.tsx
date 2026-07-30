import { WhyNowPageSection } from "@/components/sections/why-now-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("en").pages.whyNow.meta,
  path: "/why-now",
  locale: "en",
  pageKey: "whyNow",
  hrefLang: true,
});

export default function WhyNowPage() {
  return <WhyNowPageSection />;
}
