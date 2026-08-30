import { MissionPageContent } from "@/components/sections/mission-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

const about = getContent("fr").pages.about;

export const metadata = createPageMetadata({
  title: about.meta.title,
  description: about.meta.description,
  path: "/mission",
  locale: "fr",
  pageKey: "about",
  hrefLang: true,
});

export default function MissionPage() {
  return <MissionPageContent />;
}
