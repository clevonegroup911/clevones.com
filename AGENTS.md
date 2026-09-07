# AGENTS.md — Clevones.com

Règles applicables à tout le dépôt. Lire ce fichier, `backlog.json` et `TASK_REPORT.md` avant toute action.

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

1. Lire `AGENTS.md`, `backlog.json` et `TASK_REPORT.md`.
2. Exécuter `npm run x100:validate`.
3. Exécuter `npm run x100:next -- --json`.
4. Inspecter `git status`, la branche et `HEAD`.

## Sélection des tâches

- Commencer uniquement une tâche dont l’état est `PRÊTE`.
- Respecter priorité, dépendances, périmètre (`scope`) et critères d’acceptation.
- Une seule tâche **P0** simultanée (`EN_COURS`).
- Maximum **trois** tâches `EN_COURS` indépendantes.
- Ne jamais paralléliser des travaux de **migration** ou d’**authentification**.
- Ne jamais sélectionner `BLOQUÉE`, `ÉCHOUÉE` ou `EN_CONTRÔLE`.
- Ne pas commencer une autre tâche tant que la CI distante n’a pas tranché une tâche `EN_CONTRÔLE`.

## Travail

- Inspecter `git status` avant toute modification.
- Inspecter chaque fichier avant de le changer.
- Préserver le travail existant (commits MFA, tests, scripts).
- Rester dans le périmètre de la tâche.
- Ne jamais désactiver un test pour le faire passer.
- Arrêter une boucle après **trois échecs identiques** ; marquer `BLOQUÉE` ou `ÉCHOUÉE` avec preuves.
- Aucune dépendance npm si Node.js standard suffit.
- Aucun service IA, aucune API payante, aucun `OPENAI_API_KEY`, aucun webhook secret.

## Secrets et production

- Ne jamais afficher, journaliser ou committer un secret, mot de passe ou jeton.
- Ne jamais modifier `.env` réel ni stager `.env`.
- Ne jamais accéder à la production, ni la modifier.
- Ne jamais déployer.
- Ne jamais pousser sur `main`.
- Ne jamais fusionner automatiquement.
- Aucune livraison sensible automatique.

## Contrôles

Avant de déclarer un résultat :

1. `npm run x100:validate`
2. Contrôles listés par la tâche (`tests`, lint, type-check, build selon le périmètre)
3. `git diff --check`
4. Vérifier l’absence de secrets et de chemins personnels

## Clôture

- Mettre à jour `backlog.json` (état, preuves, `updatedAt`, `nextTaskId`).
- Mettre à jour `TASK_REPORT.md` avec le marqueur `[X100-CURSOR]`.
- Copier le rapport dans `reports/tasks/<ID>.md`.
- Déclarer `TERMINÉE` uniquement avec preuves (commit, tests, PR si exigée).
- Commits conventionnels sur la branche de travail.
- Ouvrir ou mettre à jour une **Pull Request draft**.
- Laisser GitHub Actions décider du contrôle (`[X100-CI]`).
- Ne pas fusionner. Ne pas déployer.

## Git

- Branche de travail, jamais `main` en push direct.
- Push de la branche de tâche seulement si la tâche l’autorise.
- Le commentaire CI `[X100-CI]` est le pont vers le contrôle externe.
- Toute fusion ou mise en production reste une décision humaine.
