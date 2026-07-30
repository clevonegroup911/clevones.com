import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

export async function DomainsPreviewSection() {
  const { pages } = await getLocaleContent();
  const domains = pages.home.domains;
  return (
    <Section tone="elevated" spacing="md" bordered="top">
      <Container>
        <SectionHeading
          eyebrow={domains.eyebrow}
          title={domains.title}
          description={domains.description}
        />
        <FeatureCardGrid className="mt-10 sm:mt-12">
          {domains.items.map((domain) => (
            <FeatureCard
              key={domain.id}
              title={domain.title}
              description={domain.description}
            />
          ))}
        </FeatureCardGrid>
        <p className="mt-8 text-sm text-muted sm:mt-10">
          <TextLink href={domains.href}>
            {domains.linkLabel}
          </TextLink>
        </p>
      </Container>
    </Section>
  );
}
