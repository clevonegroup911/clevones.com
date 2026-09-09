# Documents privés et portail (T020)

Livré le 2026-09-09. Aucune migration production.

## Modèle

`Document` : titre, description, catégorie, niveau d’accès, propriétaire, uploader, checksum SHA-256, soft-delete (`deletedAt`).

## Stockage

Abstraction filesystem privée : `.data/private-documents` (gitignoré) ou `PRIVATE_DOCUMENT_ROOT`. **Jamais** sous `public/`.

## Portail

`/portal` authentifié (session admin, phase T020). API :

- `POST /api/portal/documents` upload
- `GET /api/portal/documents/:id` téléchargement
- `DELETE /api/portal/documents/:id` suppression logique

Audit : `DOCUMENT_UPLOADED`, `DOCUMENT_DOWNLOADED`, `DOCUMENT_SOFT_DELETED`.

## Suite

T021 affine SUPER_ADMIN / ADMIN / USER et anti-escalade.
