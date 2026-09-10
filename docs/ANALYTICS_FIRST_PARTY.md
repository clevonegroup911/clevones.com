# Analytics first-party (T022)

Livré le 2026-09-10. Aucune migration production. Aucun tracker tiers obligatoire.

## Modèle

`AnalyticsEvent` + enum `AnalyticsEventName` :

- `PAGE_VIEW`
- `FORM_SUBMIT`
- `ADMIN_LOGIN`
- `DOCUMENT_UPLOAD`
- `DOCUMENT_DOWNLOAD`
- `COMMERCIAL_ACTION`

Champs : `path`, `label`, `actorId` optionnel, `createdAt`. **Pas** d’IP ni de user-agent (contrairement à `AuditLog`).

## Instrumentation

- Vues pages : `recordPageView` via `SiteShell` (public) et layout admin authentifié
- Login admin (session directe ou MFA) → `ADMIN_LOGIN`
- Soumission initiative → `FORM_SUBMIT` + `COMMERCIAL_ACTION`
- Portail documents → `DOCUMENT_UPLOAD` / `DOCUMENT_DOWNLOAD`

`trackAnalyticsEvent` ne propage jamais d’erreur aux flux produit.

## Dashboard

`/admin/analytics` (requireAdmin) : totaux 30 jours, top pages, événements récents.

## Suite

T023 email ; T024 sandbox paiements ; T025 e2e. Migration prod = T026 humain.
