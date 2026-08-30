# Sprint 001 — Mise à jour officielle CLEVONE SARL

**Statut :** implémenté, prêt pour revue et commit. **Non déployé.**

## i18n (correction prioritaire)

| | |
|---|---|
| **i18n** | **FR / EN** |
| **Langue par défaut** | **Français** |
| **Langue secondaire** | **Anglais** |

- `defaultLocale = "fr"` (`lib/i18n/locales.ts`)
- Sélecteur partout : **FR | EN** (`locales = ["fr", "en"]`)
- `/` → français (home canonique)
- `/en` → anglais (home)
- `/fr/...` n’est pas utilisé : l’architecture existante reste des slugs sémantiques appariés (`/mission` ↔ `/about`, `/domaines` ↔ `/solutions`, etc.)
- `/accueil` → redirection permanente 308 vers `/` (évite la duplication)
- `hreflang` `x-default` pointe vers le français

## Repository analysé

- Next.js 15 App Router, React 19, TypeScript, Tailwind 4
- Site institutionnel bilingue (slugs FR/EN appariés, pas de préfixe `/fr/`)
- Identité légale unique : `lib/constants/company.ts`
- Contenu i18n : `lib/i18n/content/pages/**`

## Identité légale ajoutée

- Marque : CLEVONES · Raison sociale : CLEVONE SARL · SARL pluripersonnelle
- RCCM `CD/KIS/RCCM/26-B-00235` · ID Nat. `25-G4701-N10030B/II`
- Immatriculation 17/08/2026 · Capital 460 000 CDF
- Siège : 5e Avenue des Musiciens, Commune de Makiso, Kisangani, RDC
- `tel:+243828320130` · `mailto:contact@clevones.com`
- Aucune donnée personnelle d’associés ou dirigeants

## CLEVONE DMS

- Routes : `/domaines/clevone-dms` (FR) · `/solutions/clevone-dms` (EN)
- FR : « Progiciel de gestion numérique pour les entreprises modernes »
- Fonctions FR : Ventes, Clients, Stocks, Fournisseurs, Dépenses, Recettes, Factures, Documents, Tableaux de bord, Rapports, Utilisateurs et permissions, Synchronisation cloud
- Capacités / feuille de route uniquement — aucun backend fictif

## Hero (FR par défaut)

- Headline : « Construire les infrastructures numériques, commerciales et institutionnelles de l'Afrique. »
- Sous-titre : « Technologie • Logiciels de gestion • Logistique • Industrie • Énergie • Médias • Éducation • Conseil »
- CTA : « Découvrir CLEVONE » · « Nos solutions »
- Vision : « Architecture de gouvernance des flux économiques territoriaux »
- Version EN conservée sur `/en`

## SEO

- `html lang="fr"` sur `/` et pages FR ; `lang="en"` sur pages EN
- Title FR : `CLEVONES | Technologie, Business & Infrastructure Numérique`
- Description FR : entreprise congolaise, plateformes numériques, logiciels de gestion, solutions logistiques, médiatiques, éducatives et institutionnelles
- Canonical + `hreflang="fr"` / `hreflang="en"` / `x-default` → FR
- Metadata EN conservée pour `/en` et slugs anglais

## Fichiers clés i18n

- `lib/i18n/locales.ts`, `lib/i18n/routes.ts`, `lib/i18n/hreflang.ts`
- `lib/seo/metadata.ts`, `lib/site.ts`
- `app/(public)/page.tsx` (FR) · `app/(public)/en/page.tsx` (EN)
- `next.config.ts` (redirect `/accueil` → `/`)

## QA

| Contrôle | Résultat |
|---|---|
| `/` affiche le français | OK |
| FR → contenu français | OK |
| EN → contenu anglais | OK |
| Sélecteur FR \| EN | OK |
| Refresh après changement de langue | OK (locale dans l’URL) |
| Navigation interne FR/EN | OK |
| Metadata / canonical / hreflang | OK |
| Mobile (UA iPhone, switcher header + menu) | OK |
| `npm run lint` | OK — 0 warning / 0 error |
| `npx tsc --noEmit` | OK |
| Suite de tests | Absente du dépôt |
| `npm run build` | OK |
| Déploiement | Non effectué |

## Restant

- Commit / revue humaine
- Déploiement hors périmètre de ce sprint
