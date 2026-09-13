# CMS interne (T019)

Livré le 2026-09-09. Aucune migration production. **Toujours la source opérationnelle CMS** (l’inventaire T014 `CMS_AND_DOCUMENTS.md` est historique).

## Modèles

| Modèle | Rôle |
|---|---|
| `ContentPage` | Coquille page, `slug` unique, statut DRAFT/PUBLISHED/ARCHIVED |
| `ContentEntry` | Corps localisé FR/EN (`ContentLocale`), statut propre |
| `MediaAsset` | Métadonnées média (clé privée) — pas de stockage `public/` |

## Accès

| Rôle | CMS `/admin/cms` |
|---|---|
| SUPER_ADMIN | Allow (`requireAdmin`) |
| ADMIN | Allow |
| USER / anonyme | Deny (middleware + `requireAdmin`) |

Mutations journalisées : `CMS_PAGE_*`, `CMS_ENTRY_*` via `AuditLog`.

## Preview

`/admin/cms/[pageId]/preview?locale=fr|en` — visible admin y compris brouillons.

## Fichiers

- `prisma/schema.prisma` + migration `20260909170000_add_cms_content`
- `lib/cms/content.ts`
- `lib/validation/cms.ts`
- `app/admin/cms/**`

## Hors périmètre

- Migration / deploy production (T026)
- Remplacement du contenu marketing i18n existant (`lib/i18n/content`)
- Documents privés (T020)
