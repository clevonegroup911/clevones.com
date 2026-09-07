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

## Rollback avant toute migration MFA

La migration MFA **n’est pas déployée**. Le rollback immédiat consiste à :

1. ne pas exécuter `prisma migrate deploy` ;
2. conserver le dump `20260907T020712Z` ;
3. laisser PM2 sur le commit `10dbe97`.

Si une migration future devait être annulée, la restauration **sur `clevones_prod`** n’est **pas** une commande de ce dépôt. Elle exigerait :

- une décision humaine explicite ;
- une nouvelle sauvegarde post-incident ;
- un runbook hors bande.

Ne pas coller de `DROP DATABASE clevones_prod`, de `pg_restore` vers `clevones_prod`, ni de `UPDATE` SQL dans un ticket.

## Interdit

- `prisma migrate deploy` sur la production dans le cadre de T004 / T005 sans T004 terminée et sans décision humaine
- redémarrage PM2 / Nginx / PostgreSQL pour « valider » une sauvegarde
- affichage de `.env` ou de l’environnement PM2
- suppression d’anciennes sauvegardes
- push vers `main`, merge ou déploiement automatique
