# AGENTS.md — Clevones.com

Règles applicables à tout le dépôt. Lire `backlog.json`, `PROJECT_CONTEXT.md` et `TASK_REPORT.md` avant une nouvelle exécution. X200 FAST-LANE est la gouvernance courante. X100 reste l’historique et le contrat de compatibilité des commandes `npm run x100:*`.

## Priorité

1. Demande explicite du propriétaire.
2. Sécurité : production, secrets, authentification, données, permissions, opérations financières.
3. `AGENTS.md`.
4. `backlog.json`.
5. Tâche courante.
6. Règles Cursor.

Ne jamais inventer une validation, un déploiement ou une preuve.

## X200 FAST-LANE

Objectif : supprimer les pauses administratives, répétitions et contrôles lourds inutiles sans réduire la sécurité réelle.

1. Zéro doublon : une tâche `TERMINÉE` avec preuve valide n’est pas rejouée.
2. Une tâche validée peut être clôturée et la prochaine tâche `PRÊTE` réservée dans le même cycle.
3. Une tâche `EN_CONTRÔLE` ne bloque plus globalement les autres tâches indépendantes.
4. Maximum trois tâches `EN_COURS` réellement indépendantes.
5. Les périmètres qui se chevauchent ne sont jamais exécutés en parallèle.
6. Authentification, MFA et migrations ne sont jamais parallélisés entre eux.
7. Les tâches `requiresHuman: true` restent interdites à l’auto-exécution sans autorisation explicite du propriétaire.
8. Trois échecs de même cause : arrêter la répétition, diagnostiquer et changer de stratégie.
9. Aucun screenshot GitHub n’est une preuve requise. Utiliser les données GitHub/CI et les SHA.
10. Le commentaire `[X100-CI]` est informatif et hors chemin critique. Le job requis est `quality`.

## Autopilot Fedora local

Le mode recommandé pour le travail continu est `npm run x200:autopilot:daemon`.

- Le superviseur reste sur Fedora et n'utilise pas de Cursor Cloud Agent.
- Il lance Cursor CLI en mode headless, puis relance automatiquement une nouvelle session quand une session se termine ou atteint son timeout.
- Une session interrompue doit reprendre l'état réel (`EN_COURS`, claims, Git, preuves) au lieu de recommencer la tâche.
- Il réconcilie les tâches `EN_CONTRÔLE` avec le vrai job GitHub `quality`, puis poursuit immédiatement.
- Il continue tant qu'il existe une tâche automatique admissible.
- Il écrit `.x200/HUMAN_GATE.json` seulement lorsqu'une décision propriétaire est réellement obligatoire.
- Le superviseur courant exécute un agent local à la fois pour éviter les collisions d'un seul working tree. Le registre conserve néanmoins la limite X200 de trois tâches indépendantes pour une future exécution multi-worktree validée.
- Trois cycles sans progrès Git ni backlog provoquent un arrêt diagnostiqué au lieu d'une boucle coûteuse.

Voir `docs/X200_AUTOPILOT.md`.

## Gates humains

Aucune confirmation humaine de routine pour : lire le dépôt, analyser, modifier une branche de travail, tester, mettre à jour les rapports, pousser la branche autorisée, ouvrir ou mettre à jour une PR draft, clôturer une tâche non sensible dont les preuves sont valides, ou démarrer une autre tâche indépendante.

Gate humain obligatoire pour une opération réellement sensible ou destructive, notamment :

- merge final lorsqu’il livre un changement sensible ;
- déploiement ou changement production ;
- migration réelle de base de données ;
- suppression/restauration de données ;
- modification de secrets, credentials, permissions ou protections GitHub ;
- auth/MFA en production ;
- transaction financière réelle ou clé de paiement ;
- opération irréversible ou à impact externe majeur.

Un gate bloque seulement le travail concerné ; les autres tâches indépendantes peuvent continuer.

## CI adaptative

### METADATA

Pour un delta composé uniquement d’état et de preuves non exécutables (`backlog.json` sans changement de politique, `BACKLOG.md`, `TASK_REPORT.md`, `reports/tasks/*`) :

- validation backlog/rapport ;
- diff-check ;
- scan léger des secrets ;
- pas de build ;
- pas d’installation Chromium ;
- pas de Playwright complet.

Une modification de politique, dépendances, `requiresHuman`, scope de sécurité ou règles d’exécution dans `backlog.json` n’est pas considérée comme simple metadata.

### FAST

Pour le code ordinaire sur une PR draft :

- validation X200 ;
- tests de gouvernance ;
- tests unitaires ;
- lint ;
- type-check ;
- diff-check ;
- scan secrets.

Build et Playwright ne sont pas obligatoires à chaque cycle ordinaire.

### FULL

Obligatoire pour :

- PR prête à fusionner ;
- push `main` de vérification ;
- changements CI/règles de contrôle ;
- auth/MFA ;
- Prisma/migration DB ;
- secrets/credentials ;
- déploiement/production ;
- dépendances/lockfile ;
- classification inconnue ou ambiguë.

FULL inclut FAST + validation Prisma, intégration PostgreSQL concernée, build, audit et Playwright. Les migrations exécutées en CI ne visent que la base éphémère CI, jamais la production.

Le job `quality = SUCCESS` est la preuve CI principale. Ne pas attendre la fin du simple job de commentaire `[X100-CI]` pour avancer. Une preuve CI doit correspondre au bon dépôt, au bon SHA et à la lane requise.

## Lecture et reprise

Au démarrage ou après interruption :

1. vérifier branche, `HEAD`, `git status` ;
2. lire `backlog.json` et `TASK_REPORT.md` ;
3. vérifier PR et job `quality` si nécessaire ;
4. exécuter `npm run x200:validate` ;
5. sélectionner uniquement du travail non déjà terminé ;
6. réconcilier un bail expiré avant toute répétition d’effet externe.

Ne pas refaire un audit complet si le contexte et les preuves actuelles sont déjà suffisants.

## Contrat de commandes

Conserver : `x100:validate`, `x100:next`, `x100:test` et leurs scripts historiques. Les alias X200 sont préférés pour les nouvelles opérations.

| Fonction | Commande |
|---|---|
| Valider | `npm run x200:validate` |
| Prochaine tâche | `npm run x200:next -- --json` |
| Tests gouvernance | `npm run x200:test` |
| Diagnostic | `npm run x200:doctor` |
| Réserver | `npm run x200:claim -- --json T0XX` |
| Contrôles tâche | `npm run x200:quality-gate -- --task T0XX` |
| Rapport | `npm run x200:report` |
| Reprise | `npm run x200:resume` |
| Prérequis déploiement | `npm run x200:deploy-check` |
| Autopilot local | `npm run x200:autopilot:daemon` |

## Sélection et parallélisme

- Commencer uniquement une tâche `PRÊTE` dont les dépendances sont `TERMINÉE`.
- `EN_CONTRÔLE` n’est plus un verrou global.
- Maximum trois tâches `EN_COURS`.
- Maximum une P0 `EN_COURS`.
- Avant réservation parallèle, contrôler collision de scope avec les tâches `EN_COURS` et `EN_CONTRÔLE`.
- Un scope parent/enfant est une collision (`app/` avec `app/foo/`).
- Un scope inconnu ou ambigu n’est pas supposé indépendant.
- Auth/MFA/migration ne sont jamais parallélisés.
- Le registre canonique reste écrit sous verrou ; les workers ne doivent pas écraser les claims ou `registryVersion` d’un autre cycle.

## Sécurité

- Ne jamais afficher ou committer un secret réel.
- Ne jamais modifier `.env` réel automatiquement.
- Aucun accès production sans autorisation explicite adaptée à l’opération.
- Aucun push direct sur `main`.
- Aucun merge automatique sensible.
- Aucun déploiement automatique.
- Aucun service IA payant ou clé supplémentaire nécessaire à la CI.

## Clôture

`TERMINÉE` exige critères satisfaits, contrôles requis réussis sur le bon état et preuves enregistrées. Distinguer clairement : implémenté, testé, CI validée, fusionné, déployé.

Après `quality = SUCCESS` pour la lane requise :

1. réconcilier la preuve au SHA concerné ;
2. clôturer la tâche ;
3. recalculer les tâches prêtes ;
4. démarrer immédiatement une autre tâche autorisée dans le même cycle si disponible ;
5. ne pas créer une attente supplémentaire uniquement pour valider le commentaire ou le rapport qui vient d’enregistrer cette preuve.

Mettre à jour les rapports de façon compacte et éviter les commits de métadonnées multiples lorsqu’un seul commit suffit.
