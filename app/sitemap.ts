import type { MetadataRoute } from "next";

import { insightArticles } from "@/lib/insights-page";
import { siteConfig } from "@/lib/site";

const publicRoutes = [
  { path: "/", priority: 1 },
  { path: "/positioning", priority: 0.9 },
  { path: "/methodology", priority: 0.9 },
  { path: "/ecosystem", priority: 0.85 },
  { path: "/governance", priority: 0.85 },
  { path: "/insights", priority: 0.8 },
  { path: "/contact", priority: 0.8 },
  { path: "/mission", priority: 0.6 },
  { path: "/positionnement", priority: 0.6 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries = publicRoutes.map(({ path, priority }) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified,
    changeFrequency: "monthly" as const,
    priority,
  }));

  const insightEntries = insightArticles.map((article) => ({
    url: new URL(`/insights/${article.slug}`, siteConfig.url).toString(),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...insightEntries];
}
