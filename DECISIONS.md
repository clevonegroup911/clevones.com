# DECISIONS — Clevones.com

Décisions datées. Ne pas y coller de secrets.

## 2026-09-08 — Adoption X200

- **Décision** : le propriétaire adopte le système Multi-IA X200 v2.0 comme gouvernance de CLEVONES.COM.
- **Preuve** : commentaire PR #1 `[X200-GOVERNANCE]` (id 5593482867).
- **Raisons** : poursuivre sans doublon, conserver T001–T016, étendre le registre jusqu’à T200 sans créer 200 tâches, un exécutant, CI GitHub existante.
- **Conséquences** : T012 à clôturer sur CI #16 avant T017 ; pas de production ; Codex non requis.

## 2026-09-09 — Exécutant unique

- **Décision** : `executionMode = single-executor`. Verrou fichier local `.x200/executor.lock`.
- **Raisons** : pas de mécanisme partagé multi-machines vérifié cette session.
- **Conséquences** : `backlog.json` n’est pas un coordinateur distribué.

## 2026-09-09 — Sélection : risque élevé d’abord

- **Décision** : ordre `priority`, `riskDesc`, `unblockCount`, `costAsc`, `idAsc`.
- **Écart X100** : X100 triait `riskAsc` (risque faible d’abord) après le déblocage.
- **Raisons** : exigence X200 « priorité et risque critique d’abord ».

## 2026-09-09 — Relais ChatGPT

- **Décision** : déclaré **NON CONFIGURÉ**. Le canal automatique reste GitHub Actions + commentaire `[X100-CI]`.
- **Raisons** : aucun récepteur, secret webhook ou authentification de relais n’est présent dans le dépôt. Un événement GitHub ne réveille pas ChatGPT.
- **À faire si un relais est autorisé plus tard** : signature, déduplication, droits minimaux, preuve de réception. Sans cela, rester NON CONFIGURÉ.

## 2026-09-09 — T014 / T015 restent À_FAIRE

- **Décision** : ne pas les promouvoir `PRÊTE` pendant T017.
- **Raisons** : le propriétaire a demandé une seule tâche de gouvernance suivante (T017). T010/T011 restent humaines.

## 2026-09-09 — Marqueurs de rapport

- **Décision** : conserver `[X100-CURSOR]` et `[X100-CI]` ; ajouter `[X200-CURSOR]` dans les nouveaux rapports.
- **Raisons** : ne pas casser le bot CI qui met à jour le commentaire commençant par `[X100-CI]`.
