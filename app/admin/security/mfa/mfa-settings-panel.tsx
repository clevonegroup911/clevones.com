"use client";

import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import type { MfaSetupState } from "@/app/admin/security/mfa/actions";
import {
  confirmMfaEnrollment,
  disableMfa,
  startMfaEnrollment,
} from "@/app/admin/security/mfa/actions";

const emptyState: MfaSetupState = {};

export default function MfaSettingsPanel({
  isSuperAdmin,
  mfaEnabled,
}: {
  isSuperAdmin: boolean;
  mfaEnabled: boolean;
}) {
  const [startState, startAction] = useFormState(startMfaEnrollment, emptyState);
  const [confirmState, confirmAction] = useFormState(
    confirmMfaEnrollment,
    emptyState,
  );
  const [disableState, disableAction] = useFormState(disableMfa, emptyState);

  if (!isSuperAdmin) {
    return (
      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <p className="text-sm text-gray-muted">
          L&apos;activation et la désactivation MFA sont réservées au
          super-administrateur, sur son propre compte.
        </p>
      </section>
    );
  }

  const recoveryCodes = confirmState.recoveryCodes;
  const pendingKey = confirmState.manualKey ?? startState.manualKey;
  const qrDataUrl = confirmState.qrDataUrl ?? startState.qrDataUrl;
  const showPending =
    Boolean(pendingKey) &&
    confirmState.phase !== "recovery" &&
    (startState.phase === "pending" || confirmState.phase === "pending");
  const showDisabled = disableState.phase === "disabled";
  const effectivelyEnabled = mfaEnabled && !showDisabled;
  const showDisableForm = effectivelyEnabled && !recoveryCodes;

  return (
    <div className="space-y-6">
      {startState.error && !showPending ? (
        <p className="text-sm text-red-400" role="alert">
          {startState.error}
        </p>
      ) : null}
      {confirmState.error ? (
        <p className="text-sm text-red-400" role="alert">
          {confirmState.error}
        </p>
      ) : null}
      {disableState.error ? (
        <p className="text-sm text-red-400" role="alert">
          {disableState.error}
        </p>
      ) : null}

      {recoveryCodes && recoveryCodes.length > 0 ? (
        <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold text-white">
            Codes de récupération
          </h2>
          <p className="mt-2 text-sm text-gray-muted">
            {confirmState.message}
          </p>
          <ul className="mt-4 grid gap-2 font-mono text-sm text-white sm:grid-cols-2">
            {recoveryCodes.map((code) => (
              <li
                key={code}
                className="rounded-sm border border-border-subtle bg-surface px-3 py-2"
              >
                {code}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showPending && pendingKey ? (
        <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold text-white">
            Configurer l&apos;application
          </h2>
          <p className="mt-2 text-sm text-gray-muted">
            Scannez le QR code avec Google Authenticator, Microsoft Authenticator
            ou une application TOTP compatible, puis validez un premier code.
          </p>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR code de configuration MFA"
              className="mt-4 h-44 w-44 rounded-sm bg-white p-2"
            />
          ) : (
            <p className="mt-4 text-sm text-gray-muted">
              Le QR code n&apos;a pas pu être généré. Utilisez la clé manuelle.
            </p>
          )}
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gold-muted">
            Clé manuelle
          </p>
          <p className="mt-1 break-all font-mono text-sm text-white">
            {pendingKey}
          </p>

          <form action={confirmAction} className="mt-6 space-y-4">
            <FormField
              id="confirm-code"
              label="Code TOTP"
              error={confirmState.fieldErrors?.code}
              required
            >
              <Input
                id="confirm-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                defaultValue=""
              />
            </FormField>
            <Button type="submit">Activer la MFA</Button>
          </form>
        </section>
      ) : null}

      {showDisabled ? (
        <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
          <p className="text-sm text-gray-muted">{disableState.message}</p>
        </section>
      ) : null}

      {showDisableForm ? (
        <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold text-white">MFA active</h2>
          <p className="mt-2 text-sm text-gray-muted">
            La MFA protège actuellement ce compte. La désactivation exige le mot
            de passe et un code TOTP ou de récupération.
          </p>
          <form action={disableAction} method="post" className="mt-6 space-y-4">
            <FormField
              id="disable-password"
              label="Mot de passe"
              error={disableState.fieldErrors?.password}
              required
            >
              <Input
                id="disable-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                defaultValue=""
              />
            </FormField>
            <FormField
              id="disable-code"
              label="Code TOTP ou de récupération"
              error={disableState.fieldErrors?.code}
              required
            >
              <Input
                id="disable-code"
                name="code"
                autoComplete="one-time-code"
                required
                defaultValue=""
              />
            </FormField>
            <Button type="submit" variant="outline">
              Désactiver la MFA
            </Button>
          </form>
        </section>
      ) : null}

      {!effectivelyEnabled && !showPending && !recoveryCodes ? (
        <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold text-white">
            Activer la MFA
          </h2>
          <p className="mt-2 text-sm text-gray-muted">
            Confirmez votre mot de passe pour générer un secret TOTP. La MFA ne
            sera activée qu&apos;après validation d&apos;un premier code.
          </p>
          <form action={startAction} className="mt-6 space-y-4">
            <FormField
              id="enroll-password"
              label="Mot de passe"
              error={startState.fieldErrors?.password}
              required
            >
              <Input
                id="enroll-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                defaultValue=""
              />
            </FormField>
            <Button type="submit">Générer la configuration MFA</Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
