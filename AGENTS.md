# AGENTS.md — Clevones.com

Règles applicables à tout le dépôt. Lire ce fichier, `backlog.json`, `PROJECT_CONTEXT.md` et `TASK_REPORT.md` avant toute action.

X200 est la version courante de la gouvernance (registre T001–T200). X100 reste l’historique et l’alias des commandes. Ce n’est ni une promesse de vitesse ×200, ni une obligation de créer 200 tâches.

## Priorité des instructions

1. Demande explicite du propriétaire.
2. Sécurité (secrets, production, authentification, données).
3. `AGENTS.md`.
4. `backlog.json`.
5. Instruction de la tâche courante.
6. Règles Cursor (`.cursor/rules/`).

En cas de conflit, appliquer l’élément de rang supérieur et consigner l’écart dans `TASK_REPORT.md`.

## Lecture obligatoire

Avant de modifier le code :

1. Lire `AGENTS.md`, `PROJECT_CONTEXT.md`, `backlog.json` et `TASK_REPORT.md`.
2. Exécuter `npm run x200:validate` (alias : `npm run x100:validate`).
3. Exécuter `npm run x200:next -- --json` (alias : `npm run x100:next -- --json`).
4. Inspecter `git status`, la branche et `HEAD`.
5. Après une interruption : `npm run x200:resume`.

## Correspondance des commandes

| Fonction | Commande X200 | Alias X100 / lecture seule |
|---|---|---|
| Diagnostic | `npm run x200:doctor` | lecture seule |
| Valider le registre | `npm run x200:validate-backlog` | `npm run x100:validate-backlog` |
| Valider le rapport | `npm run x200:validate-report` | `npm run x100:validate-report` |
| Valider les deux | `npm run x200:validate` | `npm run x100:validate` |
| Prochaine tâche | `npm run x200:next -- --json` | `npm run x100:next -- --json` (sans `--write` = simulation) |
| Réserver | `npm run x200:claim -- --json [--dry-run] T0XX` | mutation |
| Contrôles | `npm run x200:quality-gate -- --task T0XX` | `--dry-run` liste sans exécuter |
| Rapport | `npm run x200:report` | n’écrit pas de commit |
| Reprise | `npm run x200:resume` | `--apply` seulement après inspection |
| Prérequis déploiement | `npm run x200:deploy-check` | ne déploie jamais |
| Migration registre | `npm run x200:migrate` | `--dry-run` d’abord |
| Tests gouvernance | `npm run x200:test` | `npm run x100:test` |

Codex n’est pas une dépendance. Node.js standard suffit.

## Sélection des tâches

- Commencer uniquement une tâche dont l’état est `PRÊTE`.
- Ne pas commencer une autre tâche tant qu’une tâche `EN_CONTRÔLE` attend la CI (`IN_CONTROL_WAIT`).
- Respecter priorité, risque élevé, dépendances, périmètre (`scope`) et critères d’acceptation.
- Une seule tâche **P0** simultanée (`EN_COURS`).
- Maximum **trois** tâches `EN_COURS` indépendantes.
- Ne jamais paralléliser des travaux de **migration** ou d’**authentification**.
- Ne jamais sélectionner `BLOQUÉE`, `ÉCHOUÉE`, `EN_CONTRÔLE` ou `ANNULÉE`.
- Une tâche `ANNULÉE` ne satisfait pas une dépendance : la requalifier explicitement.
- Ne pas rejouer une tâche `TERMINÉE` dont les preuves restent valides.
- Les tâches `requiresHuman: true` ne sont pas auto-sélectionnées (`--include-human` seulement si le propriétaire l’autorise).
- Mode d’exécution : **un seul exécutant local**. `backlog.json` ne coordonne pas des machines distantes.

## Travail

- Inspecter `git status` avant toute modification.
- Inspecter chaque fichier avant de le changer.
- Préserver le travail existant (commits MFA, tests, scripts, T001–T016).
- Rester dans le périmètre de la tâche.
- Réserver via `x200:claim` avant d’écrire ; un jeton expiré ne peut pas finaliser une tâche reprise par un autre.
- Ne jamais désactiver un test pour le faire passer.
- Arrêter une boucle après **trois échecs identiques** ; marquer `BLOQUÉE` ou `ÉCHOUÉE` avec preuves.
- Aucune dépendance npm si Node.js standard suffit.
- Aucun service IA, aucune API payante, aucun `OPENAI_API_KEY`, aucun webhook secret.

## Secrets et production

- Ne jamais afficher, journaliser ou committer un secret, mot de passe ou jeton.
- Ne jamais modifier `.env` réel ni stager `.env`.
- Ne jamais accéder à la production, ni la modifier, sauf autorisation propriétaire explicite limitée.
- Ne jamais déployer automatiquement. `x200:deploy-check` ne déploie pas.
- Ne jamais pousser sur `main`.
- Ne jamais fusionner automatiquement.
- Aucune livraison sensible automatique.

## Contrôles

Avant de déclarer un résultat :

1. `npm run x200:validate`
2. Contrôles listés par la tâche (`tests`, lint, type-check, build selon le périmètre) via `npm run x200:quality-gate`
3. `git diff --check`
4. Vérifier l’absence de secrets et de chemins personnels

`TERMINÉE` exige critères satisfaits, contrôles réussis sur l’état livré, preuves enregistrées et absence de blocage critique. Distinguer implémenté, testé, fusionné et déployé. Un quality-gate en échec interdit `TERMINÉE`.

## Clôture

- Mettre à jour `backlog.json` (état, preuves, `updatedAt`, `registryVersion`, `nextTaskId`).
- Mettre à jour `TASK_REPORT.md` avec `[X100-CURSOR]` et `[X200-CURSOR]`.
- Copier le rapport dans `reports/tasks/<ID>.md`.
- Déclarer `TERMINÉE` uniquement avec preuves (commit, tests, CI si exigée).
- Commits conventionnels sur la branche de travail.
- Ouvrir ou mettre à jour une **Pull Request draft**.
- Laisser GitHub Actions publier `[X100-CI]` (canal CI). Aucun relais ChatGPT n’est configuré.
- Ne pas fusionner. Ne pas déployer.
- `x200:report` ne doit pas être branché sur un commit automatique (évite une boucle CI).

## Git

- Branche de travail, jamais `main` en push direct.
- Push de la branche de tâche seulement si la tâche l’autorise.
- Le commentaire CI `[X100-CI]` est le pont vers le contrôle GitHub.
- Toute fusion ou mise en production reste une décision humaine.
