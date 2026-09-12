# E2E produit (T025 / T032)

Playwright couvre les surfaces livrées T019–T024 et la boucle gateway paiements sandbox (T030–T031) **sur fixtures locales/CI seulement**. Aucune donnée production. Aucune clé PSP.

## Parcours

| Surface | Fichier | Preuve |
|---|---|---|
| MFA admin (T009) | `tests/e2e/admin-mfa.spec.ts` | login + dashboard, desktop/mobile |
| Sécurité CMS / analytics / portail | `tests/e2e/product-surfaces.spec.ts` | non authentifié → `/admin/login` |
| CMS + analytics + upload document | même fichier | session MFA fixture |
| Email initiative | `POST /api/initiative-submission` | succès JSON, pas de secret SMTP |
| Paiements publics | pas de `/checkout` public ; HTML sans `sk_live`/`pk_live` | sandbox seulement |
| Gateway sandbox (T032) | `tests/e2e/payments-gateway.spec.ts` | seed → preuve PENDING → événement/reconcile → reçu ; mismatch → HUMAN_REVIEW → approve |

Viewports : projets Playwright `desktop` (1280×800) et `mobile` (390×844).

## Gateway paiements (T032) — détails

1. Login admin MFA fixture (`e2e.admin@example.test`).
2. Seed `POST /api/admin/payments/sandbox` (UI console `/admin/payments` visible).
3. Upload preuve portail `/portal/payments` → décision **PENDING** (jamais VERIFIED seul).
4. Événement CLEVONE sandbox + reconcile HTTP → **VERIFIED**.
5. Activation gateway → reçu / facture SETTLED visible au portail.
6. Variante mismatch → **HUMAN_REVIEW** (`reviewDueAt`) → approve → activation.

Fixtures locales uniquement ; aucun webhook réseau PSP ; aucun secret réel.

## Hors périmètre

- T026 migrations/deploy production
- captures de pages MFA enrollment
- secrets dans les screenshots (`tests/e2e/safe-screenshot.ts`)
- rails M-PESA / RAWBANK live
