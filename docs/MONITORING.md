# Monitoring et alertes — Clevones.com

Socle T012 ; alignement backups T011/T018 (2026-09-12). Aucun secret, aucune alerte payante, aucune ressource Cloud Monitoring créée ici.
Aucun redémarrage PM2, Nginx ou PostgreSQL. Aucun accès production depuis ce dépôt.

## État réel (2026-09-12)

| Surface | Constat | Niveau |
|---|---|---|
| Scripts health-check loopback | Présents (`scripts/health-check-*.sh`) | implémenté / testable local |
| Unités systemd backup | Templates dans `ops/systemd/` | préparées ; **timer production non activé** (gate humaine) |
| Procédure backups | `docs/BACKUPS.md` + scripts dump/verify/rétention | documenté ; activation VM = gate |
| Alertes GCP Cloud Monitoring / uptime | **Non provisionnées** par ce dépôt | gate propriétaire / externe |
| Endpoint `/health` dédié | Présent (`GET /health` → `{ status, service }`) | implémenté / testable local (T038) ; pas d’alerte GCP |
| Production monitoring live | NON_ACCESSIBLE depuis le dépôt | — |

## Audit de l’existant (historique 2026-09-08, toujours pertinent)

| Surface | Constat |
|---|---|
| Endpoint applicatif `/health` | `GET /health` non authentifié, payload minimal `{ status: "ok", service: "clevones-com" }`, `Cache-Control: no-store`. Aucun secret ni dump d’env. |
| Journaux applicatifs | `AuditLog` (Prisma) : connexions admin/portail, MFA, logout, CMS, documents, paiements sandbox. Métadonnées limitées. Pas de secret TOTP, recovery, mot de passe. |
| CI | GitHub Actions X200 CI (qualité, Playwright, audit npm). Ce n’est pas un uptime probe de production. |
| Processus | PM2 `clevones-com` sur la VM `clevones-serveur` (voir `DEPLOYMENT.md`). |
| Reverse proxy | Nginx devant l’application. Aucun export Prometheus dans ce dépôt. |
| PostgreSQL | 15.x sur la VM. Sauvegardes manuelles T004. Planification timer **préparée** (`docs/BACKUPS.md`), **non activée** en production. |
| GCP Cloud Monitoring | Non provisionné par ce dépôt. Projet `clevonegroup`. Toute création d’uptime check / alerting policy exige une décision humaine. |

Signaux d’authentification déjà émis (sans secrets) :

- `AUTH_LOGIN_FAILURE` / `AUTH_LOGIN_SUCCESS`
- `MFA_LOGIN_FAILED` / `MFA_LOGIN_SUCCESS`
- `MFA_RECOVERY_CODE_USED`
- `MFA_ENROLLMENT_STARTED` / `MFA_ENABLED` / `MFA_DISABLED`

Helpers : `isCriticalAuthAuditAction` et `countAuthAuditSignals` dans `lib/admin/audit.ts`. Ils agrègent **uniquement** le champ `action`.

## Métriques à suivre

| Métrique | Source prévue | Seuil proposé (à valider humainement) |
|---|---|---|
| Disponibilité HTTP/HTTPS | `curl` loopback derrière Nginx, ou uptime check GCP après autorisation | 2 échecs consécutifs / 2 min |
| Erreurs 5xx | journaux Nginx (`status >= 500`) | > 5 en 5 min **ou** > 1 % des requêtes |
| Santé PM2 | `pm2 pid clevones-com` (pas `pm2 jlist`, qui peut dumper l’environnement) | processus absent |
| Nginx | binaire présent ; `systemctl is-active nginx` **en lecture** sur la VM | inactif |
| PostgreSQL | `pg_isready` loopback, sans mot de passe | non prêt |
| Espace disque | `df -P /` | ≥ 90 % warning, ≥ 95 % critique |
| Mémoire / CPU | `/proc/meminfo`, `/proc/loadavg` | MemAvailable < 10 % ; load15 > nombre de CPU |
| Erreurs applicatives critiques | `AuditLog.action` uniquement | voir alertes MFA ci-dessous |
| Sauvegarde planifiée | timer systemd + `docs/BACKUPS.md` | échec job / dump manquant (après activation humaine) |

Ne jamais exporter `DATABASE_URL`, `AUTH_SECRET`, `MFA_ENCRYPTION_KEY`, codes TOTP, recovery, ni dump `printenv` / `pm2 pretty`.

## Scripts de health-check (non destructifs)

À exécuter en local ou **sur la VM**, jamais comme action GitHub vers la production.

```bash
bash scripts/health-check-app.sh --dry-run
bash scripts/health-check-postgres.sh --dry-run
bash scripts/health-check-system.sh --dry-run

bash scripts/health-check-app.sh --url http://127.0.0.1:3000/health
bash scripts/health-check-postgres.sh --host 127.0.0.1 --port 5432
bash scripts/health-check-system.sh --disk-path / --disk-critical 95
```

Par défaut, `health-check-app.sh` sonde `http://127.0.0.1:3000/health` (T038).
Garanties :

- `--dry-run` : valide les arguments, n’ouvre aucune connexion
- URLs / hôtes **loopback uniquement** (`127.0.0.1`, `localhost`, `::1`)
- aucun `source` de `.env`, aucun mot de passe
- aucun `pm2 restart`, `systemctl restart`, `nginx -s reload`, `prisma migrate`

Sur la VM, sonder `http://127.0.0.1/` (Nginx local) plutôt que l’origine publique, pour ne pas dépendre du DNS ni d’un chemin Internet.

## Revue des journaux d’audit (sans secrets)

Interdit : `SELECT metadata`, `ipAddress`, `userAgent`, e-mail, codes.

Autorisé (comptage par action, fenêtre glissante) :

```sql
SELECT action, count(*) AS n
FROM "AuditLog"
WHERE "createdAt" > now() - interval '15 minutes'
  AND action IN (
    'AUTH_LOGIN_FAILURE',
    'MFA_LOGIN_FAILED',
    'MFA_LOGIN_SUCCESS',
    'MFA_RECOVERY_CODE_USED'
  )
GROUP BY action;
```

Cette requête n’est **pas** exécutée par T012. Elle reste un modèle pour un opérateur déjà habilité, hors CI.

## Plan d’alertes (non créé)

| Alerte | Condition proposée | Canal (après décision humaine) |
|---|---|---|
| Site indisponible | probe HTTP loopback ou uptime HTTPS en échec 2× | e-mail / SMS opérateur, pas de webhook secret dans Git |
| Taux 5xx anormal | Nginx 5xx au-dessus du seuil | idem |
| PM2 down | `pm2 pid clevones-com` échoue | idem |
| Espace disque critique | `df` ≥ 95 % | idem |
| PostgreSQL indisponible | `pg_isready` échec | idem |
| Échec backup PostgreSQL | pas de `BACKUP_OK` / `VERIFY_LIST_OK` (après activation future du timer T011) | idem ; voir `docs/BACKUPS.md` |
| Timer backup silencieux | pas de sauvegarde depuis 36 h (après activation future) | idem |
| MFA / login critiques | `AUTH_LOGIN_FAILURE` + `MFA_LOGIN_FAILED` > 10 / 15 min | idem ; ne pas alerter sur le **contenu** des codes |

Ne pas créer d’alerting policy GCP, d’uptime check facturé, ni de notification channel depuis ce commit.

## Stratégie Cloud Monitoring / logging (à autoriser)

1. **Phase 0 (ce dépôt)** : scripts locaux + documentation. Aucune ressource cloud.
2. **Phase 1 (humain)** : uptime check HTTPS `https://clevones.com` (période 60 s, régions limitées pour le coût) ; alerte downtime.
3. **Phase 2 (humain)** : agent Ops ou export journald/Nginx vers Cloud Logging ; métrique basée sur les 5xx ; **pas** d’ingestion de `.env` ni des tables MFA.
4. **Phase 3 (humain)** : tableau de bord : uptime, 5xx, CPU/RAM VM, `pg_isready`, compteurs `AuditLog.action`.

Journalisation applicative : conserver `AuditLog` comme source d’auth. Ne pas dupliquer les secrets dans Cloud Logging. Minimiser `ipAddress` (rétention à définir, déjà noté dans `docs/ADMIN_MFA.md`).

## Interdit

- `gcloud monitoring policies create`, Terraform alerting, webhooks Slack/PagerDuty secrets
- redémarrer PM2, Nginx, PostgreSQL « pour tester »
- `pm2 jlist` / `printenv` / lecture de `.env`
- requêtes `AuditLog` qui ramènent metadata, IP ou user-agent dans GitHub Actions
- merge `main`, déploiement, création de budget GCP
