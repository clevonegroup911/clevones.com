# CLEVONE Payment Gateway — chaîne commande/facture (T027)

Livré 2026-09-12. **Sandbox uniquement. Aucune clé PSP. Aucun appel réseau M-PESA / RAWBANK / Stripe.** Source opérationnelle paiements (l’inventaire T015 est historique pour « absences »).

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

## Hors périmètre restant (gates)

- Clés réelles, webhooks réseau, migration production → gate propriétaire
- Rails M-PESA / RAWBANK live → gate propriétaire + accès officiel

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

## Surfaces admin / client (T029)

| Surface | Route | Accès | Contenu |
|---|---|---|---|
| Console admin | `/admin/payments` (+ détail `/admin/payments/[orderId]`) | SUPER_ADMIN / ADMIN | commandes/factures/paiements, preuves, décisions, file HUMAN_REVIEW, audit |
| API admin | `GET /api/admin/payments?status=` | SUPER_ADMIN / ADMIN (403 pour USER) | JSON listes filtrables (Zod) |
| Seed sandbox | `POST /api/admin/payments/sandbox` | SUPER_ADMIN / ADMIN | crée chaîne Prisma sandbox (option `settle`) |
| Portail client | `/portal/payments` | session authentifiée | état facture/paiement/reçu ; upload preuve |
| API client | `GET /api/portal/payments`, `POST …/proof` | authentifié + ownership | list + upload ; **preuve seule ≠ VERIFIED** |

Zod : `lib/payments/schemas.ts`. Contrôles rôle : `lib/payments/access.ts`.
Persistance surface : `lib/payments/persist.ts` (chaîne + preuve/décision → Prisma).
Stockage fichier preuves : `.data/payment-proofs/` (hors Git).

### Invariants UI

- Upload preuve client → décision `PENDING` (jamais `VERIFIED` / jamais capture).
- Ownership : `POST /api/portal/payments/proof` refuse un `paymentId` hors commandes de l’acteur.
- Aucun secret PSP ; aucun webhook HTTP réseau.

## Boucle sandbox opérable HTTP (T030)

### Persistance événements CLEVONE

Réutilisation documentée du modèle Prisma **`ClevoneGatewayEvent`** (pas de modèle additif T030) :

| Champ | Usage rapprochement |
|---|---|
| `eventType` | `RECONCILE_CLEVONE_SANDBOX` ou `RECONCILE_CLEVONE_OFFICIAL` |
| `idempotencyKey` | = `eventKey` (anti-doublon) |
| `paymentId` / `invoiceId` / `orderId` | lien chaîne |
| `payload` | `{ reference, amountCents, currency, source, authenticated: true }` |

Helpers : `lib/payments/clevone-events.ts`. Hydratation : `hydratePersistedState` + `createHydratedReconciliationService` (`lib/payments/persist.ts`).

### API / UI

| Surface | Route | Accès | Contenu |
|---|---|---|---|
| Enregistrer événement | `POST /api/admin/payments/clevone-event` | SUPER_ADMIN / ADMIN | Zod + ACL ; persiste événement authentifié sandbox |
| Reconcile HTTP | `POST /api/admin/payments/reconcile` | SUPER_ADMIN / ADMIN | recharge preuves + événements Prisma → décision persistée |
| UI détail | `/admin/payments/[orderId]` | SUPER_ADMIN / ADMIN | formulaires événement concordant / mismatch + reconcile |

### Niveaux de vérité (T030)

| Élément | Conçu | Implémenté | Testé localement | Validé CI | Fusionné | Live rails |
|---|---|---|---|---|---|---|
| Event CLEVONE persisté (`ClevoneGatewayEvent`) | oui | oui | `persist-reconcile.test.ts` | **oui** run 34713201776 | non | non |
| Reconcile HTTP hydraté | oui | oui | hydrate + schemas | **oui** | non | non |
| Preuve client seule ≠ VERIFIED | oui | oui | tests + invariant route | **oui** | non | non |
| Concordant → VERIFIED ; mismatch → HUMAN_REVIEW ≤ 24 h | oui | oui | tests | **oui** | non | non |
| Webhook réseau / clé PSP | non | **non** | scan-secrets | n/a | n/a | **non** |
| Migration production | n/a | **interdite** | aucune migration T030 (réutilisation modèle) | n/a | n/a | **non** |

## Résolution HUMAN_REVIEW + activation VERIFIED (T031)

| Surface | Route | Accès | Contenu |
|---|---|---|---|
| File HUMAN_REVIEW | `/admin/payments` | SUPER_ADMIN / ADMIN | `reviewDueAt` visible ; boutons approve / reject |
| Résoudre revue | `POST /api/admin/payments/review` | SUPER_ADMIN / ADMIN | `approve` → VERIFIED + activation ; `reject` → REJECTED |
| Activer VERIFIED | `POST /api/admin/payments/activate` | SUPER_ADMIN / ADMIN | exige décision VERIFIED ; `activateFromClevoneEvent` + persist |

API domaine : `lib/payments/activation.ts` (`resolvePersistedHumanReview`, `activateVerifiedPayment`) + `resolveHumanReview` sur le service de rapprochement.

### Niveaux de vérité (T031)

| Élément | Conçu | Implémenté | Testé localement | Validé CI | Fusionné | Live rails |
|---|---|---|---|---|---|---|
| Approve / reject HUMAN_REVIEW | oui | oui | `activation.test.ts` | **oui** run 34713602649 | non | non |
| VERIFIED → activation gateway + SETTLED | oui | oui | gateway + activation tests | **oui** | non | non |
| USER sans actions admin | oui | oui | ACL | **oui** | non | non |
| Bypass seed settle pour activation métier | non | **non** (chemin gateway) | tests | **oui** | non | non |

## Tests

- `lib/payments/gateway.test.ts`
- `lib/payments/reconciliation.test.ts`
- `lib/payments/persist-reconcile.test.ts` (T030)
- `lib/payments/activation.test.ts` (T031)
- `lib/payments/access.test.ts`
- `lib/payments/sandbox.test.ts` (T024)
- Contrôles : `npx prisma validate`, `npm test`, lint, tsc, scan-secrets, `x200:validate`, `git diff --check`
