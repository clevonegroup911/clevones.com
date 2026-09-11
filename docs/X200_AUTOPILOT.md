# X200 AUTOPLAN + FAST-LANE — Fedora Local Autopilot

## Objectif

Travailler continuellement jusqu'à la fin réelle du produit : analyser, planifier, exécuter, vérifier, replanifier et reprendre automatiquement, avec gates humains uniquement pour les opérations réellement sensibles.

Le superviseur local relance automatiquement un nouvel agent Cursor après chaque tâche, interruption ou timeout. Lorsque le backlog n'a plus de tâche automatique admissible, il ne s'arrête plus immédiatement : il déclenche AUTOPLAN pour comparer l'état réel au but canonique `PRODUCT_GOAL.md` et générer le prochain travail utile sans doublon.

## Boucle

Le processus `scripts/x200-autopilot.mjs` reste local sur Fedora. Il ne dépend pas des Cursor Cloud Agents.

1. vérifier que le dépôt est propre ;
2. valider `backlog.json` et `TASK_REPORT.md` ;
3. reprendre une tâche `EN_COURS` ;
4. réconcilier `EN_CONTRÔLE` avec le vrai job GitHub `quality` ;
5. sinon sélectionner une tâche `PRÊTE` non humaine ;
6. lancer Cursor CLI headless pour exécuter la tâche ;
7. enregistrer tests, preuves, commit/push sur la branche autorisée ;
8. relancer immédiatement un cycle ;
9. s'il n'existe plus de travail automatique, lancer AUTOPLAN ;
10. AUTOPLAN audite le code, le backlog, les tests, la documentation et `PRODUCT_GOAL.md` ;
11. AUTOPLAN crée au maximum trois tâches réellement utiles, cohérentes et non dupliquées ;
12. le superviseur reprend FAST-LANE sur ces nouvelles tâches ;
13. répéter jusqu'à preuve réelle de fin produit ou jusqu'à un gate humain/externe légitime.

## Fin produit

Le produit n'est pas considéré fini uniquement parce que le backlog est vide.

AUTOPLAN doit comparer l'état réel aux critères de `PRODUCT_GOAL.md`. Si tous les critères sont réellement satisfaits sur le HEAD courant, l'agent écrit localement :

```text
.x200/PRODUCT_COMPLETE.json
```

Le superviseur n'accepte ce marqueur que s'il contient :

- `version: 1` ;
- le `head` Git courant ;
- le hash SHA-256 courant de `PRODUCT_GOAL.md` ;
- des preuves concrètes non vides.

Tout changement de HEAD ou de `PRODUCT_GOAL.md` invalide donc automatiquement l'ancien marqueur et force un nouvel audit AUTOPLAN.

## Prérequis Fedora

- Node.js conforme à `package.json` ;
- Git et GitHub CLI configurés ;
- Cursor CLI installé ;
- authentification Cursor locale active (`cursor-agent status` ou `agent status`) ;
- branche de travail propre, jamais `main` pour les modifications automatiques.

## Utilisation

Un cycle :

```bash
npm run x200:autopilot:once
```

Boucle continue :

```bash
npm run x200:autopilot:daemon
```

Simulation :

```bash
npm run x200:autopilot -- --dry-run
```

Paramètres :

```bash
X200_CURSOR_MODEL=auto npm run x200:autopilot:daemon
X200_AGENT_TIMEOUT_MS=3300000 npm run x200:autopilot:daemon
X200_AUTOPILOT_POLL_MS=60000 npm run x200:autopilot:daemon
```

## Service systemd utilisateur

Après vérification d'un cycle local :

```bash
bash scripts/install-x200-autopilot.sh
```

Contrôle :

```bash
systemctl --user status clevones-x200-autopilot.service
tail -f .x200/logs/autopilot.log
```

Arrêt :

```bash
systemctl --user disable --now clevones-x200-autopilot.service
```

## Règles AUTOPLAN

AUTOPLAN :

- lit `PRODUCT_GOAL.md`, `AGENTS.md`, `PROJECT_CONTEXT.md`, `backlog.json`, `BACKLOG.md`, `TASK_REPORT.md`, les règles Cursor, les tests et le code pertinent ;
- recherche d'abord une tâche existante ou terminée couvrant déjà le besoin ;
- crée au maximum trois tâches par cycle ;
- utilise le prochain ID `Txxx` disponible sans dépasser `T200` ;
- remplit scope, dépendances, critères d'acceptation, tests, risque, coût, owner et `requiresHuman` ;
- met `PRÊTE` uniquement si les dépendances sont réellement satisfaites ;
- utilise `À_FAIRE` sinon ;
- lance `npm run x200:validate` et `npm run x200:test` avant de terminer son cycle ;
- ne code pas une fonctionnalité applicative pendant le cycle de planification ;
- ne crée jamais de tâche de remplissage pour maintenir artificiellement le mouvement.

## Gates humains

Aucune confirmation humaine de routine pour : analyse, planification, création de tâches, code, tests, rapports, commit/push sur la branche autorisée, réconciliation CI ou démarrage d'une autre tâche indépendante.

Gate humain obligatoire pour : production, migration réelle, secrets/credentials, permissions/protections sensibles, auth/MFA production, suppression/restauration de données, paiement réel, merge sensible ou opération irréversible.

Un gate bloque uniquement son périmètre. AUTOPLAN cherche d'abord du travail indépendant utile. Si tous les écarts restants nécessitent un gate humain, il ne fabrique pas de tâche automatique et le superviseur écrit `.x200/HUMAN_GATE.json`.

## Protection contre les boucles

- verrou `.x200/autopilot.lock` contre deux superviseurs simultanés ;
- worktree sale : arrêt diagnostiqué ;
- tâche `TERMINÉE` : jamais rejouée avec preuve valide ;
- trois échecs identiques : changement de stratégie ou blocage ;
- trois cycles sans progrès Git/backlog : arrêt diagnostiqué ;
- trois cycles AUTOPLAN sans progrès utile : arrêt diagnostiqué ;
- timeout Cursor : nouveau cycle, pas répétition aveugle ;
- `EN_CONTRÔLE` : vérification par SHA et job `quality`, jamais par screenshot.

## Parallélisme

Le registre X200 autorise jusqu'à trois tâches indépendantes `EN_COURS`. Le superviseur Fedora actuel lance volontairement un seul agent Cursor à la fois sur un working tree afin d'éviter les collisions de fichiers et de registre.

Le parallélisme multi-worktree reste une évolution séparée à valider par tests avant activation réelle.
