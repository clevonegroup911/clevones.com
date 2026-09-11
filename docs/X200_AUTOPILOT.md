# X200 FAST-LANE — Fedora Local Autopilot

## Objectif

Supprimer les pauses manuelles entre tâches tout en conservant les gates humains uniquement pour les opérations réellement sensibles. Le superviseur local relance automatiquement un nouvel agent Cursor après chaque tâche, après une interruption ou après un timeout.

## Principe

Le processus `scripts/x200-autopilot.mjs` reste local sur Fedora. Il ne dépend pas des Cursor Cloud Agents.

Boucle :

1. vérifier que le dépôt est propre ;
2. valider `backlog.json` et `TASK_REPORT.md` ;
3. reprendre une tâche `EN_COURS` si une session précédente s'est arrêtée ;
4. réconcilier les tâches `EN_CONTRÔLE` avec le vrai job GitHub `quality` ;
5. sinon sélectionner une tâche `PRÊTE` non humaine ;
6. lancer Cursor CLI en mode headless ;
7. laisser l'agent implémenter, tester, enregistrer les preuves, commit/push sur la branche de travail ;
8. relancer un nouvel agent et continuer jusqu'à ce qu'il n'existe plus de travail automatique ;
9. créer `.x200/HUMAN_GATE.json` seulement lorsqu'une décision propriétaire est réellement nécessaire.

Une session Cursor qui atteint sa limite de temps n'arrête donc plus le projet : le superviseur relance un nouvel agent au cycle suivant. Le nouvel agent doit inspecter les claims, Git et les preuves avant de reprendre afin d'éviter un double effet externe.

## Prérequis Fedora

- Node.js conforme à `package.json` ;
- Git et GitHub CLI configurés pour le dépôt ;
- Cursor CLI installé ;
- authentification Cursor locale active (`cursor-agent status` ou `agent status`) ;
- branche de travail propre, jamais `main` pour les modifications automatiques.

Cursor documente le mode non interactif avec `-p/--print`, `--output-format` et le mode d'autorisation automatique `--force`. Le superviseur utilise ces capacités uniquement dans le périmètre gouverné par `AGENTS.md` et les règles Cursor.

## Utilisation manuelle

Test d'un cycle :

```bash
npm run x200:autopilot:once
```

Boucle continue dans le terminal :

```bash
npm run x200:autopilot:daemon
```

Simulation sans lancer Cursor :

```bash
npm run x200:autopilot -- --dry-run
```

Paramètres utiles :

```bash
X200_CURSOR_MODEL=auto npm run x200:autopilot:daemon
X200_AGENT_TIMEOUT_MS=3300000 npm run x200:autopilot:daemon
X200_AUTOPILOT_POLL_MS=60000 npm run x200:autopilot:daemon
```

## Service systemd utilisateur

Après vérification manuelle d'un cycle :

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

## Comportement des gates

Le superviseur continue sans demander confirmation pour le travail normal : analyse, code, tests, rapports, commits et push sur la branche autorisée.

Il s'arrête devant un gate propriétaire pour les catégories déjà définies par `AGENTS.md`, notamment production, migration réelle, secrets/credentials, permissions sensibles, auth/MFA production, suppression/restauration de données, paiement réel ou opération irréversible.

Quand un gate est requis, le fichier suivant est écrit :

```text
.x200/HUMAN_GATE.json
```

Le service reste alors en attente au lieu de fabriquer une autorisation.

## Protection contre les boucles inutiles

- un verrou `.x200/autopilot.lock` empêche deux superviseurs locaux simultanés ;
- un dépôt sale avant démarrage provoque un gate au lieu d'écraser du travail ;
- une tâche `TERMINÉE` n'est jamais rejouée ;
- après trois cycles sans aucun progrès Git ni backlog, l'autopilot s'arrête et écrit un diagnostic de gate ;
- un timeout Cursor n'est pas considéré comme preuve d'échec de la tâche : le cycle suivant reprend l'état réel ;
- les tâches `EN_CONTRÔLE` sont réconciliées par SHA et job `quality`, pas par screenshot.

## Limite actuelle du parallélisme

Le registre X200 autorise jusqu'à trois tâches indépendantes `EN_COURS`, mais ce superviseur local lance volontairement un agent Cursor à la fois. Cette décision évite les collisions de working tree et de `backlog.json` sur une seule copie Fedora.

Le gain principal vient de la suppression des pauses humaines et du relancement automatique. Le parallélisme multi-worktree pourra être ajouté séparément lorsque la fusion automatique des résultats et la sérialisation du registre seront prouvées par tests.
