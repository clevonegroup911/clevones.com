# Documents privés et portail (T020 + T021)

Livré T020 le 2026-09-09 ; permissions T021 le 2026-09-10. Aucune migration production.

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

Le portail HTTP reste authentifié via session admin (USER login portail = suite produit). La policy USER est testée unitairement et prête pour un acteur portail élargi.

## Portail

`/portal` authentifié. API :

- `POST /api/portal/documents` upload
- `GET /api/portal/documents/:id` téléchargement (ACL)
- `DELETE /api/portal/documents/:id` suppression logique (ACL)

## Suite

T023 email ; T024 paiements sandbox ; T025 e2e.
