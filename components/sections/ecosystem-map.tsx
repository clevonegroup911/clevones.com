import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "@/components/ui/external-link";
import { cardAccentLine } from "@/lib/ui-classes";
import type { EcosystemEntity } from "@/lib/ecosystem-page";
import { cn } from "@/lib/utils";

type EcosystemMapProps = {
  central: EcosystemEntity;
  neutral: EcosystemEntity[];
  operational: EcosystemEntity;
};

function EntityCard({
  entity,
  variant = "neutral",
  className,
}: {
  entity: EcosystemEntity;
  variant?: "central" | "neutral" | "operational";
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
        !isCentral &&
          !isOperational &&
          "hover:border-border-subtle",
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
            Governance hub
          </span>
          <div className="h-px flex-1 bg-gold/40" aria-hidden />
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CardTitle className={cn("text-base sm:text-lg", isCentral && "text-lg sm:text-xl")}>
          {entity.name}
        </CardTitle>
        {isOperational && (
          <Badge
            variant="outline"
            className="border-gold/30 text-gold-muted"
          >
            Operational unit
          </Badge>
        )}
      </div>
      <p className="text-xs font-medium tracking-wide text-gold-muted/90">
        {entity.role}
      </p>
      <CardDescription className="mt-3">{entity.description}</CardDescription>
      <ExternalLink href={entity.href} className="mt-4">
        {entity.domain}
      </ExternalLink>
    </Card>
  );
}

function ConnectorLine({
  orientation,
  className,
}: {
  orientation: "vertical" | "horizontal" | "diagonal";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none bg-gradient-to-b from-gold/40 via-gold/20 to-gold/40",
        orientation === "vertical" && "mx-auto h-8 w-px sm:h-10",
        orientation === "horizontal" && "h-px w-full bg-gradient-to-r",
        className,
      )}
      aria-hidden
    />
  );
}

export function EcosystemMap({ central, neutral, operational }: EcosystemMapProps) {
  return (
    <div className="mt-10 sm:mt-12 lg:mt-14">
      {/* Mobile: vertical stack */}
      <div className="flex flex-col items-stretch gap-0 lg:hidden">
        <EntityCard entity={central} variant="central" />
        <ConnectorLine orientation="vertical" />

        <div className="grid gap-5 sm:grid-cols-2">
          {neutral.map((entity) => (
            <EntityCard key={entity.name} entity={entity} variant="neutral" />
          ))}
        </div>

        <div className="my-8 flex flex-col items-center gap-3">
          <div className="h-px w-full max-w-xs border-t border-dashed border-gold/25" aria-hidden />
          <span className="text-[10px] font-semibold tracking-[0.25em] text-gold-muted uppercase">
            Operational separation
          </span>
          <ConnectorLine orientation="vertical" className="h-6" />
        </div>

        <EntityCard entity={operational} variant="operational" />
      </div>

      {/* Desktop: hub-and-spoke layout */}
      <div className="relative hidden lg:block">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
          preserveAspectRatio="none"
        >
          <line x1="50%" y1="42%" x2="50%" y2="14%" stroke="rgba(212,160,23,0.22)" strokeWidth="1" />
          <line x1="50%" y1="42%" x2="16%" y2="42%" stroke="rgba(212,160,23,0.22)" strokeWidth="1" />
          <line x1="50%" y1="42%" x2="84%" y2="42%" stroke="rgba(212,160,23,0.22)" strokeWidth="1" />
          <line x1="50%" y1="42%" x2="50%" y2="70%" stroke="rgba(212,160,23,0.22)" strokeWidth="1" />
          <line
            x1="50%"
            y1="78%"
            x2="50%"
            y2="92%"
            stroke="rgba(212,160,23,0.15)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        </svg>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-start-2 row-start-1">
            <EntityCard entity={neutral[0]} variant="neutral" />
          </div>
          <div className="col-start-1 row-start-2">
            <EntityCard entity={neutral[1]} variant="neutral" />
          </div>
          <div className="col-start-2 row-start-2">
            <EntityCard entity={central} variant="central" />
          </div>
          <div className="col-start-3 row-start-2">
            <EntityCard entity={neutral[2]} variant="neutral" />
          </div>
          <div className="col-start-2 row-start-3">
            <EntityCard entity={neutral[3]} variant="neutral" />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <span className="text-[10px] font-semibold tracking-[0.25em] text-gold-muted uppercase">
            Operational separation
          </span>
          <ConnectorLine orientation="vertical" className="h-8" />
          <div className="w-full max-w-md">
            <EntityCard entity={operational} variant="operational" />
          </div>
        </div>
      </div>
    </div>
  );
}
