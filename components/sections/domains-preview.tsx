import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { homeDomainsPreview } from "@/lib/home";

export function DomainsPreviewSection() {
  return (
    <Section tone="elevated" spacing="md" bordered="top">
      <Container>
        <SectionHeading
          eyebrow={homeDomainsPreview.eyebrow}
          title={homeDomainsPreview.title}
          description={homeDomainsPreview.description}
        />
        <FeatureCardGrid className="mt-10 sm:mt-12">
          {homeDomainsPreview.domains.map((domain) => (
            <FeatureCard
              key={domain.id}
              title={domain.title}
              description={domain.architectureRole}
            />
          ))}
        </FeatureCardGrid>
        <p className="mt-8 text-sm text-muted sm:mt-10">
          <TextLink href={homeDomainsPreview.href}>
            {homeDomainsPreview.linkLabel}
          </TextLink>
        </p>
      </Container>
    </Section>
  );
}
