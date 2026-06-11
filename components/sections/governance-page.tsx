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
import { clientFilters } from "@/lib/home";
import {
  governancePageCompliancePrinciples,
  governancePageCta,
  governancePageDataHandling,
  governancePageDoctrine,
  governancePageFiltering,
  governancePageHero,
  governancePageNotEligible,
} from "@/lib/governance-page";

export function GovernancePageContent() {
  return (
    <>
      <PageHero
        eyebrow={governancePageHero.eyebrow}
        title={governancePageHero.title}
        subtitle={governancePageHero.subtitle}
        tagline="Governed. Documented. Compliant."
      />

      <ProseSection
        eyebrow={governancePageDoctrine.eyebrow}
        title={governancePageDoctrine.title}
        paragraphs={governancePageDoctrine.paragraphs}
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow="Compliance principles"
            title="Structural requirements for every engagement"
            description="These principles are embedded in governance architecture — not applied selectively or after the fact."
          />
          <FeatureCardGrid>
            {governancePageCompliancePrinciples.map((principle) => (
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
        eyebrow={governancePageDataHandling.eyebrow}
        title={governancePageDataHandling.title}
        paragraphs={governancePageDataHandling.paragraphs}
      />

      <Section tone="charcoal" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={governancePageFiltering.eyebrow}
            title={governancePageFiltering.title}
            description={governancePageFiltering.description}
            tone="inverse"
          />
          <ClientFilterCardGrid filters={clientFilters} />
        </Container>
      </Section>

      <StickyAsideSection
        eyebrow={governancePageNotEligible.eyebrow}
        title={governancePageNotEligible.title}
      >
        <div>
          <div className={proseStack}>
            {governancePageNotEligible.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="mt-10 space-y-4">
            {governancePageNotEligible.exclusions.map((exclusion) => (
              <li
                key={exclusion}
                className="flex gap-4 text-sm leading-relaxed text-muted"
              >
                <Badge
                  variant="outline"
                  className="mt-0.5 shrink-0 border-border-subtle text-gray-muted"
                >
                  Excluded
                </Badge>
                <span>{exclusion}</span>
              </li>
            ))}
          </ul>
        </div>
      </StickyAsideSection>

      <PageCtaSection
        title={governancePageCta.title}
        description={governancePageCta.description}
        actions={[
          {
            href: governancePageCta.href,
            label: governancePageCta.label,
          },
        ]}
      />
    </>
  );
}
