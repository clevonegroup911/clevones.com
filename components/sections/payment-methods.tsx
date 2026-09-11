import { PAYMENT_INSTRUCTIONS } from "@/lib/payments/instructions";

export function PaymentMethods() {
  return (
    <section
      aria-labelledby="payment-methods-title"
      className="rounded-sm border border-border-subtle/60 bg-surface-muted px-5 py-6 sm:px-7 sm:py-7"
    >
      <p className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
        Modes de paiement / Transfert
      </p>
      <h2 id="payment-methods-title" className="mt-2 text-xl font-semibold text-white">
        Paiements CLEVONE
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Titulaire du compte :{" "}
        <strong className="font-semibold text-soft-white">
          {PAYMENT_INSTRUCTIONS.accountHolder}
        </strong>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-sm border border-border-subtle bg-surface p-4">
          <p className="text-xs font-semibold tracking-wide text-gold uppercase">M-PESA</p>
          <p className="mt-2 font-mono text-sm text-white">
            {PAYMENT_INSTRUCTIONS.mpesa.displayPhone}
          </p>
        </div>

        <div className="rounded-sm border border-border-subtle bg-surface p-4">
          <p className="text-xs font-semibold tracking-wide text-gold uppercase">
            RAWBANK — Virement bancaire
          </p>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-muted">CDF — Franc congolais</dt>
              <dd className="mt-1 break-all font-mono text-white">
                {PAYMENT_INSTRUCTIONS.rawbank.accounts.CDF}
              </dd>
            </div>
            <div>
              <dt className="text-muted">USD — Dollar américain</dt>
              <dd className="mt-1 break-all font-mono text-white">
                {PAYMENT_INSTRUCTIONS.rawbank.accounts.USD}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Code SWIFT / BIC</dt>
              <dd className="mt-1 font-mono text-white">
                {PAYMENT_INSTRUCTIONS.rawbank.swiftBic}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-gray-muted">
        Conservez votre référence de transaction et votre preuve de paiement. Une preuve uploadée
        seule ne vaut pas confirmation définitive : le paiement doit être rapproché avec une
        notification CLEVONE authentifiée avant activation automatique du service.
      </p>
    </section>
  );
}
