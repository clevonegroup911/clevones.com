import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

export async function StrategicPillarsSection() {
  const { pages } = await getLocaleContent();
  const pillars = pages.home.pillars;
  return (
    <Section tone="default" spacing="md" bordered="top">
      <Container>
        <SectionHeading
          eyebrow={pillars.eyebrow}
          title={pillars.title}
          description={pillars.description}
        />
        <FeatureCardGrid>
          {pillars.items.map((pillar) => (
            <FeatureCard
              key={pillar.title}
              title={pillar.title}
              description={pillar.description}
            />
          ))}
        </FeatureCardGrid>
      </Container>
    </Section>
  );
}
