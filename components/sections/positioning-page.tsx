import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { StickyAsideSection } from "@/components/ui/sticky-aside-section";
import { proseStack } from "@/lib/ui-classes";
import { homeCta } from "@/lib/home";
import {
  positioningPageDefinition,
  positioningPageDistinction,
  positioningPageHero,
  positioningPageIs,
  positioningPageIsNot,
} from "@/lib/positioning-page";

export function PositioningPageContent() {
  return (
    <>
      <PageHero
        eyebrow={positioningPageHero.eyebrow}
        title={positioningPageHero.title}
        subtitle={positioningPageHero.subtitle}
        tagline="Neutral. Compliant. Non-operational."
      />

      <ProseSection
        eyebrow={positioningPageDefinition.eyebrow}
        title={positioningPageDefinition.title}
        paragraphs={positioningPageDefinition.paragraphs}
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow="What Clevones is"
            title="Roles of architecture, structure, and coordination"
            description="Clevones exercises a defined set of governance functions — each distinct from operational or commercial activity."
          />
          <FeatureCardGrid>
            {positioningPageIs.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <Section tone="muted" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow="What Clevones is not"
            title="Boundaries that preserve institutional neutrality"
            description="These exclusions are not limitations — they are structural guarantees that protect the integrity of every coordination engagement."
          />
          <FeatureCardGrid>
            {positioningPageIsNot.map((item) => (
              <Card
                key={item.title}
                variant="muted"
                padding="md"
                className="border-border-subtle"
              >
                <Badge
                  variant="outline"
                  className="mb-4 border-border-subtle text-gray-muted"
                >
                  Excluded role
                </Badge>
                <CardTitle className="text-gray-muted">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </Card>
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <StickyAsideSection
        eyebrow={positioningPageDistinction.eyebrow}
        title={positioningPageDistinction.title}
      >
        <div className={proseStack}>
          {positioningPageDistinction.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </StickyAsideSection>

      <PageCtaSection
        title="For institutions and partners who require governed territorial coordination."
        actions={[
          {
            href: homeCta.collaboration.href,
            label: homeCta.collaboration.label,
            className: "w-full max-w-md sm:w-auto",
          },
        ]}
      />
    </>
  );
}
