"use client";

import { useFormState } from "react-dom";

import {
  loginPortalUser,
  type PortalLoginState,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { platformRoutes } from "@/lib/auth/routes";

export default function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const initialState: PortalLoginState = {};
  const [state, formAction] = useFormState(loginPortalUser, initialState);

  return (
    <Card variant="elevated" padding="md" className="sm:p-8">
      <h1 className="font-heading text-2xl font-semibold text-white">
        Connexion portail
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-gray-muted">
        Accès réservé aux comptes client (rôle USER).
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <input
          type="hidden"
          name="callbackUrl"
          value={callbackUrl ?? platformRoutes.portal}
        />

        {state.error ? (
          <p className="text-sm text-red-400" role="alert">
            {state.error}
          </p>
        ) : null}

        <FormField id="email" label="Email" error={state.fieldErrors?.email}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue=""
          />
        </FormField>

        <FormField
          id="password"
          label="Password"
          error={state.fieldErrors?.password}
        >
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            defaultValue=""
          />
        </FormField>

        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
    </Card>
  );
}
