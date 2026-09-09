"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SoftDeleteButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await fetch(`/api/portal/documents/${documentId}`, { method: "DELETE" });
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-xs text-red-300 hover:text-red-200 disabled:opacity-50"
    >
      Supprimer
    </button>
  );
}
