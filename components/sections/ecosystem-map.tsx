import { CompanyEntityLink } from "@/components/layout/company-contact";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cardAccentLine } from "@/lib/ui-classes";
import type { EcosystemEntityContent } from "@/lib/i18n/content/pages";
import { cn } from "@/lib/utils";

type EcosystemMapProps = {
  central: EcosystemEntityContent;
  neutral: readonly EcosystemEntityContent[];
  operational?: EcosystemEntityContent;
  centralBadge: string;
  operationalBadge: string;
  separationLabel: string;
};

function EntityCard({
  entity,
  variant = "neutral",
  centralBadge,
  operationalBadge,
  className,
}: {
  entity: EcosystemEntityContent;
  variant?: "central" | "neutral" | "operational";
  centralBadge: string;
  operationalBadge: string;
  className?: string;
}) {
  const isCentral = variant === "central";
  const isOperational = variant === "operational";

  return (
    <Card
      variant={isOperational ? "outlined" : isCentral ? "elevated" : "default"}
      padding="md"
      className={cn(
        "relative h-full transition-colors",
        isCentral &&
          "border-gold/25 bg-surface-elevated shadow-[0_0_40px_-12px_rgba(212,160,23,0.15)]",
        isOperational && "border-gold/30 bg-gold-subtle/30",
        !isCentral && !isOperational && "hover:border-border-subtle",
        className,
      )}
    >
      {!isCentral && !isOperational ? (
        <div className={cn(cardAccentLine, "group-hover:w-8")} aria-hidden />
      ) : null}
      {isCentral && (
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gold/40" aria-hidden />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            {centralBadge}
          </span>
          <div className="h-px flex-1 bg-gold/40" aria-hidden />
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CardTitle
          className={cn("text-base sm:text-lg", isCentral && "text-lg sm:text-xl")}
        >
          {entity.name}
        </CardTitle>
        {isOperational && (
          <Badge variant="outline" className="border-gold/30 text-gold-muted">
            {operationalBadge}
          </Badge>
        )}
      </div>
      <p className="text-xs font-medium tracking-wide text-gold-muted/90">
        {entity.role}
      </p>
      <CardDescription className="mt-3">{entity.description}</CardDescription>
      <CompanyEntityLink
        href={entity.href}
        name={entity.name}
        internal={entity.internal}
        className="mt-4 inline-block text-xs font-medium tracking-wide text-navy-muted transition-colors hover:text-gold-muted focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        {entity.domain}
      </CompanyEntityLink>
    </Card>
  );
}

export function EcosystemMap({
  central,
  neutral,
  operational,
  centralBadge,
  operationalBadge,
  separationLabel,
}: EcosystemMapProps) {
  return (
    <div className="mt-10 sm:mt-12 lg:mt-14">
      <div className="mx-auto max-w-2xl">
        <EntityCard
          entity={central}
          variant="central"
          centralBadge={centralBadge}
          operationalBadge={operationalBadge}
        />
      </div>

      <div
        className="mx-auto my-8 h-8 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-gold/40 sm:h-10"
        aria-hidden
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {neutral.map((entity) => (
          <EntityCard
            key={entity.name}
            entity={entity}
            variant="neutral"
            centralBadge={centralBadge}
            operationalBadge={operationalBadge}
          />
        ))}
      </div>

      {operational ? (
        <div className="mt-10 flex flex-col items-center gap-4 sm:mt-12">
          <div
            className="h-px w-full max-w-xs border-t border-dashed border-gold/25"
            aria-hidden
          />
          <span className="text-[10px] font-semibold tracking-[0.25em] text-gold-muted uppercase">
            {separationLabel}
          </span>
          <div className="w-full max-w-md">
            <EntityCard
              entity={operational}
              variant="operational"
              centralBadge={centralBadge}
              operationalBadge={operationalBadge}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
