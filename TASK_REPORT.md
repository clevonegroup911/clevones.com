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

Implémenté et testé localement sur `feat/site-identity-contact-nav` (7 phases, un commit par phase, détail dans `reports/tasks/T084.md`). Poussé sur la PR brouillon #16 ; CI `quality` FULL SUCCESS sur `7136394` ; MERGED=NO, DEPLOYED=NO.

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
- PUSHED=YES (branche de travail uniquement, PR #16 brouillon)
- MERGED=NO
- DEPLOYED=NO

## Commit

- feat/site-identity-contact-nav : d96c07b, 742f618, 2467163, 1940668, ee53c12, 04b587c, be69b73, 5101da4 (D1), a81fbf7, f5d0793, 60fd60b (DEPLOYMENT.md : version PostgreSQL production à vérifier), 7136394 (fusion de `main`)

## Pull Request

- https://github.com/clevonegroup911/clevones.com/pull/16 (brouillon, non fusionnée — relecture propriétaire)

## Preuves

- reports/tasks/T084.md (commits par phase, tableau des contrastes WCAG)
- tests/e2e/evidence/*-avant.png et *-apres.png (375 et 1280 px, ignorés par Git)

## CI de la PR #16

- PR #17 (`chore/deps-audit`) fusionnée dans `main` le 2026-11-23 (`59c6b69`) : dépendances, `effect` ^3.22.5, service CI `postgres:18-alpine`.
- `main` fusionné dans la branche (`7136394`, merge sans rebase) ; conflit `backlog.json` résolu en gardant T084 et T085.
- Job `quality` sur `7136394`, lane FULL, run 45408187298 :
  - tentative 1 : échec `playwright` seul (34 PASS, 1 échec, 2 instables, 1 non exécuté) ; erreurs serveur `next dev` « Unexpected end of JSON input » au chargement des manifestes (5 occurrences), non reproduites localement en requêtes concurrentes ;
  - tentative 2 (relance des jobs échoués, même SHA) : **SUCCESS**, 15/15 étapes requises PASS (classify, doctor, prisma_validate, backlog, x100_tests, task_report, tests, lint, typecheck, db_integration, build, diff_check, secrets, audit, playwright) ; Playwright 37 PASS + 1 instable (x200-control-center « SUPER_ADMIN confirmation modal », PASS au retry).
- Vérifications locales après fusion de `main` : `npm ci` 0 (462 paquets), `prisma generate` 0, lint 0 (aucun avertissement ESLint), `tsc --noEmit` 0, `npm test` 201/201, `npm run x200:test` 75/75, build 0, `x200:validate` valide. Playwright `product-surfaces` local : non concluant (2 échecs sur la même erreur de manifeste `next dev` après `next build`, puis run interrompu ; Docker local arrêté) — la preuve Playwright retenue est la CI.

## Risques

- La route publique `/api/initiative-submission` n'a ni limitation de débit ni contrôle d'origine (état antérieur conservé) : à traiter séparément.
- Le sélecteur de langue ne conserve pas `?intent=` lors du passage FR ↔ EN.

## Décisions propriétaire

- D1 tranchée (2026-11-20) : « Éditeur et responsable de la publication : CLEVONE SARL » / « Publisher and publication manager: CLEVONE SARL », suivi du RCCM, de l'ID Nat. et du siège ; aucun nom de personne — commit `5101da4`.
- D2 (capital non affiché) et D3 (logo et couleurs officiels) : tranchées avant exécution, appliquées.

## Blocage

- aucun

## Prochaine tâche prête

- aucune automatique ; fusion de la PR #16 soumise à la relecture du propriétaire
