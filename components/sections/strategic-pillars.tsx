import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { strategicPillars } from "@/lib/home";

export function StrategicPillarsSection() {
  return (
    <Section tone="default" spacing="md" bordered="top">
      <Container>
        <SectionHeading
          eyebrow="Strategic pillars"
          title="Foundations of institutional intervention"
          description="Six principles govern every dimension of Clevones' territorial governance architecture."
        />
        <FeatureCardGrid>
          {strategicPillars.map((pillar) => (
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
