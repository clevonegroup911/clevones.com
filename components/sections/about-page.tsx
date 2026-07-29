import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  aboutPageCta,
  aboutPageDevelopment,
  aboutPageDomains,
  aboutPageHero,
  aboutPageIdentity,
  aboutPageMission,
  aboutPageVision,
} from "@/lib/about-page";
import { homeCta } from "@/lib/home";

export function AboutPageContent() {
  return (
    <>
      <PageHero
        eyebrow={aboutPageHero.eyebrow}
        title={aboutPageHero.title}
        subtitle={aboutPageHero.subtitle}
        tagline={aboutPageHero.tagline}
      />

      <ProseSection
        eyebrow={aboutPageVision.eyebrow}
        title={aboutPageVision.title}
        paragraphs={aboutPageVision.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <ProseSection
        eyebrow={aboutPageMission.eyebrow}
        title={aboutPageMission.title}
        paragraphs={aboutPageMission.paragraphs}
        tone="default"
        bordered="bottom"
      />

      <ProseSection
        eyebrow={aboutPageIdentity.eyebrow}
        title={aboutPageIdentity.title}
        paragraphs={aboutPageIdentity.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={aboutPageDomains.eyebrow}
            title={aboutPageDomains.title}
            description={aboutPageDomains.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {aboutPageDomains.domains.map((domain) => (
              <FeatureCard
                key={domain.id}
                title={domain.title}
                description={
                  domain.ecosystemLink
                    ? `${domain.architectureRole} Ecosystem link: ${domain.ecosystemLink}.`
                    : domain.architectureRole
                }
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <ProseSection
        eyebrow={aboutPageDevelopment.eyebrow}
        title={aboutPageDevelopment.title}
        paragraphs={aboutPageDevelopment.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <PageCtaSection
        title={aboutPageCta.title}
        description={aboutPageCta.description}
        actions={[
          {
            href: homeCta.collaboration.href,
            label: homeCta.collaboration.label,
          },
          {
            href: "/solutions",
            label: "Explore domains of intervention",
            variant: "outline",
            className:
              "border-border text-white hover:bg-navy-hover w-full sm:w-auto",
          },
        ]}
      />
    </>
  );
}
