# Documents privés et portail (T020 + T021 + T033 + T034)

Livré T020–T021, auth USER T033, gestion users/grants T034 (2026-09-12). Aucune migration production. **Pas live prod.**

## Modèle

`Document` : titre, description, catégorie, niveau d’accès, propriétaire, uploader, checksum SHA-256, soft-delete (`deletedAt`).

`DocumentGrant` : grant explicite `(documentId, userId)` avec `canRead` / `canWrite`.

## Stockage

Abstraction filesystem privée : `.data/private-documents` (gitignoré) ou `PRIVATE_DOCUMENT_ROOT`. **Jamais** sous `public/`.

## Matrice d’accès (T021)

| Rôle | List / read | Upload | Delete |
|---|---|---|---|
| SUPER_ADMIN | tous | oui | tous |
| ADMIN | propres + INTERNAL + grants | oui (devient owner) | propres seulement (via policy) |
| USER | propres + grants | oui (owner=self) | propres seulement |

Téléchargement sans permission → **403** + `DOCUMENT_ACCESS_DENIED` dans AuditLog.

## Authentification portail (T033)

| Élément | État |
| --- | --- |
| `/sign-in` credentials USER ACTIVE | **implémenté / testé** |
| Garde `/portal` + `/api/portal/*` | `requirePortalActor` |
| Production | **non déployé** |

## Gestion users + grants (T034)

| Surface | État |
| --- | --- |
| `/admin/users` UI | créer USER/ADMIN, désactiver hors SUPER_ADMIN, create/revoke grant |
| `GET/POST /api/admin/users` | liste + création |
| `POST /api/admin/users/:id/disable` | désactivation |
| `GET/POST/DELETE /api/admin/documents/grants` | list / create / revoke |
| Audit | `USER_CREATED`, `USER_DISABLED`, `DOCUMENT_GRANT_*` |
| LIVE prod | **non** |

Un USER avec grant peut lire le document via le portail ; sans grant → refus ACL documenté.

## Portail HTTP

- `POST /api/portal/documents` upload
- `GET /api/portal/documents/:id` téléchargement (ACL)
- `DELETE /api/portal/documents/:id` soft-delete (ACL)
- paiements client sandbox sous `/portal/payments`
