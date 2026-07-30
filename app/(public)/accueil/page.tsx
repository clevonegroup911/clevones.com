import { FinalCtaSection } from "@/components/sections/final-cta";
import { HeroSection } from "@/components/sections/hero";
import { StructuralProblemSection } from "@/components/sections/structural-problem";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("fr").pages.home.meta,
  path: "/accueil",
  locale: "fr",
  pageKey: "home",
  hrefLang: true,
});

export default function AccueilPage() {
  return (
    <>
      <HeroSection />
      <StructuralProblemSection />
      <FinalCtaSection />
    </>
  );
}
