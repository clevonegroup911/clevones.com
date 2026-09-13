"use client";

import { useFormState } from "react-dom";

import {
  createDocumentGrantAction,
  createManagedUserAction,
  disableManagedUserAction,
  revokeDocumentGrantAction,
  type AdminUsersActionState,
} from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";

const initial: AdminUsersActionState = {};

export function CreateUserForm() {
  const [state, action] = useFormState(createManagedUserAction, initial);
  return (
    <form action={action} className="mt-4 space-y-3">
      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-gold-muted">{state.message}</p>
      ) : null}
      <FormField id="email" label="Email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" required />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          id="firstName"
          label="Prénom"
          error={state.fieldErrors?.firstName}
        >
          <Input name="firstName" required />
        </FormField>
        <FormField
          id="lastName"
          label="Nom"
          error={state.fieldErrors?.lastName}
        >
          <Input name="lastName" required />
        </FormField>
      </div>
      <FormField
        id="password"
        label="Mot de passe"
        error={state.fieldErrors?.password}
      >
        <Input name="password" type="password" required autoComplete="new-password" />
      </FormField>
      <FormField id="role" label="Rôle" error={state.fieldErrors?.role}>
        <select
          name="role"
          className="w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white"
          defaultValue="USER"
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </FormField>
      <Button type="submit">Créer</Button>
    </form>
  );
}

export function DisableUserButton({ userId }: { userId: string }) {
  const [state, action] = useFormState(disableManagedUserAction, initial);
  return (
    <form action={action} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="text-xs text-red-300 hover:text-red-200"
      >
        Désactiver
      </button>
      {state.error ? (
        <span className="ml-2 text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  );
}

export function CreateGrantForm() {
  const [state, action] = useFormState(createDocumentGrantAction, initial);
  return (
    <form action={action} className="mt-4 space-y-3">
      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-gold-muted">{state.message}</p>
      ) : null}
      <FormField id="documentId" label="Document ID">
        <Input name="documentId" required />
      </FormField>
      <FormField id="grantUserId" label="User ID">
        <Input name="userId" required />
      </FormField>
      <label className="flex items-center gap-2 text-xs text-gray-muted">
        <input type="checkbox" name="canRead" value="true" defaultChecked />
        canRead
      </label>
      <label className="flex items-center gap-2 text-xs text-gray-muted">
        <input type="checkbox" name="canWrite" value="true" />
        canWrite
      </label>
      <Button type="submit">Créer le grant</Button>
    </form>
  );
}

export function RevokeGrantButton({
  documentId,
  userId,
}: {
  documentId: string;
  userId: string;
}) {
  const [state, action] = useFormState(revokeDocumentGrantAction, initial);
  return (
    <form action={action} className="inline">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className="text-xs text-red-300 hover:text-red-200">
        Révoquer
      </button>
      {state.error ? (
        <span className="ml-2 text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  );
}
