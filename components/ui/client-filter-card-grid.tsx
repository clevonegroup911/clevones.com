import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cardGrid3 } from "@/lib/ui-classes";

type ClientFilter = {
  title: string;
  description: string;
};

type ClientFilterCardGridProps = {
  filters: readonly ClientFilter[];
};

export function ClientFilterCardGrid({ filters }: ClientFilterCardGridProps) {
  return (
    <div className={cardGrid3}>
      {filters.map((filter) => (
        <Card
          key={filter.title}
          variant="outlined"
          padding="md"
          className="border-border-subtle/60 bg-white/[0.02] transition-colors hover:border-gold/20 hover:bg-white/[0.04]"
        >
          <CardTitle className="text-foreground">{filter.title}</CardTitle>
          <CardDescription className="text-gray-muted">
            {filter.description}
          </CardDescription>
        </Card>
      ))}
    </div>
  );
}
