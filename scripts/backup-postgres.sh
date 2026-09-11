#!/usr/bin/env bash
# Atomic PostgreSQL backup for the production VM (T004) and scheduled local tests (T011).
# Does not read application environment files, does not print secrets, does not delete old backups,
# does not migrate, restart, or restore over the source database.
set -euo pipefail
umask 077

usage() {
  cat <<'EOF'
Usage: backup-postgres.sh [--backup-root DIR] [--dbname NAME]
                          [--no-sudo] [--host HOST] [--port PORT] [--username NAME]
                          [--max-disk-pct N]

Runs on the production VM as a sudoer that can `sudo -n -u postgres`.
Never pass a password. Never load application environment files.
--host is loopback only. Do not pass DATABASE_URL.
EOF
}

backup_root="/home/clevones/backups/clevones.com"
dbname="clevones_prod"
no_sudo=0
pg_host=""
pg_port="5432"
pg_username=""
max_disk_pct=90

is_loopback_host() {
  case "$1" in
    127.0.0.1|localhost|::1)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

run_pg() {
  local -a cmd=("$1")
  shift
  if [[ -n "$pg_host" ]]; then
    cmd+=(-h "$pg_host" -p "$pg_port")
  fi
  if [[ -n "$pg_username" ]]; then
    cmd+=(-U "$pg_username")
  fi
  cmd+=("$@")
  if [[ "$no_sudo" -eq 1 ]]; then
    "${cmd[@]}"
  else
    sudo -n -u postgres "${cmd[@]}"
  fi
}

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
    --no-sudo)
      no_sudo=1
      shift
      ;;
    --host)
      pg_host="${2:?}"
      shift 2
      ;;
    --port)
      pg_port="${2:?}"
      shift 2
      ;;
    --username)
      pg_username="${2:?}"
      shift 2
      ;;
    --max-disk-pct)
      max_disk_pct="${2:?}"
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

if [[ "$dbname" == *"://"* || "$dbname" == *"@"* || "$dbname" == *"/"* || "$dbname" == *" "* ]]; then
  echo "refusing connection-string or unsafe dbname" >&2
  exit 2
fi

if [[ -n "$pg_host" ]] && ! is_loopback_host "$pg_host"; then
  echo "refusing non-loopback PostgreSQL host" >&2
  exit 2
fi

if [[ ! "$pg_port" =~ ^[0-9]+$ ]] || (( pg_port < 1 || pg_port > 65535 )); then
  echo "invalid port" >&2
  exit 2
fi

if [[ ! "$max_disk_pct" =~ ^[0-9]+$ ]] || (( max_disk_pct < 50 || max_disk_pct > 99 )); then
  echo "max-disk-pct must be an integer between 50 and 99" >&2
  exit 2
fi

if [[ -n "$pg_host" || -n "$pg_username" ]] && [[ "$no_sudo" -ne 1 ]]; then
  echo "refusing --host/--username without --no-sudo" >&2
  exit 2
fi

install -d -m 700 "$backup_root"

disk_pct="$(df -P "$backup_root" | awk 'NR==2 {gsub("%","",$5); print $5}')"
if [[ ! "$disk_pct" =~ ^[0-9]+$ ]]; then
  echo "unable to read disk usage for backup root" >&2
  exit 2
fi
echo "DISK_USED_PCT=${disk_pct}"
if (( disk_pct >= max_disk_pct )); then
  echo "refusing backup: disk usage ${disk_pct}% >= ${max_disk_pct}%" >&2
  exit 1
fi

backup_stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="${backup_root}/${backup_stamp}"
dump_partial="${backup_dir}/${dbname}.dump.partial"
dump_final="${backup_dir}/${dbname}.dump"

install -d -m 700 "$backup_dir"

run_pg pg_dump \
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
