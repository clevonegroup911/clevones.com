import { ClientFilterCardGrid } from "@/components/ui/client-filter-card-grid";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

export async function ClientFilteringSection() {
  const { pages } = await getLocaleContent();
  const filters = pages.home.filters;
  return (
    <Section tone="charcoal" spacing="md" bordered="top">
      <Container>
        <SectionHeading
          eyebrow={filters.eyebrow}
          title={filters.title}
          description={filters.description}
          tone="inverse"
        />
        <ClientFilterCardGrid filters={filters.items} />
      </Container>
    </Section>
  );
}
