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

## 2026-09-09 — T017 P1 et contrat x100:*

- **Décision** : T017 est P1, dépendance T012 seulement. Les commandes `x100:*` restent le contrat CI. Un renommage exclusif vers `x200:*` n’est pas T017.
- **Raisons** : instruction propriétaire ; éviter une migration technique risquée.
- **Conséquences** : alias `x200:*` facultatifs ; GitHub Actions conserve `[X100-CI]`.


- **Décision** : conserver `[X100-CURSOR]` et `[X100-CI]` ; ajouter `[X200-CURSOR]` dans les nouveaux rapports.
- **Raisons** : ne pas casser le bot CI qui met à jour le commentaire commençant par `[X100-CI]`.

## 2026-09-09 — T010 autorisée uniquement

- **Décision** : le propriétaire autorise **T010 — Centralisation des secrets**, et aucune autre tâche.
- **Preuve** : instruction propriétaire session 2026-09-09, après GitHub Actions X100 CI **run #19** (34295378004) SUCCESS sur `4345b3932e10435c8c1e79ef8b88252d88a1964a`.
- **Champs permanents** : `owner = human` et `requiresHuman = true` restent ; l’autorisation est enregistrée à part (cette décision + `evidence` / `history` T010).
- **Garde-fous** : n’afficher aucune valeur secrète ; ne pas modifier la production, Secret Manager réel, PM2, ni `.env` d’exploitation ; T011, T014 et T015 restent `À_FAIRE`.
- **Conséquences** : T010 peut passer `À_FAIRE` → `PRÊTE` → `EN_COURS` via `x200:claim --include-human`. La bascule runtime vers Secret Manager exige une **nouvelle** autorisation si elle change la VM ou les secrets d’exploitation.

## 2026-09-09 — T010 commit/push admin-mfa

- **Décision** : le propriétaire autorise le **commit et le push** de la phase audit/documentation T010 sur `origin/admin-mfa` uniquement.
- **Preuve** : commentaire PR #1 `[X200-OWNER-AUTH]` (id 5594070161).
- **Hors périmètre** : Secret Manager réel, VM, PM2, rotation, merge `main`, T011/T014/T015.
- **Champs permanents** : `owner=human`, `requiresHuman=true`.
