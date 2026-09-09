# Sauvegardes PostgreSQL — Clevones.com

Plan T011 : automatisation **préparée**, non activée en production. Réutilise la procédure T004 (`scripts/backup-postgres.sh`, `scripts/verify-backup.sh`). Aucun secret ici.

Classe des faits : l’architecture et les scripts sont **CONFIRMÉS** dans ce dépôt. L’activation systemd sur la VM, l’existence actuelle des dumps T004/T005 et un test de restauration récent en production sont **NON_ACCESSIBLES** depuis cette tâche.

## Architecture

```
systemd timer (proposé, NON activé)
        │
        ▼
clevones-postgres-backup.service  (oneshot)
        │
        ▼
scripts/run-scheduled-backup.sh
        ├── scripts/backup-postgres.sh   dump custom + SHA-256 + pg_restore --list
        └── scripts/verify-backup.sh     sha256sum -c + liste ; restore-test optionnel
```

Rétention : `scripts/retain-postgres-backups.sh` (dry-run par défaut). Suppression réelle hors production seulement avec `--apply` sur une racine de test.

La restauration **sur `clevones_prod`** n’est pas une commande de ce dépôt. Voir `DEPLOYMENT.md`.

## Fréquence proposée

| Job | Calendrier proposé | Contenu |
|---|---|---|
| Sauvegarde quotidienne | `02:15` UTC, `Persistent=true`, délai aléatoire 10 min | dump custom compressé 9, checksum SHA-256, `pg_restore --list` |
| Test de restauration | hebdomadaire, **manuel** jusqu’à une nouvelle autorisation | `verify-backup.sh --restore-test` vers une base `clevones_t011_restore_*` uniquement |
| Rétention | après une sauvegarde réussie, **dry-run d’abord** | voir politique ci-dessous |

Ces horaires sont documentés dans `ops/systemd/clevones-postgres-backup.timer`. Ils ne sont **pas** installés ni activés par T011.

## Rétention proposée

Racine : `/home/clevones/backups/clevones.com/<YYYYMMDDTHHMMSSZ>/`

| Classe | Durée | Règle |
|---|---|---|
| Journalière | 7 jours calendaires UTC | conserver tous les tampons de la fenêtre |
| Hebdomadaire | 4 semaines ISO | conserver le tampon le plus récent de chaque semaine retenue |
| Mensuelle | 12 mois calendaires | conserver le tampon le plus récent de chaque mois retenu |
| Protections | indéfinie | **ne jamais supprimer** `20260907T020712Z` (T004) et `20260907T134843Z` (T005) |

`--apply` refuse la racine de production sauf `--allow-production-root` (hors périmètre T011). T011 n’exécute `--apply` que sur des répertoires temporaires de test.

## Chemins

| Élément | Chemin |
|---|---|
| Application VM | `/home/clevones/apps/clevones.com` |
| Racine des dumps | `/home/clevones/backups/clevones.com` |
| Dump | `<racine>/<stamp>/<dbname>.dump` |
| Checksum | `<racine>/<stamp>/SHA256SUMS` |
| Unités (dépôt) | `ops/systemd/clevones-postgres-backup.service` |
| Timer (dépôt) | `ops/systemd/clevones-postgres-backup.timer` |
| Journal systemd (après activation future) | `journalctl -u clevones-postgres-backup.service` |

Écriture atomique : fichier `.partial` puis `mv`. Format `pg_dump` custom (`--no-owner --no-privileges`).

## Sécurité

- Compte `postgres` via `sudo -n -u postgres` (auth peer). Aucun mot de passe, aucun `DATABASE_URL`.
- Les scripts ne font pas `source` de `.env`, ni `printenv`, ni `pm2 pretty`.
- `--host` est limité à `127.0.0.1` / `localhost` / `::1`.
- `--dbname` refuse les URI et les bases système.
- `verify-backup.sh` refuse `clevones_prod`, `postgres`, `template0`, `template1`.
- Les unités systemd n’ont pas `EnvironmentFile=.env` ni `Environment=DATABASE_URL`.
- Le timer **n’est pas** activé en production par cette tâche.

## Permissions

| Objet | Mode | Propriétaire proposé |
|---|---|---|
| Racine et dossiers tampon | `700` | `clevones:clevones` |
| `*.dump`, `SHA256SUMS` | `600` | `clevones:clevones` |
| Scripts | `755` | dépôt / `clevones` |
| Unités systemd | `644` | `root:root` après copie (humaine) |

`umask 077` dans les scripts. Le dump est lu par le propriétaire du fichier et envoyé à `pg_restore` sur l’entrée standard, pour conserver le mode `600`.

## Espace disque

`backup-postgres.sh` refuse le dump si `df -P` sur la racine est **≥ 90 %** (`--max-disk-pct`, aligné sur `docs/MONITORING.md`). Un échec disque est un échec de sauvegarde, pas un redémarrage de service.

## Procédure d’installation (documentée, non exécutée)

À faire **sur la VM**, par un opérateur habilité, après une **nouvelle** autorisation propriétaire :

1. Déployer le code contenant ces scripts (hors T011).
2. Vérifier `sudo -n -u postgres pg_dump --version` sans afficher `.env`.
3. `install -d -m 700 /home/clevones/backups/clevones.com`
4. Copier les unités :

```bash
sudo install -m 644 ops/systemd/clevones-postgres-backup.service /etc/systemd/system/
sudo install -m 644 ops/systemd/clevones-postgres-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
```

5. **Ne pas** encore `enable --now` sans gate humain.

T011 s’arrête avant l’étape 4 en production.

## Procédure d’activation (documentée, non exécutée)

```bash
sudo systemctl enable --now clevones-postgres-backup.timer
sudo systemctl list-timers clevones-postgres-backup.timer
```

Interdit tant qu’une autorisation distincte n’est pas donnée. T011 : **TIMER_ENABLED_PRODUCTION = NO**.

## Procédure de vérification

Sur un poste local ou une base éphémère (jamais `clevones_prod`) :

```bash
bash scripts/run-scheduled-backup.sh \
  --backup-root /tmp/clevones-backup-test \
  --dbname <base_test> \
  --no-sudo --host 127.0.0.1 --port 5432 --username <role_test>

bash scripts/verify-backup.sh \
  --dump /tmp/clevones-backup-test/<STAMP>/<base_test>.dump \
  --no-sudo --host 127.0.0.1 --port 5432 --username <role_test> \
  --restore-test --temp-db clevones_t011_restore_<stamp>

bash scripts/retain-postgres-backups.sh \
  --backup-root /tmp/clevones-backup-test \
  --dry-run
```

Contrôles attendus : `BACKUP_OK`, `VERIFY_LIST_OK`, `sha256sum -c`, `RESTORE_TEST_OK`, `TEMP_DB_DROPPED`, `RETENTION_OK`. Syntaxe systemd locale :

```bash
systemd-analyze verify ops/systemd/clevones-postgres-backup.service
systemd-analyze verify ops/systemd/clevones-postgres-backup.timer
```

Des avertissements (utilisateur/service PostgreSQL absents sur le poste) n’équivalent pas à une activation production.

## Restauration test

Toujours une base temporaire dont le nom contient `restore`, `tmp` ou `t011`. Suppression de **cette** base seulement. Interdit : `pg_restore` vers `clevones_prod`, `DROP DATABASE clevones_prod`.

## Rollback

Un dump T004/T005 ou un dump quotidien vérifié permet un rollback **hors bande**, décision humaine, nouvelle sauvegarde post-incident avant toute écriture sur `clevones_prod`. T011 ne code pas cette restauration.

Si le timer futur échoue : le laisser inactif, inspecter le journal, relancer **une** sauvegarde manuelle T004. Ne pas redémarrer PostgreSQL, PM2 ou Nginx « pour valider » un backup.

## Monitoring et alertes (proposés)

Complète `docs/MONITORING.md`. Aucune policy GCP créée ici.

| Signal | Source | Seuil proposé |
|---|---|---|
| Échec backup | `journalctl` / code de sortie du service | 1 échec |
| Échec checksum | absence de `VERIFY_LIST_OK` ou `sha256sum -c` | 1 échec |
| Échec restore-test | absence de `RESTORE_TEST_OK` | 1 échec (job hebdo futur) |
| Disque | `DISK_USED_PCT` / `df` | ≥ 90 % warning, ≥ 95 % critique |
| Timer silencieux | pas de `BACKUP_OK` depuis 36 h | alerte humaine |

Ne jamais journaliser `DATABASE_URL`, mots de passe, ni le contenu des dumps.

## Procédure manuelle d’urgence

1. Cesser les mutations applicatives non essentielles.
2. Sur la VM, sans `.env` :

```bash
bash scripts/backup-postgres.sh
bash scripts/verify-backup.sh \
  --dump /home/clevones/backups/clevones.com/<STAMP>/clevones_prod.dump
```

3. Option test : `--restore-test --temp-db clevones_t011_restore_<stamp>` puis `dropdb` de cette base seulement (déjà fait par le script).
4. Conserver T004 `20260907T020712Z` et T005 `20260907T134843Z`.
5. Restauration production : runbook hors dépôt, décision propriétaire, **pas** T011.

## Interdit (T011)

- `systemctl enable` / `start` du timer ou du service sur la VM production
- cron réel, redémarrage PostgreSQL / PM2 / Nginx
- restauration ou `DROP` de `clevones_prod`
- suppression des dumps T004/T005
- merge `main`, déploiement automatique
- secrets dans Git, tickets ou journaux
