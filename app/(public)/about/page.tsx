import { AboutPageContent } from "@/components/sections/about-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

const about = getContent("en").pages.about;

export const metadata = createPageMetadata({
  title: about.meta.title,
  description: about.meta.description,
  path: "/about",
  pageKey: "about",
  hrefLang: true,
});

export default function AboutPage() {
  return <AboutPageContent />;
}
