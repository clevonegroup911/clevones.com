# E2E produit (T025)

Playwright couvre les surfaces livrées T019–T024 **sur fixtures locales/CI seulement**. Aucune donnée production.

## Parcours

| Surface | Fichier | Preuve |
|---|---|---|
| MFA admin (T009) | `tests/e2e/admin-mfa.spec.ts` | login + dashboard, desktop/mobile |
| Sécurité CMS / analytics / portail | `tests/e2e/product-surfaces.spec.ts` | non authentifié → `/admin/login` |
| CMS + analytics + upload document | même fichier | session MFA fixture |
| Email initiative | `POST /api/initiative-submission` | succès JSON, pas de secret SMTP |
| Paiements | pas de `/checkout` public ; HTML sans `sk_live`/`pk_live` | sandbox seulement |

Viewports : projets Playwright `desktop` (1280×800) et `mobile` (390×844).

## Hors périmètre

- T026 migrations/deploy production
- captures de pages MFA enrollment
- secrets dans les screenshots (`tests/e2e/safe-screenshot.ts`)
