import { FeaturedDmsHomeSection } from "@/components/sections/featured-dms";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { HeroSection } from "@/components/sections/hero";
import { StructuralProblemSection } from "@/components/sections/structural-problem";
import { createHomeMetadata } from "@/lib/metadata";

export const metadata = createHomeMetadata();

/**
 * CEOS Home — entry (Sprint 001).
 * Hero (CLEVONE SARL) → CLEVONE DMS → Challenge teaser → Contact CTA.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedDmsHomeSection />
      <StructuralProblemSection />
      <FinalCtaSection />
    </>
  );
}
