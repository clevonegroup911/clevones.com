import { Badge } from "@/components/ui/badge";
import { ClientFilterCardGrid } from "@/components/ui/client-filter-card-grid";
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

export async function GovernancePageContent() {
  const { pages } = await getLocaleContent();
  const governance = pages.governance;
  return (
    <>
      <PageHero
        eyebrow={governance.hero.eyebrow}
        title={governance.hero.title}
        subtitle={governance.hero.subtitle}
        tagline={governance.hero.tagline}
      />

      <ProseSection
        eyebrow={governance.doctrine.eyebrow}
        title={governance.doctrine.title}
        paragraphs={governance.doctrine.paragraphs}
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={governance.compliance.eyebrow}
            title={governance.compliance.title}
            description={governance.compliance.description}
          />
          <FeatureCardGrid>
            {governance.compliance.items.map((principle) => (
              <FeatureCard
                key={principle.title}
                title={principle.title}
                description={principle.description}
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <ProseSection
        eyebrow={governance.dataHandling.eyebrow}
        title={governance.dataHandling.title}
        paragraphs={governance.dataHandling.paragraphs}
      />

      <Section tone="charcoal" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={governance.filtering.eyebrow}
            title={governance.filtering.title}
            description={governance.filtering.description}
            tone="inverse"
          />
          <ClientFilterCardGrid filters={governance.filtering.filters} />
        </Container>
      </Section>

      <StickyAsideSection
        eyebrow={governance.notEligible.eyebrow}
        title={governance.notEligible.title}
      >
        <div>
          <div className={proseStack}>
            {governance.notEligible.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="mt-10 space-y-4">
            {governance.notEligible.exclusions.map((exclusion) => (
              <li
                key={exclusion}
                className="flex gap-4 text-sm leading-relaxed text-muted"
              >
                <Badge
                  variant="outline"
                  className="mt-0.5 shrink-0 border-border-subtle text-gray-muted"
                >
                  {governance.notEligible.excludedLabel}
                </Badge>
                <span>{exclusion}</span>
              </li>
            ))}
          </ul>
        </div>
      </StickyAsideSection>

      <PageCtaSection
        title={governance.cta.title}
        description={governance.cta.description}
        actions={[...governance.cta.actions]}
      />
    </>
  );
}
