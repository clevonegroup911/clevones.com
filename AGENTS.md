# AGENTS.md — Clevones.com

Règles applicables à tout le dépôt. Lire ce fichier, `backlog.json`, `PROJECT_CONTEXT.md` et `TASK_REPORT.md` avant toute action.

X200 est la gouvernance courante (registre T001–T200). X100 reste l’historique, les preuves `[X100-*]` et le **contrat de commandes** `npm run x100:*`. Ce n’est ni une promesse de vitesse ×200, ni une obligation de créer 200 tâches. Détail : `docs/X200_GOVERNANCE.md`.

## Priorité des instructions

1. Demande explicite du propriétaire.
2. Sécurité (secrets, production, authentification, données).
3. `AGENTS.md`.
4. `backlog.json`.
5. Instruction de la tâche courante.
6. Règles Cursor (`.cursor/rules/`).

En cas de conflit, appliquer l’élément de rang supérieur et consigner l’écart dans `TASK_REPORT.md`.

## Lecture obligatoire

Avant toute réponse ou exécution :

1. Lire `AGENTS.md`, `PROJECT_CONTEXT.md`, `backlog.json`, `TASK_REPORT.md` et, si besoin, `docs/X200_GOVERNANCE.md`.
2. Inspecter `git status`, la branche, `HEAD`, et l’état GitHub (PR/CI) lorsque l’accès le permet.
3. Exécuter `npm run x100:validate` (alias `npm run x200:validate`).
4. Exécuter `npm run x100:next -- --json` (alias `npm run x200:next -- --json`).
5. Après une interruption : `HEAD`, PR, CI, backlog, tâche active, puis `npm run x200:resume`.

## Contrat de commandes (compatibilité X100)

Conserver et ne pas casser : `x100:validate`, `x100:next`, `x100:test`, `scripts/next-task.mjs`, `scripts/validate-backlog.mjs`, `scripts/validate-task-report.mjs`, GitHub Actions `[X100-CI]`.

| Fonction | Commande stable | Alias optionnel |
|---|---|---|
| Valider backlog + rapport | `npm run x100:validate` | `x200:validate` |
| Prochaine tâche (lecture) | `npm run x100:next -- --json` | `x200:next` |
| Tests gouvernance | `npm run x100:test` | `x200:test` |
| Diagnostic | `npm run x200:doctor` | lecture seule |
| Réserver | `npm run x200:claim -- --json [--dry-run] T0XX` | mutation |
| Contrôles tâche | `npm run x200:quality-gate -- --task T0XX` | `--dry-run` liste sans exécuter |
| Rapport | `npm run x200:report` | n’écrit pas de commit |
| Reprise | `npm run x200:resume` | `--apply` seulement après inspection |
| Prérequis déploiement | `npm run x200:deploy-check` | ne déploie jamais |

Un renommage exclusif `x100:*` → `x200:*` n’est pas exigé par T017. Codex n’est pas une dépendance.

## Règles X200

1. Vérifier contexte + Git/GitHub + backlog avant d’agir.
2. Zéro doublon : `TERMINÉE` + preuve valide = ne pas refaire.
3. Après interruption : `HEAD`, PR, CI, backlog, tâche active.
4. Vérité : `CONFIRMÉ` / `INDIQUÉ` / `PROPOSÉ` / `INCONNU` / `NON_ACCESSIBLE` ; aucun succès inventé.
5. Continuité : tant qu’une tâche `PRÊTE` et autorisée existe, et qu’aucune `EN_CONTRÔLE` n’attend la CI, continuer.
6. Sécurité : moindre privilège, MFA, secrets hors Git, backup et restauration distincts.
7. Trois échecs identiques : stop, diagnostic, `BLOQUÉE` ou nouvelle stratégie.
8. Mesure : délai, coût, défauts, doublons, preuves (`docs/X200_GOVERNANCE.md`).
9. `TERMINÉE` = critères + contrôles + preuves.
10. T001–T200 : espace d’identifiants ; ne jamais créer 200 tâches artificielles.

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
