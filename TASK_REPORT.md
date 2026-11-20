# TASK_REPORT

[X100-CURSOR]

[X200-CURSOR]

## ID

T084

## Statut

EN_COURS

## Objectif

Refonte éditoriale et fonctionnelle du site public sur demande du propriétaire : identité légale alignée sur les statuts et le RCCM (RCCM et ID Nat. visibles, capital retiré), neutralité limitée aux missions de coordination, parcours « Demande produit / devis », menu réduit à 5 entrées, cohérence de marque, logo et palette officiels en thème clair.

## Résultat

Implémenté et testé localement sur `feat/site-identity-contact-nav` (7 phases, un commit par phase, détail dans `reports/tasks/T084.md`). Non poussé, pas de PR, pas de CI, MERGED=NO, DEPLOYED=NO.

## Fichiers créés

- `components/sections/contact-product-form.tsx`
- `lib/validation/initiative-submission.test.ts`
- `public/brand/official/clevone-sarl-logo.png` / `clevone-sarl-symbol.png` / `clevone-sarl-profile.png` (fichiers fournis par la direction)
- `reports/tasks/T084.md`

## Fichiers modifiés

- `lib/constants/company.ts`, `corporate-purpose.ts`, `brand-positioning.ts`, `contact-form-options.ts`, `mobile-cta.ts`
- `lib/i18n/content/*` (pages, `en.ts`, `fr.ts`, `types.ts`), `lib/i18n/navigation.ts`
- `lib/validation/initiative-submission.ts`, `lib/contact-form.ts`, `lib/contact-page.ts`, `lib/initiative-submission-email.ts`, `lib/initiative-submission-log.ts`, `lib/email/templates.ts`
- `app/api/initiative-submission/route.ts`, `app/globals.css`, `app/layout.tsx`, icônes `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico`, `public/og-image.png`
- `components/layout/*`, `components/sections/*`, `components/ui/*`, `components/seo/organization-json-ld.tsx`
- `tests/e2e/product-surfaces.spec.ts`, `package.json` (script `test` : ajout de `lib/validation/*.test.ts`)

## Fichiers supprimés

- `lib/{about,ecosystem,faq,governance,methodology,mission,positioning,solutions}-page.ts` (non importés, ancienne doctrine)

## Commandes

- npm run x200:validate
- npm test
- npm run x200:test
- npm run lint
- npx tsc --noEmit
- npm run build
- npx playwright test
- npm run x200:scan-secrets
- git diff --check

## Tests réussis

- npm test : 201/201 PASS (dont 9 nouveaux tests du schéma de contact)
- npm run x200:test : 75/75 PASS
- npx playwright test tests/e2e/product-surfaces.spec.ts : 10/10 PASS (desktop + mobile, base e2e éphémère locale)
- npx playwright test (suite complète, base vierge) : 37/38 PASS ; 1 échec `x200-control-center` « MARK_READY remote mismatch » (timeout à l'étape de connexion MFA admin), repassé seul : PASS (17,4 s) — intermittent, hors périmètre T084
- npm run x200:validate : BACKLOG_VALID, TASK_REPORT_VALID
- npm run x200:scan-secrets : PASS (fixtures e2e connues seulement)
- git diff --check : PASS

## Tests échoués

- aucun échec reproductible. Intermittent : x200-control-center « MARK_READY remote mismatch » (connexion MFA) en suite complète, PASS en relance isolée.
- Environnement local : le port 55432 du script e2e est occupé par `clevones-x200-db` (réseau hôte) et le réseau bridge Docker ne publie pas les ports ; les e2e ont été lancés avec `PLAYWRIGHT_DATABASE_URL` vers un PostgreSQL éphémère en réseau hôte sur 55440 (arrêté ensuite).

## Lint

- PASS (0 avertissement)

## Type-check

- PASS

## Build

- PASS — aucun déploiement

## Sécurité

- SECRET_VALUES_EXPOSED=NO
- ENV_MODIFIED=NO
- PRISMA_MIGRATION=NO
- HUMAN_GATE_BYPASS=NO
- PUSHED=NO
- MERGED=NO
- DEPLOYED=NO

## Commit

- feat/site-identity-contact-nav : d96c07b, 742f618, 2467163, 1940668, ee53c12, 04b587c, be69b73, 5101da4 (D1) + commit de clôture

## Pull Request

- aucune (push non autorisé à ce stade)

## Preuves

- reports/tasks/T084.md (commits par phase, tableau des contrastes WCAG)
- tests/e2e/evidence/*-avant.png et *-apres.png (375 et 1280 px, ignorés par Git)

## Risques

- La route publique `/api/initiative-submission` n'a ni limitation de débit ni contrôle d'origine (état antérieur conservé) : à traiter séparément.
- Le sélecteur de langue ne conserve pas `?intent=` lors du passage FR ↔ EN.

## Décisions propriétaire

- D1 tranchée (2026-11-20) : « Éditeur et responsable de la publication : CLEVONE SARL » / « Publisher and publication manager: CLEVONE SARL », suivi du RCCM, de l'ID Nat. et du siège ; aucun nom de personne — commit `5101da4`.
- D2 (capital non affiché) et D3 (logo et couleurs officiels) : tranchées avant exécution, appliquées.

## Blocage

- aucun

## Prochaine tâche prête

- aucune automatique ; push / PR soumis à l'accord du propriétaire
