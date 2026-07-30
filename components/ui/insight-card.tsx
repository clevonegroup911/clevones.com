import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type InsightCardData = {
  slug: string;
  category: string;
  title: string;
  abstract: string;
  readingTime: string;
};

type InsightCardProps = {
  article: InsightCardData;
  href?: string;
  className?: string;
  showBadge?: boolean;
};

export function InsightCard({
  article,
  href = `/insights/${article.slug}`,
  className,
  showBadge = false,
}: InsightCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group min-w-0 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
        className,
      )}
    >
      <Card
        variant="elevated"
        padding="md"
        className="flex h-full flex-col transition-colors group-hover:border-gold/20"
      >
        {showBadge ? (
          <Badge variant="gold" className="w-fit">
            {article.category}
          </Badge>
        ) : (
          <p className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
            {article.category}
          </p>
        )}
        <CardTitle
          className={cn("mt-4", !showBadge && "transition-colors group-hover:text-gold-muted")}
        >
          {article.title}
        </CardTitle>
        <CardDescription className="mt-3 flex-1 text-pretty">
          {article.abstract}
        </CardDescription>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border-subtle pt-5">
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            {article.readingTime}
          </span>
          <span className="text-sm font-medium text-muted transition-colors group-hover:text-foreground">
            Read insight →
          </span>
        </div>
      </Card>
    </Link>
  );
}
