import { Container } from "@/components/ui/container";
import { InsightCard } from "@/components/ui/insight-card";
import { Section } from "@/components/ui/section";
import { SectionHeaderRow } from "@/components/ui/section-header-row";
import { TextLink } from "@/components/ui/text-link";
import { cardGrid3 } from "@/lib/ui-classes";
import { insightArticles } from "@/lib/home";

export function InsightsPreviewSection() {
  return (
    <Section tone="default" spacing="md">
      <Container>
        <SectionHeaderRow
          eyebrow="Insights"
          title="Perspectives on territorial governance"
          description="Analysis on the structural conditions required for durable territorial economic value."
          action={
            <TextLink href="/insights">View all insights →</TextLink>
          }
        />
        <div className={cardGrid3}>
          {insightArticles.map((article) => (
            <InsightCard key={article.slug} article={article} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
