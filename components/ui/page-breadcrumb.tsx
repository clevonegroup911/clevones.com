import Link from "next/link";

import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageBreadcrumbProps = {
  items: readonly BreadcrumbItem[];
  ariaLabel: string;
  className?: string;
};

/**
 * Accessible breadcrumb trail for institutional pages.
 * Current page is text-only (no link); ancestors are links.
 */
export function PageBreadcrumb({
  items,
  ariaLabel,
  className,
}: PageBreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className={cn("mb-6 sm:mb-8", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gold-muted/90">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden className="text-gold-muted/50">
                  /
                </span>
              ) : null}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "text-gold-muted" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
