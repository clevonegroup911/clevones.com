import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { homeCta } from "@/lib/home";
import {
  solutionsPageCta,
  solutionsPageDomains,
  solutionsPageHero,
  solutionsPageHow,
  solutionsPageIntroduction,
} from "@/lib/solutions-page";

export function SolutionsPageContent() {
  return (
    <>
      <PageHero
        eyebrow={solutionsPageHero.eyebrow}
        title={solutionsPageHero.title}
        subtitle={solutionsPageHero.subtitle}
        tagline={solutionsPageHero.tagline}
      />

      <ProseSection
        eyebrow={solutionsPageIntroduction.eyebrow}
        title={solutionsPageIntroduction.title}
        paragraphs={solutionsPageIntroduction.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow="Domains"
            title="Nine fields. One architectural mandate."
            description="Each domain is a lawful field of intervention. Engagement remains architectural: structure, coordinate, report — without substituting operational actors."
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {solutionsPageDomains.map((domain) => (
              <FeatureCard
                key={domain.id}
                title={domain.title}
                description={
                  domain.ecosystemLink
                    ? `${domain.architectureRole} Related ecosystem: ${domain.ecosystemLink}.`
                    : domain.architectureRole
                }
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={solutionsPageHow.eyebrow}
            title={solutionsPageHow.title}
          />
          <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-3 sm:gap-6">
            {solutionsPageHow.steps.map((step, index) => (
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
        title={solutionsPageCta.title}
        description={solutionsPageCta.description}
        actions={[
          {
            href: homeCta.initiative.href,
            label: homeCta.initiative.label,
          },
          {
            href: "/methodology",
            label: "View methodology",
            variant: "outline",
            className:
              "border-border text-white hover:bg-navy-hover w-full sm:w-auto",
          },
        ]}
      />
    </>
  );
}
