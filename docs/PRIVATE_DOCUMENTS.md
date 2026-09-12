# Documents privés et portail (T020 + T021 + T033)

Livré T020 le 2026-09-09 ; permissions T021 le 2026-09-10 ; auth portail USER T033 le 2026-09-12. Aucune migration production. **Pas live prod.**

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
| `/sign-in` credentials USER ACTIVE | **implémenté / testé** (cookie `portal_session`) |
| Garde `/portal` + `/api/portal/*` | `requirePortalActor` / `getOptionalPortalActor` (USER ou admin session) |
| Ancien garde `requireAdmin()` seul | **retiré** des surfaces portail |
| MFA | réservée admin ; pas de MFA sur login USER |
| Production | **non déployé** par cette tâche |

Les admins conservent l’accès portail via `admin_session` (sans passer par `/sign-in`).

## Portail HTTP

`/portal` authentifié. API :

- `POST /api/portal/documents` upload
- `GET /api/portal/documents/:id` téléchargement (ACL)
- `DELETE /api/portal/documents/:id` suppression logique (ACL)
- paiements client sandbox sous `/portal/payments` et `/api/portal/payments*`

## Suite

Gestion utilisateurs / grants admin mutables : T034. Inventaires docs : T035.
