import type { MetadataRoute } from "next";

import { insightArticles } from "@/lib/insights-page";
import { siteConfig } from "@/lib/site";

const publicRoutes = [
  { path: "/", priority: 1 },
  { path: "/en", priority: 0.98 },
  { path: "/challenge", priority: 0.96 },
  { path: "/defi", priority: 0.96 },
  { path: "/why-now", priority: 0.95 },
  { path: "/pourquoi-maintenant", priority: 0.95 },
  { path: "/positioning", priority: 0.94 },
  { path: "/positionnement", priority: 0.94 },
  { path: "/about", priority: 0.9 },
  { path: "/mission", priority: 0.9 },
  { path: "/solutions", priority: 0.9 },
  { path: "/domaines", priority: 0.9 },
  { path: "/solutions/clevone-dms", priority: 0.88 },
  { path: "/domaines/clevone-dms", priority: 0.88 },
  { path: "/methodology", priority: 0.9 },
  { path: "/methodologie", priority: 0.9 },
  { path: "/governance", priority: 0.88 },
  { path: "/gouvernance", priority: 0.88 },
  { path: "/ecosystem", priority: 0.92 },
  { path: "/ecosysteme", priority: 0.92 },
  { path: "/evidence", priority: 0.91 },
  { path: "/preuves", priority: 0.91 },
  { path: "/faq", priority: 0.8 },
  { path: "/questions-frequentes", priority: 0.8 },
  { path: "/contact", priority: 0.85 },
  { path: "/collaboration", priority: 0.85 },
  /** Secondary editorial path — not primary CEOS journey. */
  { path: "/insights", priority: 0.65 },
  { path: "/analyses", priority: 0.65 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries = publicRoutes.map(({ path, priority }) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified,
    changeFrequency: "monthly" as const,
    priority,
  }));

  const insightEntries = insightArticles.flatMap((article) =>
    (["/insights", "/analyses"] as const).map((base) => ({
      url: new URL(`${base}/${article.slug}`, siteConfig.url).toString(),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );

  return [...staticEntries, ...insightEntries];
}
