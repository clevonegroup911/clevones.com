import { createHomeMetadata } from "@/lib/metadata";

import { FinalCtaSection } from "@/components/sections/final-cta";
import { HeroSection } from "@/components/sections/hero";
import { StructuralProblemSection } from "@/components/sections/structural-problem";

export const metadata = createHomeMetadata();

/**
 * CEOS Home — entry only (Mission #002.5).
 * Narrative handoff: Hero → Challenge teaser → institutional Contact CTA.
 * Why Clevones bridge deferred (content retained in pages.home.whyClevones).
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StructuralProblemSection />
      <FinalCtaSection />
    </>
  );
}
