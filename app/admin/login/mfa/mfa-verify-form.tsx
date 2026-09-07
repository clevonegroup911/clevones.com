"use client";

import { useFormState } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import type { AdminMfaVerifyState } from "@/app/admin/login/mfa/actions";
import { verifyAdminMfa } from "@/app/admin/login/mfa/actions";

export default function MfaVerifyForm({
  challengeValid,
  loginHref,
}: {
  challengeValid: boolean;
  loginHref: string;
}) {
  const initialState: AdminMfaVerifyState = {};
  const [state, formAction] = useFormState(verifyAdminMfa, initialState);

  return (
    <Card variant="elevated" padding="md" className="sm:p-8">
      <h1 className="font-heading text-2xl font-semibold text-white">
        Vérification MFA
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-gray-muted">
        Entrez le code de votre application d&apos;authentification ou un code
        de récupération.
      </p>

      {!challengeValid ? (
        <p className="mt-6 text-sm text-red-400" role="alert">
          La vérification a expiré.{" "}
          <Link href={loginHref} className="text-gold-muted underline underline-offset-2">
            Revenir à la connexion
          </Link>
          .
        </p>
      ) : (
        <form action={formAction} className="mt-6 space-y-4">
          {state.error ? (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}

          <FormField
            id="code"
            label="Code"
            error={state.fieldErrors?.code}
            required
          >
            <Input
              id="code"
              name="code"
              inputMode="text"
              autoComplete="one-time-code"
              required
              defaultValue=""
            />
          </FormField>

          <Button type="submit" className="w-full">
            Vérifier
          </Button>
        </form>
      )}
    </Card>
  );
}
