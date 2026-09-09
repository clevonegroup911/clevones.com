# Gouvernance Multi-IA X200 — Clevones.com

X200 est la gouvernance courante à partir de T017. Ce n’est ni une promesse de vitesse ×200, ni une obligation de créer 200 tâches.

Les commentaires `[X100-CURSOR]`, `[X100-CI]`, `[X100-CONTROL]` et `[X100-OWNER-*]` restent des **preuves historiques valides**. Ils ne sont pas renommés.

Décision propriétaire : PR #1 `[X200-GOVERNANCE]` (commentaire 5593482867).

## Compatibilité X100

Les commandes `npm run x100:*` restent le contrat d’automatisation :

| Commande | Rôle |
|---|---|
| `npm run x100:validate` | backlog + rapport |
| `npm run x100:validate-backlog` | schéma du registre |
| `npm run x100:validate-report` | `TASK_REPORT.md` |
| `npm run x100:next -- --json` | prochaine tâche `PRÊTE` |
| `npm run x100:test` | tests des scripts de gouvernance |

Les scripts `scripts/next-task.mjs`, `scripts/validate-backlog.mjs`, `scripts/validate-task-report.mjs` et le workflow `.github/workflows/ci.yml` (nom historique **X100 CI**, commentaire `[X100-CI]`) ne doivent pas être cassés.

Des alias `x200:*` existent déjà dans `package.json`. Un renommage technique exclusif `x100:*` → `x200:*` n’est **pas** T017 ; ce serait une tâche future si elle apporte une valeur réelle.

## Identifiants

Espace disponible : **T001–T200**. T001–T016 sont historiques et intouchables. Ne jamais inventer des tâches pour remplir la plage.

## États de vérité

Tout fait rapporté porte l’une de ces classes. Aucun succès, test ou chiffre inventé.

| Classe | Signification |
|---|---|
| `CONFIRMÉ` | observé dans cette session (fichier, commande, `gh`) |
| `INDIQUÉ` | présent dans le dépôt ou un commentaire, non revérifié maintenant |
| `PROPOSÉ` | recommandation, pas un état du système |
| `INCONNU` | non établi |
| `NON_ACCESSIBLE` | hors d’accès (production, secret, conversation, compte) |

Un état historique n’est pas un état actuellement vérifié. Une absence d’accès n’est pas une absence de configuration.

## Zéro doublon

`TERMINÉE` + preuve encore valide = **ne pas refaire**. Une régression crée une tâche liée (`regressionOf`) ; elle n’efface pas l’historique. `ANNULÉE` ne satisfait pas une dépendance.

## Reprise après interruption

Avant de continuer :

1. `git status`, branche, `HEAD`
2. PR et CI GitHub si l’accès le permet
3. `backlog.json` et `TASK_REPORT.md`
4. `npm run x100:validate` (alias `x200:validate`)
5. `npm run x200:resume -- --json` s’il existe une réservation / `EN_COURS`

Un bail expiré ne prouve pas l’absence d’effet. Pas de garantie « exactement une fois ». Relais ChatGPT : **NON CONFIGURÉ**.

## Règle des trois échecs identiques

Après **trois** échecs consécutifs de même cause pour une tâche et une version : arrêter la répétition, consigner le diagnostic, passer `BLOQUÉE` ou changer de stratégie. Ne pas masquer l’échec par un code de sortie positif.

## Limites WIP (inchangées)

- une seule P0 `EN_COURS`
- au plus trois `EN_COURS`
- jamais de migration ou d’authentification en parallèle
- pas d’autre tâche tant qu’une `EN_CONTRÔLE` attend la CI (`IN_CONTROL_WAIT`)
- T010/T011 : humaines, sans autorisation propriétaire

## Sécurité

Moindre privilège, MFA admin, secrets hors Git, pas de production automatique, sauvegarde/restauration distinctes (document ≠ exécution ≠ test de restauration). Voir `SECURITY.md` et `DEPLOYMENT.md`.

## Métriques X200

Mesurer avec les champs déjà dans `backlog.json` et les rapports. Pas de score de rentabilité inventé.

| Métrique | Source |
|---|---|
| Délai | `updatedAt`, dates `history`, timestamps des preuves CI |
| Coût | `estimatedCost` (effort relatif déjà dans le registre) |
| Défauts | `attempts`, `lastFailureCause`, `consecutiveSameCauseFailures`, tests échoués du rapport |
| Doublons | IDs uniques, refus de rejouer une `TERMINÉE` encore prouvée |
| Preuves | `evidence`, `evidenceRecords`, `reports/tasks/<ID>.md`, commentaire `[X100-CI]` |

## TERMINÉE

Critères d’acceptation + contrôles requis sur l’état livré + preuves vérifiables. Distinguer : implémenté, testé, fusionné, déployé.

## Lecture de session

1. Contexte disponible (`AGENTS.md`, `PROJECT_CONTEXT.md`, `backlog.json`, `TASK_REPORT.md`)
2. État Git / GitHub
3. `npm run x100:validate` puis `npm run x100:next -- --json`
4. Continuer seulement si une tâche est `PRÊTE`, autorisée, dépendances `TERMINÉE`, et aucune `EN_CONTRÔLE` n’attend la CI
