# Paiements abstraction + sandbox (T024)

Livré 2026-09-10. **Aucune transaction réelle. Aucune clé réelle.**

## Abstraction

`PaymentProvider` (`lib/payments/types.ts`) :

- méthodes : `CARD`, `M_PESA`
- statuts : `PENDING|AUTHORIZED|CAPTURED|FAILED|CANCELLED`
- `createPayment` + `getPayment` + `handleWebhook`
- idempotency key obligatoire

## Sandbox

`createSandboxPaymentProvider` :

- store mémoire
- idempotence
- webhook signature stub `sandbox-signature` (pas un secret d’exploitation)
- journal d’audit local (`PAYMENT_CREATED`, `PAYMENT_IDEMPOTENT_HIT`, `PAYMENT_WEBHOOK`)

## Hors périmètre

- Stripe/M-Pesa réseau
- clés `sk_` / `pk_`
- migration production (T026 humain)

## Tests

`lib/payments/sandbox.test.ts`
