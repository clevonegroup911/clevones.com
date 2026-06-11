import { createHomeMetadata } from "@/lib/metadata";

import { ClientFilteringSection } from "@/components/sections/client-filtering";
import { EcosystemPreviewSection } from "@/components/sections/ecosystem-preview";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { HeroSection } from "@/components/sections/hero";
import { InsightsPreviewSection } from "@/components/sections/insights-preview";
import { MethodologyPreviewSection } from "@/components/sections/methodology-preview";
import { PositioningSection } from "@/components/sections/positioning";
import { StrategicPillarsSection } from "@/components/sections/strategic-pillars";
import { StructuralProblemSection } from "@/components/sections/structural-problem";

export const metadata = createHomeMetadata();

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PositioningSection />
      <StructuralProblemSection />
      <MethodologyPreviewSection />
      <StrategicPillarsSection />
      <EcosystemPreviewSection />
      <ClientFilteringSection />
      <InsightsPreviewSection />
      <FinalCtaSection />
    </>
  );
}
