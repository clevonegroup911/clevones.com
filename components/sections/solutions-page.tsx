import { FeaturedDmsSection } from "@/components/sections/featured-dms";
import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

export async function SolutionsPageContent() {
  const { pages } = await getLocaleContent();
  const solutions = pages.solutions;
  return (
    <>
      <PageHero
        eyebrow={solutions.hero.eyebrow}
        title={solutions.hero.title}
        subtitle={solutions.hero.subtitle}
        tagline={solutions.hero.tagline}
      />

      <ProseSection
        eyebrow={solutions.introduction.eyebrow}
        title={solutions.introduction.title}
        paragraphs={solutions.introduction.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <FeaturedDmsSection content={solutions.featuredProduct} tone="elevated" />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={solutions.domains.eyebrow}
            title={solutions.domains.title}
            description={solutions.domains.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {solutions.domains.items.map((domain) => (
              <FeatureCard
                key={domain.title}
                title={domain.title}
                description={
                  domain.ecosystemLink
                    ? `${domain.description} ${domain.ecosystemLink}.`
                    : domain.description
                }
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={solutions.howEngagementWorks.eyebrow}
            title={solutions.howEngagementWorks.title}
          />
          <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-3 sm:gap-6">
            {solutions.howEngagementWorks.steps.map((step, index) => (
              <FeatureCard
                key={step.title}
                title={`${String(index + 1).padStart(2, "0")} — ${step.title}`}
                description={step.description}
              />
            ))}
          </div>
        </Container>
      </Section>

      <PageCtaSection
        title={solutions.cta.title}
        description={solutions.cta.description}
        actions={solutions.cta.actions.map((action) =>
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
