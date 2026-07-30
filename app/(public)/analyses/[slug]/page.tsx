import { notFound } from "next/navigation";
import { InsightArticlePageContent } from "@/components/sections/insight-article-page";
import { getInsightArticle } from "@/lib/insights-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getContent("fr").pages.insights.articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = getInsightArticle(slug, "fr");
  if (!article) return {};
  return createPageMetadata({ title: article.title, description: article.abstract, path: `/analyses/${slug}`, locale: "fr" });
}

export default async function AnalysePage({ params }: Props) {
  const { slug } = await params;
  const article = getInsightArticle(slug, "fr");
  if (!article) notFound();
  return <InsightArticlePageContent article={article} locale="fr" />;
}
