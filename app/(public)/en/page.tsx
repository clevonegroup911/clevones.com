import { FeaturedDmsHomeSection } from "@/components/sections/featured-dms";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { HeroSection } from "@/components/sections/hero";
import { StructuralProblemSection } from "@/components/sections/structural-problem";
import { getContent } from "@/lib/i18n";
import { createPageMetadata, enSiteTitle } from "@/lib/metadata";

const home = getContent("en").pages.home;

export const metadata = {
  ...createPageMetadata({
    title: home.meta.title,
    description: home.meta.description,
    path: "/en",
    locale: "en",
    pageKey: "home",
    hrefLang: true,
  }),
  title: {
    absolute: enSiteTitle,
  },
};

export default function EnglishHomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedDmsHomeSection />
      <StructuralProblemSection />
      <FinalCtaSection />
    </>
  );
}
