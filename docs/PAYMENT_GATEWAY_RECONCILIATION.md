# CLEVONE Payment Gateway & Auto-Reconciliation

## Goal

Provide a server-side payment orchestration layer that keeps working 24/7 even when the local Fedora workstation is off. The gateway does not pretend to be a bank or M-PESA. It reconciles client-declared payment evidence against CLEVONE-side authenticated events and, later, official provider APIs/webhooks.

## Initial payment rails

- Account holder: `CLEVONE JEAMSON EROISH`
- M-PESA: `+243 828 320 130`
- RAWBANK CDF: `15150-00978276003-95`
- RAWBANK USD: `15150-00978276002-01`
- SWIFT/BIC: `RAWBCDKI`

## Evidence sources

1. `CLIENT_UPLOAD`: customer reference plus screenshot/bank slip. This source is never sufficient by itself to mark a payment verified.
2. Authenticated CLEVONE notification sources: `M_PESA_SMS`, `RAWBANK_SMS`, `RAWBANK_EMAIL`.
3. Future official sources: `M_PESA_API`, `RAWBANK_API`.
4. Human exception handling: `MANUAL_ADMIN`, always audited.

## Reconciliation policy

The deterministic matcher compares reference, amount, currency, invoice/order reference and optional payer/beneficiary data.

- exact authenticated reference + amount + currency match: eligible for `VERIFIED`;
- plausible but incomplete match: `MATCHED` or `PENDING_VERIFICATION`;
- explicit mismatch: `REVIEW_REQUIRED`;
- already verified external reference: `DUPLICATE_SUSPECTED`;
- client proof without authenticated CLEVONE event: `PENDING_VERIFICATION`.

No client-uploaded image can directly produce a paid state.

## Automatic activation

Only a sufficiently verified payment may trigger the future activation transaction:

`invoice -> payment VERIFIED -> invoice PAID -> service activation -> paid receipt/invoice -> notification -> audit`

Activation must be idempotent so retries cannot provision the same service twice.

## 24-hour review path

When automatic reconciliation fails, the customer should see a review state with an indicative maximum verification window of 24 hours. No service is automatically activated while the payment is under review.

## Connectors

The core matcher is provider-independent. Planned adapters:

- Android SMS relay -> authenticated ingestion endpoint;
- dedicated bank-notification mailbox -> authenticated parser/ingestion;
- official RAWBANK/M-PESA API/webhook adapters when commercial access becomes available.

The SMS relay must queue events locally during connectivity loss and retry idempotently. Inbound server events must be authenticated, rate-limited and protected against replay.

## Production gate

Database migration, real banking credentials, production webhook secrets, live payment activation and production deployment are sensitive operations and require the X200 human gate. Code, tests, documentation and sandbox behavior can progress before that gate.
