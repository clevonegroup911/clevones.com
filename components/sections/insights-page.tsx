import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { InsightCard } from "@/components/ui/insight-card";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cardGrid3 } from "@/lib/ui-classes";
import { getPathForPage } from "@/lib/i18n";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

export async function InsightsPageContent() {
  const { locale, pages } = await getLocaleContent();
  const insights = pages.insights;
  const insightsPath = getPathForPage("insights", locale);
  return (
    <>
      <PageHero
        eyebrow={insights.hero.eyebrow}
        title={insights.hero.title}
        subtitle={insights.hero.subtitle}
        tagline={insights.hero.tagline}
      />

      <ProseSection
        eyebrow={insights.introduction.eyebrow}
        title={insights.introduction.title}
        paragraphs={insights.introduction.paragraphs}
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={insights.categories.eyebrow}
            title={insights.categories.title}
            description={insights.categories.description}
          />
          <div className="mt-10 flex flex-wrap gap-3">
            {insights.categories.items.map((category) => (
              <Badge key={category} variant="outline">
                {category}
              </Badge>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="elevated" spacing="lg">
        <Container>
          <SectionHeading
            eyebrow={insights.listing.eyebrow}
            title={insights.listing.title}
            description={insights.listing.description}
          />
          <div className={cardGrid3}>
            {insights.articles.map((article) => (
              <InsightCard
                key={article.slug}
                article={article}
                href={`${insightsPath}/${article.slug}`}
                showBadge
              />
            ))}
          </div>
        </Container>
      </Section>

      <PageCtaSection
        title={insights.cta.title}
        description={insights.cta.description}
        actions={insights.cta.actions.map((action) =>
          action.variant === "outline"
            ? {
                ...action,
                className:
                  "border-border text-white hover:bg-navy-hover w-full sm:w-auto",
              }
            : action,
        )}
      />
    </>
  );
}
