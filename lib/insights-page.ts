import { getContent } from "@/lib/i18n/content";
import type { InsightArticleContent } from "@/lib/i18n/content/pages/insights";
import { insightsPageContent } from "@/lib/i18n/content/pages/insights";
import type { Locale } from "@/lib/i18n/locales";

export type InsightArticle = InsightArticleContent;
export const insightArticles = insightsPageContent.en.articles;

export function getInsightArticle(slug: string, locale: Locale) {
  return getContent(locale).pages.insights.articles.find(
    (article) => article.slug === slug,
  );
}
