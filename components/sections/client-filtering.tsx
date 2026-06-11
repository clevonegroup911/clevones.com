import { ClientFilterCardGrid } from "@/components/ui/client-filter-card-grid";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { clientFilters } from "@/lib/home";

export function ClientFilteringSection() {
  return (
    <Section tone="charcoal" spacing="md" bordered="top">
      <Container>
        <SectionHeading
          eyebrow="Engagement criteria"
          title="Clevones is not designed for every actor."
          description="Engagement follows a deliberate filtering process. Only actors meeting institutional criteria proceed to structured coordination."
          tone="inverse"
        />
        <ClientFilterCardGrid filters={clientFilters} />
      </Container>
    </Section>
  );
}
