# CMS et documents — inventaire (T014)

Audit T014 (2026-09-09). Revue documentaire du dépôt uniquement. **Aucun accès production**, aucune lecture de `.env`, aucune mutation de données, aucun upload réel.

Classes de vérité : **CONFIRMÉ** = observé dans le dépôt cette session ; **INDIQUÉ** = documenté ailleurs, non revérifié ; **PROPOSÉ** = cible future ; **NON_ACCESSIBLE** = production / valeurs hors dépôt.

## Verdict

| Question | Réponse | Classe |
|---|---|---|
| Existe-t-il un CMS headless (Sanity, Strapi, Payload, Contentful…) ? | **Non** | CONFIRMÉ |
| Existe-t-il des modèles Prisma de contenu (Post, Page, Media, Document) ? | **Non** | CONFIRMÉ |
| Existe-t-il un pipeline d’upload / stockage documents ? | **Non** | CONFIRMÉ |
| Où vit le contenu marketing ? | Modules TypeScript i18n versionnés | CONFIRMÉ |
| Le portail documents est-il opérationnel ? | Placeholder « coming soon », sans auth | CONFIRMÉ |
| Accès production requis pour cet inventaire ? | Non | CONFIRMÉ |

## Inventaire des surfaces

| Surface | Emplacement | Rôle | Classe |
|---|---|---|---|
| Contenu FR/EN | `lib/i18n/content/` (`en.ts`, `fr.ts`, `pages/*.ts`, `types.ts`) | Source de vérité éditoriale versionnée | CONFIRMÉ |
| Wrappers legacy | `lib/*-page.ts`, `lib/home.ts`, etc. | Réexport / composition de pages | CONFIRMÉ |
| Routes publiques | `app/(public)/**` | Rendu marketing FR/EN | CONFIRMÉ |
| Insights / analyses | `app/(public)/insights/[slug]`, `analyses/[slug]` + contenus i18n | Articles « forthcoming » (slugs + abstracts), pas de corps MDX | CONFIRMÉ |
| Assets statiques | `public/brand/*`, `public/og-image.*`, `public/icons.svg` | Marque / OG, pas un media library | CONFIRMÉ |
| Admin | `app/admin/**` | Login, MFA, dashboard uniquement — **aucun CRUD contenu** | CONFIRMÉ |
| API publique | `app/api/initiative-submission/route.ts` | Formulaire contact / initiative (Zod, pas de persistance DB) | CONFIRMÉ |
| Portail documents | `app/(dashboard)/portal/page.tsx` | UI « coming soon » ; middleware auth inactif (voir T013) | CONFIRMÉ |
| Prisma | `prisma/schema.prisma` | `User`, MFA, `AuditLog` seulement | CONFIRMÉ |

### Absents (CONFIRMÉ)

- Répertoires `content/`, `uploads/`, `media/` applicatifs
- Fichiers `.mdx` sous `app/`
- Dépendances CMS / MDX / Contentlayer dans `package.json`
- Champs `type="file"` / handlers multipart d’upload
- Stockage objet (S3, GCS, Cloudinary) dans le code applicatif

## Matrice permissions contenu (état actuel)

Complète `docs/ROLES_AND_PERMISSIONS.md` (T013) : aucune ligne CMS n’y figurait. Inventaire T014 :

| Action / ressource | SUPER_ADMIN | ADMIN | USER / anonyme | Notes |
|---|---|---|---|---|
| Éditer textes marketing | N/A (Git) | N/A | N/A | Modification via PR / commit uniquement |
| Upload document / média | N/A | N/A | N/A | Aucune API |
| Lire `/portal` documents | Allow page publique placeholder | Idem | Idem | Pas d’auth ; pas de dépôt |
| CRUD contenu via `/admin` | Deny (absent) | Deny (absent) | Deny | Admin = auth uniquement |
| `POST /api/initiative-submission` | Public | Public | Public | Texte seulement ; pas de fichier |

## Flux éditorial actuel (CONFIRMÉ)

```
éditeur humain
  → commit TypeScript dans lib/i18n/content/
  → revue / CI / merge humain
  → build Next.js
  → pages app/(public)/**
```

Aucun runtime CMS. Aucune synchronisation externe. Production **NON_ACCESSIBLE** pour cet audit.

## Documents et formulaires

| Élément | Comportement | Classe |
|---|---|---|
| Initiative / contact | Validation Zod (`lib/validation/initiative-submission.ts`) ; email préparé sans fournisseur (`lib/initiative-submission-email.ts`) ; log local de dev | CONFIRMÉ |
| Mentions / privacy | Pages i18n + routes FR/EN | CONFIRMÉ |
| Evidence / preuves | Pages marketing, pas un coffre de preuves | CONFIRMÉ |
| DMS produit (`clevone-dms`) | Page solutions marketing uniquement | CONFIRMÉ |

## Risques résiduels (non bloquants T014)

1. **Portail `/portal`** annoncé comme dépôt sécurisé mais non implémenté — risque de confusion utilisateur (INDIQUÉ UX).
2. **Édition contenu = Git** : pas de workflow non-développeur (PROPOSÉ : CMS futur hors périmètre T014).
3. **Formulaire initiative** : pas de persistance ; si un fournisseur email est branché plus tard, secrets hors Git (voir `docs/SECRETS.md`).

## Fichiers de contrôle

| Fichier | Rôle |
|---|---|
| `lib/i18n/content/**` | Contenu marketing versionné |
| `prisma/schema.prisma` | Absence de modèles contenu |
| `app/admin/**` | Absence de CRUD CMS |
| `app/(dashboard)/portal/page.tsx` | Placeholder documents |
| `app/api/initiative-submission/route.ts` | Seule API texte publique |
| `docs/ROLES_AND_PERMISSIONS.md` | Matrice auth (T013) |

## Preuves d’audit

- Revue documentaire dépôt 2026-09-09
- Aucun accès VM / PostgreSQL production
- Aucun secret affiché
- Livrable : ce fichier (`docs/CMS_AND_DOCUMENTS.md`)
