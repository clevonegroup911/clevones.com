#!/usr/bin/env bash
# T011 scheduled backup wrapper. Calls the T004 dump and verify scripts.
# Never loads .env, never prints DATABASE_URL, never enables systemd, never
# restores onto clevones_prod, never deletes backups.
set -euo pipefail
umask 077

usage() {
  cat <<'EOF'
Usage: run-scheduled-backup.sh [backup-postgres.sh options] [--restore-test]

Runs backup-postgres.sh then verify-backup.sh (checksum + pg_restore --list).
Optional --restore-test restores into a temporary database named
clevones_t011_restore_<stamp>, then drops only that database.
EOF
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
backup_script="${script_dir}/backup-postgres.sh"
verify_script="${script_dir}/verify-backup.sh"
restore_test=0
backup_args=()
verify_conn_args=()

trap 'echo "SCHEDULED_BACKUP_FAIL line=${LINENO}" >&2' ERR

while [[ $# -gt 0 ]]; do
  case "$1" in
    --restore-test)
      restore_test=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --no-sudo)
      backup_args+=("$1")
      verify_conn_args+=("$1")
      shift
      ;;
    --host|--port|--username)
      backup_args+=("$1" "${2:?}")
      verify_conn_args+=("$1" "${2:?}")
      shift 2
      ;;
    --backup-root|--dbname|--max-disk-pct)
      backup_args+=("$1" "${2:?}")
      shift 2
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "$backup_script" || ! -f "$verify_script" ]]; then
  echo "backup or verify script missing" >&2
  exit 2
fi

backup_output="$(bash "$backup_script" "${backup_args[@]}")"
printf '%s\n' "$backup_output"

dump="$(printf '%s\n' "$backup_output" | awk -F= '/^DUMP=/{print substr($0, index($0,"=")+1); exit}')"
if [[ -z "$dump" || ! -s "$dump" ]]; then
  echo "scheduled backup did not produce a dump path" >&2
  exit 1
fi

verify_args=(--dump "$dump")
if [[ "$restore_test" -eq 1 ]]; then
  stamp="$(basename "$(dirname "$dump")")"
  stamp_safe="$(printf '%s' "$stamp" | tr 'A-Z' 'a-z' | tr -cd 'a-z0-9_')"
  if [[ -z "$stamp_safe" ]]; then
    echo "unable to derive a safe temporary database name" >&2
    exit 2
  fi
  verify_args+=(--restore-test --temp-db "clevones_t011_restore_${stamp_safe}")
fi

bash "$verify_script" "${verify_conn_args[@]}" "${verify_args[@]}"
echo "SCHEDULED_BACKUP_OK"
echo "RESTORE_TEST=${restore_test}"
