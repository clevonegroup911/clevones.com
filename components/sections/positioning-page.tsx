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
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

/**
 * Unified Positioning page (EN/FR) — content from `pages.positioning`.
 */
export async function PositioningPageContent() {
  const { pages } = await getLocaleContent();
  const positioning = pages.positioning;

  return (
    <>
      <PageHero
        eyebrow={positioning.hero.eyebrow}
        title={positioning.hero.title}
        subtitle={positioning.hero.subtitle}
        tagline={positioning.hero.tagline}
      />

      <ProseSection
        eyebrow={positioning.definition.eyebrow}
        title={positioning.definition.title}
        paragraphs={positioning.definition.paragraphs}
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={positioning.isSection.eyebrow}
            title={positioning.isSection.title}
            description={positioning.isSection.description}
          />
          <FeatureCardGrid>
            {positioning.isSection.items.map((item) => (
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
            eyebrow={positioning.isNotSection.eyebrow}
            title={positioning.isNotSection.title}
            description={positioning.isNotSection.description}
          />
          <FeatureCardGrid>
            {positioning.isNotSection.items.map((item) => (
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
                  {positioning.isNotSection.excludedLabel}
                </Badge>
                <CardTitle className="text-gray-muted">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </Card>
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <StickyAsideSection
        eyebrow={positioning.distinction.eyebrow}
        title={positioning.distinction.title}
      >
        <div className={proseStack}>
          {positioning.distinction.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </StickyAsideSection>

      <ProseSection
        eyebrow={positioning.corporatePurpose.eyebrow}
        title={positioning.corporatePurpose.title}
        paragraphs={positioning.corporatePurpose.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <Section tone="default" spacing="sm" bordered="bottom">
        <Container size="prose">
          <p className="text-sm leading-relaxed text-muted">
            {positioning.miningDisclaimer}
          </p>
        </Container>
      </Section>

      <PageCtaSection
        title={positioning.cta.title}
        description={positioning.cta.description}
        actions={positioning.cta.actions.map((action) => ({
          href: action.href,
          label: action.label,
          variant: action.variant === "outline" ? "outline" : "secondary",
          className:
            action.variant === "outline"
              ? "border-border text-white hover:bg-navy-hover w-full sm:w-auto"
              : "w-full max-w-md sm:w-auto",
        }))}
      />
    </>
  );
}
