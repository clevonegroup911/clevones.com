import { type ReactNode } from "react";

import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

type SectionHeaderRowProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeaderRow({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeaderRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className,
      )}
    >
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        className="max-w-2xl min-w-0"
      />
      {action ? (
        <div className="shrink-0 sm:pb-1">{action}</div>
      ) : null}
    </div>
  );
}
