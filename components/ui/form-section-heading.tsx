type FormSectionHeadingProps = {
  title: string;
  description?: string;
};

export function FormSectionHeading({
  title,
  description,
}: FormSectionHeadingProps) {
  return (
    <div className="border-b border-border-subtle pb-4">
      <h2 className="font-heading text-lg font-semibold text-white">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted">{description}</p>
      ) : null}
    </div>
  );
}
