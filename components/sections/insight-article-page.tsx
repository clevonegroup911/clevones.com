import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Divider } from "@/components/ui/divider";
import { Eyebrow, Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text-link";
import {
  buttonFullMobile,
  heroGridOverlay,
  heroGridOverlayStyle,
} from "@/lib/ui-classes";
import type { InsightArticle } from "@/lib/insights-page";

type InsightArticlePageContentProps = {
  article: InsightArticle;
};

export function InsightArticlePageContent({
  article,
}: InsightArticlePageContentProps) {
  return (
    <>
      <Section
        tone="navy"
        spacing="lg"
        bordered="bottom"
        className="relative overflow-hidden"
      >
        <div
          className={heroGridOverlay}
          style={heroGridOverlayStyle}
          aria-hidden
        />
        <Container className="relative">
          <div className="max-w-3xl">
            <TextLink href="/insights" className="min-h-0">
              ← All insights
            </TextLink>
            <Eyebrow tone="inverse" className="mt-8">
              Clevones Insights
            </Eyebrow>
            <Divider variant="gold" accent className="mt-6" />
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Badge variant="gold">{article.category}</Badge>
              <span className="text-xs font-medium tracking-wide text-gray-muted uppercase">
                {article.readingTime}
              </span>
            </div>
            <Heading as="h1" level={1} tone="inverse" className="mt-6">
              {article.title}
            </Heading>
            <p className="mt-6 text-base leading-relaxed text-gray-muted sm:text-lg">
              {article.abstract}
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="elevated" spacing="md">
        <Container size="prose">
          <p className="text-base leading-relaxed text-muted">
            Full analysis for this insight is forthcoming. Clevones Insights
            publishes strategic notes on territorial economic governance,
            institutional coordination, and investment-readiness across Africa.
          </p>
          <p className="mt-6 text-base leading-relaxed text-muted">
            For institutional inquiries related to this topic, initiate a
            structured collaboration through Clevones.
          </p>
          <div className="mt-8 sm:mt-10">
            <ButtonLink
              href="/contact"
              variant="secondary"
              size="lg"
              className={buttonFullMobile}
            >
              Initiate a strategic collaboration
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
