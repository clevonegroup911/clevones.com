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
| Modèles Prisma Order/Invoice/Payment/Receipt/Event | oui | oui | `prisma validate` | **oui** run 34662487636 | non | non |
| API `lib/payments/gateway` | oui | oui | `gateway.test.ts` | **oui** | non | non |
| Sandbox sans clé PSP | oui | oui | tests + scan-secrets | **oui** | non | non |
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

## Hors périmètre restant (T029 / gates)

- Surfaces admin/client → **T029**
- Clés réelles, webhooks réseau, migration production → gate propriétaire

## Preuves et rapprochement (T028)

### Chaîne étendue

```
… → Payment
  → PaymentProof (CLIENT_UPLOAD, stockage privé `.data/payment-proofs/`, hors Git)
  → événement CLEVONE authentifié (CLEVONE_SANDBOX / CLEVONE_OFFICIAL)
  → ReconciliationDecision (idempotent)
       ├─ VERIFIED → seule voie auto vers capture/activation
       ├─ PENDING (preuve client seule)
       ├─ HUMAN_REVIEW (conflit ; reviewDueAt ≤ +24 h)
       └─ DUPLICATE_SUSPECTED (référence déjà vérifiée)
```

### Invariants

| Règle | Niveau |
|---|---|
| Preuve client seule → jamais `VERIFIED` / jamais capture | **testé** (`reconciliation.test.ts`) |
| Source CLEVONE authentifiée requise pour validation auto | **testé** |
| Mismatch montant/référence/devise → `HUMAN_REVIEW` ≤ 24 h | **testé** |
| Idempotence + anti-rejeu (idempotencyKey + refs vérifiées) | **testé** |
| Stockage preuves hors `public/` et hors Git (`.data/`) | **implémenté** |
| Rails réels / clés PSP | **non** |

### API

`createReconciliationService()` (`lib/payments/reconciliation.ts`) :

- `storeClientProof` — écrit via `lib/documents/storage` dans `PAYMENT_PROOF_ROOT`
- `registerClevoneEvent` — événement authentifié sandbox/officiel
- `reconcile` — décision idempotente + journal d’audit
- `allowsCapture` — `true` uniquement si `VERIFIED`

Modèles Prisma additifs : `PaymentProof`, `ReconciliationDecision` — migration `20260912040000_add_payment_proof_reconciliation` (CI/local only).

## Tests

- `lib/payments/gateway.test.ts`
- `lib/payments/reconciliation.test.ts`
- `lib/payments/sandbox.test.ts` (T024)
- Contrôles : `npx prisma validate`, `npm test`, lint, tsc, scan-secrets, `x200:validate`, `git diff --check`
