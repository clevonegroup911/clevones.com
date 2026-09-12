# CLEVONE Payment Gateway — chaîne commande/facture (T027)

Livré 2026-09-12. **Sandbox uniquement. Aucune clé PSP. Aucun appel réseau M-PESA / RAWBANK / Stripe.**

## Chaîne

```
utilisateur
  → ServiceOrder (commande/service)
  → Invoice (facture)
  → Payment (lien sandbox, provider=sandbox)
  → ClevoneGatewayEvent (événement CLEVONE authentifié)
  → activation idempotente (ServiceOrder.ACTIVE)
  → Receipt + Invoice.SETTLED (reçu / facture acquittée)
  → AuditLog / journal gateway
```

## Niveaux de vérité

| Élément | Conçu | Implémenté | Testé localement | Validé CI | Fusionné | Déployé / live rails |
|---|---|---|---|---|---|---|
| Modèles Prisma Order/Invoice/Payment/Receipt/Event | oui | oui | `prisma validate` | (à confirmer) | non | non |
| API `lib/payments/gateway` | oui | oui | `gateway.test.ts` | (à confirmer) | non | non |
| Sandbox sans clé PSP | oui | oui | tests + scan-secrets | (à confirmer) | non | non |
| Rails réels M-PESA/RAWBANK | conçu (futur) | non | n/a | n/a | n/a | **non** |
| Migration production | n/a | **interdite** ici | migration additive CI/local | n/a | n/a | **non** |

## Modèles Prisma

- `ServiceOrder` — intent commande/service (`DRAFT|PENDING|INVOICED|ACTIVE|CANCELLED`)
- `Invoice` — facture liée (`DRAFT|ISSUED|AWAITING_PAYMENT|PAID|SETTLED|VOID`) + `paymentId` optionnel
- `Payment` — existant (T024), relation 1:1 inverse `invoice`
- `Receipt` — reçu / preuve d’acquittement
- `ClevoneGatewayEvent` — événements CLEVONE avec `idempotencyKey` unique

Migration additive : `prisma/migrations/20260912030000_add_payment_gateway_chain/` — **CI/local seulement**, pas de `migrate deploy` production dans cette tâche.

## API domaine

`createPaymentGateway()` (`lib/payments/gateway.ts`) :

1. `createOrderWithInvoice` — commande + facture `AWAITING_PAYMENT` (idempotent)
2. `linkSandboxPayment` — crée un paiement via `createSandboxPaymentProvider` et le lie à la facture
3. `activateFromClevoneEvent` — événement CLEVONE → capture sandbox → activation idempotente → reçu + facture `SETTLED`
4. `getChainByOrderId` / `getChainByPaymentId` — lecture de la chaîne

Journal d’audit local (`GATEWAY_*`) aligné sur le modèle `AuditLog` (action, entityType, entityId).

## Hors périmètre (T028 / T029 / gates)

- Preuves client, rapprochement, file `HUMAN_REVIEW` → **T028**
- Surfaces admin/client → **T029**
- Clés réelles, webhooks réseau, migration production → gate propriétaire

## Tests

- `lib/payments/gateway.test.ts`
- `lib/payments/sandbox.test.ts` (T024, inchangé)
- Contrôles tâche : `npx prisma validate`, `npm test`, lint, tsc, scan-secrets, `x200:validate`, `git diff --check`
