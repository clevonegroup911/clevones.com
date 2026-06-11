import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { InsightCard } from "@/components/ui/insight-card";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cardGrid3 } from "@/lib/ui-classes";
import { homeCta } from "@/lib/home";
import {
  insightArticles,
  insightCategories,
  insightsPageHero,
  insightsPageIntroduction,
} from "@/lib/insights-page";

export function InsightsPageContent() {
  return (
    <>
      <PageHero
        eyebrow={insightsPageHero.eyebrow}
        title={insightsPageHero.title}
        subtitle={insightsPageHero.subtitle}
        tagline={insightsPageHero.tagline}
      />

      <ProseSection
        eyebrow={insightsPageIntroduction.eyebrow}
        title={insightsPageIntroduction.title}
        paragraphs={insightsPageIntroduction.paragraphs}
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow="Categories"
            title="Areas of strategic analysis"
            description="Clevones Insights organizes analysis across the governance domains that shape territorial economic outcomes."
          />
          <div className="mt-10 flex flex-wrap gap-3">
            {insightCategories.map((category) => (
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
            eyebrow="Latest notes"
            title="Strategic perspectives"
            description="Institutional analysis on governance, coordination, and investment-readiness across African territorial economic systems."
          />
          <div className={cardGrid3}>
            {insightArticles.map((article) => (
              <InsightCard
                key={article.slug}
                article={article}
                showBadge
              />
            ))}
          </div>
        </Container>
      </Section>

      <PageCtaSection
        title="Turn governance insight into structured territorial action."
        description="Institutions, investors, and strategic partners can submit documented initiatives for governed assessment under the Clevones framework."
        actions={[
          {
            href: homeCta.initiative.href,
            label: homeCta.initiative.label,
          },
          {
            href: homeCta.collaboration.href,
            label: homeCta.collaboration.label,
            variant: "outline",
            className: "border-border text-white hover:bg-navy-hover w-full sm:w-auto",
          },
        ]}
      />
    </>
  );
}
