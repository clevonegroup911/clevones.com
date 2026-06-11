import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { homeCta } from "@/lib/home";
import {
  methodologyPageCta,
  methodologyPageHero,
  methodologyPageIntroduction,
  methodologyPagePrinciples,
  methodologyPageSteps,
} from "@/lib/methodology-page";

import { MethodologySteps } from "./methodology-steps";

export function MethodologyPageContent() {
  return (
    <>
      <PageHero
        eyebrow={methodologyPageHero.eyebrow}
        title={methodologyPageHero.title}
        subtitle={methodologyPageHero.subtitle}
        tagline="Five phases. One governed sequence."
      />

      <ProseSection
        eyebrow={methodologyPageIntroduction.eyebrow}
        title={methodologyPageIntroduction.title}
        paragraphs={methodologyPageIntroduction.paragraphs}
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow="The five steps"
            title="Sequential phases of territorial governance"
            description="Each phase builds on the previous — producing documented outputs that inform the next stage of structural design."
          />
          <div className="mt-14">
            <MethodologySteps steps={methodologyPageSteps} />
          </div>
        </Container>
      </Section>

      <Section tone="muted" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow="Methodology principles"
            title="Foundations that govern every engagement"
            description="These principles are not aspirational values — they are structural requirements embedded in every phase of the framework."
          />
          <FeatureCardGrid>
            {methodologyPagePrinciples.map((principle) => (
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
        title={methodologyPageCta.title}
        description={methodologyPageCta.description}
        actions={[
          {
            href: homeCta.initiative.href,
            label: homeCta.initiative.label,
          },
        ]}
      />
    </>
  );
}
