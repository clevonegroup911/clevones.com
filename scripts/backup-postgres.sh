#!/usr/bin/env bash
# Atomic PostgreSQL backup for the production VM.
# Does not read application environment files, does not print secrets, does not delete old backups,
# does not migrate, restart, or restore over the source database.
set -euo pipefail
umask 077

usage() {
  cat <<'EOF'
Usage: backup-postgres.sh [--backup-root DIR] [--dbname NAME]

Runs on the production VM as a sudoer that can `sudo -n -u postgres`.
Never pass a password. Never load application environment files.
EOF
}

backup_root="/home/clevones/backups/clevones.com"
dbname="clevones_prod"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-root)
      backup_root="${2:?}"
      shift 2
      ;;
    --dbname)
      dbname="${2:?}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$dbname" == "postgres" || "$dbname" == "template0" || "$dbname" == "template1" ]]; then
  echo "refusing to dump a system database: ${dbname}" >&2
  exit 2
fi

install -d -m 700 "$backup_root"

backup_stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="${backup_root}/${backup_stamp}"
dump_partial="${backup_dir}/${dbname}.dump.partial"
dump_final="${backup_dir}/${dbname}.dump"

install -d -m 700 "$backup_dir"

sudo -n -u postgres pg_dump \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --dbname="$dbname" > "$dump_partial"

test -s "$dump_partial"
mv "$dump_partial" "$dump_final"
chmod 600 "$dump_final"

pg_restore --list "$dump_final" >/dev/null
sha256sum "$dump_final" > "${backup_dir}/SHA256SUMS"
chmod 600 "${backup_dir}/SHA256SUMS"

echo "BACKUP_OK"
echo "BACKUP_DIR=${backup_dir}"
echo "DUMP=${dump_final}"
echo "DUMP_BYTES=$(wc -c < "$dump_final")"
echo "SHA256SUMS=${backup_dir}/SHA256SUMS"
