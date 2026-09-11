# Déploiement et rollback — Clevones.com

Runbook local pour l’exploitation. Aucun secret, mot de passe, jeton ou contenu de `.env` n’est documenté ici. Aucune migration, aucun redémarrage et aucun déploiement ne sont autorisés par T004.

## Périmètre T004

| Élément | Valeur |
|---|---|
| Projet GCP | `clevonegroup` |
| VM | `clevones-serveur` (`europe-west1-b`) |
| Application servie | `/home/clevones/apps/clevones.com` |
| HEAD production constaté | `10dbe97` |
| Base source | `clevones_prod` |
| PostgreSQL | 15.19 |
| Processus applicatif | PM2 `clevones-com` (online, PID inchangé pendant T004) |

T004 n’a pas modifié le code servi, n’a pas touché à `.env`, n’a pas exécuté `prisma migrate deploy`, n’a pas redémarré PM2, Nginx ou PostgreSQL, et n’a supprimé aucune ancienne sauvegarde.

## Sauvegarde vérifiée

Racine : `/home/clevones/backups/clevones.com`

Dossier UTC : `20260907T020712Z`

| Fichier | Permissions |
|---|---|
| dossier | `700` |
| `clevones_prod.dump` | `600` |
| `SHA256SUMS` | `600` |

- Format `pg_dump` custom, compression 9, `--no-owner --no-privileges`
- Écriture via fichier `.partial` puis `mv` atomique
- Compte système `postgres` (aucun mot de passe lu dans `.env`)
- `pg_restore --list` : TOC lisible (dump version 1.14, 20 entrées d’archive)
- SHA-256 : `01e056d12e7a5e8b21805de973acdd9c58d589ef7403753bfea528c371e099e1`
- Taille dump : 7464 octets
- Test de restauration : base temporaire `clevones_t004_restore_20260907t020712z` uniquement, puis `dropdb` de cette base seulement
- `clevones_prod` toujours présente après le test

## Scripts

À exécuter **sur la VM**, jamais depuis la CI GitHub.

```bash
bash scripts/backup-postgres.sh
bash scripts/verify-backup.sh \
  --dump /home/clevones/backups/clevones.com/<STAMP>/clevones_prod.dump
```

Test de restauration temporaire (interdit sur `clevones_prod`) :

```bash
bash scripts/verify-backup.sh \
  --dump /home/clevones/backups/clevones.com/<STAMP>/clevones_prod.dump \
  --restore-test \
  --temp-db clevones_t004_restore_<stamp>
```

Le dump est lu par le propriétaire du fichier et envoyé à `pg_restore` sur l’entrée standard, afin de conserver le mode `600`.

## T005 — état après déploiement contrôlé

Le 2026-09-07, T005 a appliqué `20260904191500_add_admin_mfa` puis a servi le commit `1c33a65` via PM2 `clevones-com`. Dump pré-T005 : `20260907T134843Z` (mode `600`, checksum vérifié, restauration temporaire hors `clevones_prod`). Le dump T004 `20260907T020712Z` est conservé. Aucun enrôlement SUPER_ADMIN.

## Rollback après migration MFA

La restauration **sur `clevones_prod`** n’est **pas** une commande de ce dépôt. Elle exigerait :

- une décision humaine explicite ;
- une nouvelle sauvegarde post-incident ;
- un runbook hors bande.

Ne pas coller de `DROP DATABASE clevones_prod`, de `pg_restore` vers `clevones_prod`, ni de `UPDATE` SQL dans un ticket.

## Prérequis sans déploiement

```bash
npm run x200:deploy-check -- --json
```

Cette commande vérifie la branche, la présence de ce runbook et l’absence de migrate/PM2. Elle **ne déploie pas**. Une documentation de sauvegarde ne prouve pas que la sauvegarde existe encore ni qu’une restauration récente a été rejouée.

## T011 — planification préparée, non activée

L’automatisation quotidienne (systemd service + timer) est documentée dans `docs/BACKUPS.md` et versionnée sous `ops/systemd/`. T011 **n’active pas** le timer, n’installe pas les unités sur la VM, ne supprime pas les dumps T004/T005, et ne restaure pas `clevones_prod`.

Wrapper : `scripts/run-scheduled-backup.sh` (appelle les scripts T004). Rétention : `scripts/retain-postgres-backups.sh --dry-run`.

## T026 — déploiement contrôlé 2026-09-10

Après `[X200-OWNER-AUTH]`, production sert le SHA figé `1c2f4f884ac1a5633a2104258dbe1babc1dda274` (detached). Dump pré-déploiement `20260910T110552Z` (mode `700`/`600`, checksum `04943daf…87d2`, `pg_restore --list` OK, restore-test `clevones_t026_restore_20260910t110552z` puis drop de cette base seulement). Cinq migrations additives appliquées une fois. `npm ci` + `next build` OK. PM2 `clevones-com` restart unique (`--update-env`), online, unstable=0. Nginx `-t` OK, non redémarré. `clevones_prod` non restaurée. PR #1 reste Draft. Aucun merge `main`.

## Interdit

- `prisma migrate reset`, `prisma db push` destructif, `DROP DATABASE`
- redémarrage PostgreSQL ou Nginx pour « valider » une sauvegarde
- affichage de `.env` ou de l’environnement PM2
- suppression d’anciennes sauvegardes
- push vers `main`, merge ou déploiement automatique
