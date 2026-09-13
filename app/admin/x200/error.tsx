"use client";

export default function AdminX200Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      data-testid="x200-error-boundary"
      className="mx-auto max-w-3xl px-4 py-16 text-center"
    >
      <h1 className="font-heading text-2xl text-white">
        X200 Control Center recoverable error
      </h1>
      <p className="mt-3 text-sm text-gray-muted">
        The route remains registered. Hot reload or a transient render failure
        should not permanently remove /admin/x200.
      </p>
      <p className="mt-2 break-all text-xs text-gray-soft">
        {error.message || "Unknown error"}
      </p>
      <button
        type="button"
        data-testid="x200-error-reset"
        onClick={reset}
        className="mt-6 rounded-sm border border-gold/50 bg-gold/10 px-4 py-2 text-sm text-gold"
      >
        Recoverable refresh
      </button>
    </div>
  );
}
