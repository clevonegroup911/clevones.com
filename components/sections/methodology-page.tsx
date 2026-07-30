import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

import { MethodologySteps } from "./methodology-steps";

export async function MethodologyPageContent() {
  const { pages } = await getLocaleContent();
  const methodology = pages.methodology;
  return (
    <>
      <PageHero
        eyebrow={methodology.hero.eyebrow}
        title={methodology.hero.title}
        subtitle={methodology.hero.subtitle}
        tagline={methodology.hero.tagline}
      />

      <ProseSection
        eyebrow={methodology.introduction.eyebrow}
        title={methodology.introduction.title}
        paragraphs={methodology.introduction.paragraphs}
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={methodology.hero.eyebrow}
            title={methodology.hero.title}
          />
          <div className="mt-14">
            <MethodologySteps steps={methodology.steps} />
          </div>
        </Container>
      </Section>

      <Section tone="muted" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={methodology.hero.eyebrow}
            title={methodology.hero.title}
          />
          <FeatureCardGrid>
            {methodology.principles.map((principle) => (
              <FeatureCard
                key={principle.title}
                title={principle.title}
                description={principle.description}
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <PageCtaSection
        title={methodology.cta.title}
        description={methodology.cta.description}
        actions={[...methodology.cta.actions]}
      />
    </>
  );
}
