# TASK_REPORT

[X100-CURSOR]

[X200-CURSOR]

## ID

T029

## Statut

EN_CONTRÔLE

## Objectif

Exposer les états gateway (facture, paiement, preuve, rapprochement, vérification humaine, reçu) aux surfaces admin et client sécurisées, sans activer de rail de paiement réel.

## Résultat

Surfaces admin/client livrées : `/admin/payments` (+ détail preuves/décisions), seed sandbox Prisma, portail `/portal/payments` avec reçu et upload preuve (ownership + jamais VERIFIED seul), APIs Zod + ACL. Persistance `lib/payments/persist.ts`. Quality-gate local PASS. Attente job `quality` CI.

## Fichiers créés

- `lib/payments/persist.ts`
- `app/api/admin/payments/sandbox/route.ts`
- `app/admin/payments/sandbox-seed-form.tsx`
- `reports/tasks/T029.md`

## Fichiers modifiés

- `app/admin/payments/page.tsx`
- `app/admin/payments/[orderId]/page.tsx`
- `app/api/admin/payments/route.ts`
- `app/api/portal/payments/proof/route.ts`
- `app/(dashboard)/portal/payments/page.tsx`
- `lib/payments/catalog.ts`
- `lib/payments/schemas.ts`
- `lib/payments/access.test.ts`
- `docs/PAYMENTS_GATEWAY.md`
- `backlog.json`
- `TASK_REPORT.md`

## Commandes

- `npm run x200:resume -- --json --apply`
- `npm run x200:claim -- --json T029`
- `npm run x200:quality-gate -- --task T029`

## Tests réussis

- quality-gate T029 PASS (6/6)

## Tests échoués

- aucun

## Lint

- succès

## Type-check

- succès

## Build

- CI attendu après push

## Sécurité

- aucun secret PSP ; aucun webhook réseau ; ownership sur upload preuve ; `.env` non touché ; pas de migration production

## Commit

- (à renseigner après push)

## Pull Request

- (à ouvrir/mettre à jour sur branche de travail)

## Preuves

- quality-gate T029
- docs/PAYMENTS_GATEWAY.md § Surfaces admin / client (T029)

## Risques

- portail client actuel via session admin (contrainte plateforme existante) ; USER ACL unit-tested sans session USER réelle

## Blocage

- aucun

## Prochaine tâche prête

- (après clôture CI T029 → AUTOPLAN si idle)
