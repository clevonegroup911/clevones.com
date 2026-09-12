# CMS et documents — inventaire

> **Inventaire historique T014 (2026-09-09)** — les verdicts ci-dessous décrivent l’état **à la date T014**. Ils sont **obsolètes** pour le code courant. Voir la section « État réel post-T019–T033 » et les docs opérationnelles liées.

## État réel post-T019–T033 (2026-09-12)

| Surface | État | Niveau de vérité | Doc |
|---|---|---|---|
| CMS interne `/admin/cms` | Modèles `ContentPage` / `ContentEntry` / `MediaAsset` + UI admin | implémenté / testé ; **pas live prod** | `docs/CMS_INTERNAL.md` |
| Documents privés | Stockage hors `public/`, ACL T021, soft-delete | implémenté / testé ; **pas live prod** | `docs/PRIVATE_DOCUMENTS.md` |
| Portail `/portal` | Auth USER (`portal_session`) + admin session | implémenté / testé (T033) ; **pas live prod** | `docs/ROLES_AND_PERMISSIONS.md` |
| Contenu marketing i18n | Toujours `lib/i18n/content/` (non remplacé par le CMS) | CONFIRMÉ | — |
| Migration / deploy production | Hors auto ; gate humaine | **non** | T026 / gates |

**Aucun** `.x200/PRODUCT_COMPLETE.json` tant que USER mgmt (T034) / gates externes restent ouverts.

## Inventaire historique T014 (ne plus traiter comme vérité code)

Audit T014 (2026-09-09). Revue documentaire uniquement. Classes : **CONFIRMÉ** à cette date seulement.

| Question (T014) | Réponse T014 | Statut 2026-09-12 |
|---|---|---|
| CMS headless externe ? | Non | Toujours non — CMS **interne** Prisma existe (T019) |
| Modèles Prisma contenu / documents ? | Non | **Oui** (CMS + Document + DocumentGrant) |
| Pipeline upload documents ? | Non | **Oui** portail + API |
| Portail opérationnel / auth ? | Placeholder | **Oui** USER + admin (T033) |
| Admin CRUD contenu ? | Non | **Oui** `/admin/cms` |

Conservé pour traçabilité d’audit ; **ne pas** s’appuyer sur les tableaux T014 pour l’exploitation.

## Fichiers de contrôle courants

| Fichier | Rôle |
|---|---|
| `docs/CMS_INTERNAL.md` | CMS T019 |
| `docs/PRIVATE_DOCUMENTS.md` | Documents + auth portail |
| `docs/ROLES_AND_PERMISSIONS.md` | Matrice rôles |
| `prisma/schema.prisma` | Modèles actuels |
