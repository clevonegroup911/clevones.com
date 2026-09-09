"use client";

import { useActionState } from "react";

import {
  changeCmsStatusAction,
  type CmsActionState,
} from "@/app/admin/cms/actions";
import type { ContentStatus } from "@prisma/client";

const initial: CmsActionState = {};

type StatusFormProps = {
  kind: "page" | "entry";
  id: string;
  current: ContentStatus;
};

export function StatusForm({ kind, id, current }: StatusFormProps) {
  const [state, action, pending] = useActionState(changeCmsStatusAction, initial);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <select
        name="status"
        defaultValue={current}
        className="rounded-sm border border-border-subtle bg-surface px-2 py-1 text-xs text-white"
      >
        <option value="DRAFT">DRAFT</option>
        <option value="PUBLISHED">PUBLISHED</option>
        <option value="ARCHIVED">ARCHIVED</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm border border-border-subtle px-2 py-1 text-xs text-gold-muted hover:text-gold disabled:opacity-50"
      >
        OK
      </button>
      {state.error ? (
        <span className="text-xs text-red-400" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
