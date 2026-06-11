import { cn } from "@/lib/utils";

import { Divider } from "@/components/ui/divider";
import { Eyebrow, Heading } from "@/components/ui/heading";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "default" | "inverse";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "default",
  className,
}: SectionHeadingProps) {
  const isInverse = tone === "inverse";

  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <Eyebrow tone={isInverse ? "inverse" : "default"} className="mb-3">
          {eyebrow}
        </Eyebrow>
      )}
      <Divider
        variant="gold"
        accent
        className={cn("mb-6", align === "center" && "mx-auto")}
      />
      <Heading level={2} tone={isInverse ? "inverse" : "default"} align={align}>
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed text-pretty sm:text-lg",
            isInverse ? "text-gray-muted" : "text-muted",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
