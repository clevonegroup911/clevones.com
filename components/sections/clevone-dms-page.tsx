import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

export async function ClevoneDmsPageContent() {
  const { pages } = await getLocaleContent();
  const page = pages.clevoneDms;

  return (
    <>
      <PageHero
        eyebrow={page.hero.eyebrow}
        title={page.hero.title}
        subtitle={page.hero.subtitle}
        tagline={page.hero.tagline}
      />

      <ProseSection
        eyebrow={page.overview.eyebrow}
        title={page.overview.title}
        paragraphs={page.overview.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={page.capabilities.eyebrow}
            title={page.capabilities.title}
            description={page.capabilities.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {page.capabilities.items.map((item) => (
              <FeatureCard
                key={item.name}
                title={item.name}
                description={item.description}
              />
            ))}
          </FeatureCardGrid>
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted">
            {page.capabilities.note}
          </p>
        </Container>
      </Section>

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={page.audience.eyebrow}
            title={page.audience.title}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {page.audience.items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <PageCtaSection
        title={page.cta.title}
        description={page.cta.description}
        actions={page.cta.actions.map((action) =>
          action.variant === "outline"
            ? {
                ...action,
                className:
                  "border-border text-white hover:bg-navy-hover w-full sm:w-auto",
              }
            : action,
        )}
      />
    </>
  );
}
