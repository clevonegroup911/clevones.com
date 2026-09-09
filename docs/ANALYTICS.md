# Analytics first-party (T022)

Implémentation 2026-09-09 sur la branche Cloud `cursor/t022-analytics-fastlane-0652`. **Aucune migration production.** **Aucun tracker tiers.**

## Collecte

Événements serveur uniquement (`AnalyticsEvent`) :

| Nom | Catégorie | Point d’entrée |
|---|---|---|
| `page_view` | PAGE | layout public |
| `form_submit` / `form_reject` | FORM | `POST /api/initiative-submission` |
| `admin_view` | ADMIN | layout admin |
| `admin_mutation` | ADMIN | actions CMS |
| `document_view` | DOCUMENT | `/portal` |
| `document_upload` / `_download` / `_delete` | DOCUMENT | API portail |

Champs stockés : `name`, `category`, `path` sanitizé, `locale` (`fr`/`en` ou null), `actorKind` (ANONYMOUS / USER / ADMIN / SUPER_ADMIN), `day`, `createdAt`.

**Jamais stockés** : IP, User-Agent, e-mail, identifiant utilisateur, cookies, corps de formulaire.

## Dashboard

`/admin/analytics` — ADMIN et SUPER_ADMIN. Agrégats 7 jours (totaux, catégories, chemins). Pas de ligne nominative.

## Fedora

Le claim `local:fedora` sur `origin/admin-mfa` @ `3203e52` était expiré. Cette branche Cloud a repris T022 **sans accès** aux modifications locales Fedora. Au retour Fedora : `git fetch` puis comparer `admin-mfa` / cette branche **avant** toute intégration, pour ne pas écraser un travail non poussé.

## Hors périmètre

- Migration / déploiement production (T026)
- Tracker navigateur, cookies publicitaires, consent CMP
- Identifiants personnels ou géolocalisation
