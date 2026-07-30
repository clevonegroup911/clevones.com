import { Container } from "@/components/ui/container";
import { InsightCard } from "@/components/ui/insight-card";
import { Section } from "@/components/ui/section";
import { SectionHeaderRow } from "@/components/ui/section-header-row";
import { TextLink } from "@/components/ui/text-link";
import { cardGrid3 } from "@/lib/ui-classes";
import { getPathForPage } from "@/lib/i18n";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

export async function InsightsPreviewSection() {
  const { locale, pages } = await getLocaleContent();
  const insights = pages.home.insights;
  const insightsPath = getPathForPage("insights", locale) ?? "/insights";
  return (
    <Section tone="default" spacing="md">
      <Container>
        <SectionHeaderRow
          eyebrow={insights.eyebrow}
          title={insights.title}
          description={insights.description}
          action={
            <TextLink href={insights.href}>{insights.linkLabel}</TextLink>
          }
        />
        <div className={cardGrid3}>
          {insights.articles.map((article) => (
            <InsightCard
              key={article.slug}
              article={article}
              href={`${insightsPath}/${article.slug}`}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
