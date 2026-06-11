import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createPageMetadata } from "@/lib/metadata";

import { InsightArticlePageContent } from "@/components/sections/insight-article-page";
import {
  getInsightArticle,
  insightArticles,
} from "@/lib/insights-page";

type InsightArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return insightArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: InsightArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getInsightArticle(slug);

  if (!article) {
    return { title: "Insight not found" };
  }

  return createPageMetadata({
    title: article.title,
    description: article.abstract,
    path: `/insights/${slug}`,
  });
}

export default async function InsightArticlePage({
  params,
}: InsightArticlePageProps) {
  const { slug } = await params;
  const article = getInsightArticle(slug);

  if (!article) {
    notFound();
  }

  return <InsightArticlePageContent article={article} />;
}
