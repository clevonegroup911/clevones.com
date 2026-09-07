#!/usr/bin/env bash
# Verify a custom-format PostgreSQL dump and optionally restore it to a
# temporary database. Never restores onto clevones_prod. Never drops
# clevones_prod. Never deletes backup files. Never loads application environment files.
set -euo pipefail
umask 077

usage() {
  cat <<'EOF'
Usage: verify-backup.sh --dump FILE [--checksum FILE] [--restore-test --temp-db NAME]

The dump must remain mode 600. Restore uses stdin so postgres need not read the file.
EOF
}

dump=""
checksum=""
restore_test=0
temp_db=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dump)
      dump="${2:?}"
      shift 2
      ;;
    --checksum)
      checksum="${2:?}"
      shift 2
      ;;
    --restore-test)
      restore_test=1
      shift
      ;;
    --temp-db)
      temp_db="${2:?}"
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

if [[ -z "$dump" || ! -s "$dump" ]]; then
  echo "dump missing or empty" >&2
  exit 2
fi

if [[ -z "$checksum" ]]; then
  checksum="$(dirname "$dump")/SHA256SUMS"
fi

if [[ ! -f "$checksum" ]]; then
  echo "checksum file missing" >&2
  exit 2
fi

is_forbidden_db() {
  case "$1" in
    clevones_prod|postgres|template0|template1)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_safe_temp_db() {
  local name="$1"
  if is_forbidden_db "$name"; then
    return 1
  fi
  [[ "$name" =~ ^(clevones_)?(t004_)?(restore|tmp|test)_[A-Za-z0-9_]+$ ]] || [[ "$name" =~ (restore|tmp|t004) ]]
}

sha256sum -c "$checksum" >/dev/null
pg_restore --list "$dump" >/dev/null
echo "VERIFY_LIST_OK"

if [[ "$restore_test" -eq 0 ]]; then
  echo "RESTORE_TEST_SKIPPED"
  exit 0
fi

if [[ -z "$temp_db" || ! "$temp_db" =~ ^[A-Za-z0-9_]+$ ]] || ! is_safe_temp_db "$temp_db"; then
  echo "refusing restore test: temp database name is missing or unsafe" >&2
  exit 2
fi

if is_forbidden_db "$temp_db"; then
  echo "refusing to restore onto a protected database" >&2
  exit 2
fi

exists="$(sudo -n -u postgres psql -Atqc "SELECT datname FROM pg_database WHERE datname='${temp_db}';")"
if [[ -n "$exists" ]]; then
  echo "refusing restore test: temporary database already exists" >&2
  exit 3
fi
sudo -n -u postgres createdb --encoding=UTF8 "$temp_db"
created=1

cleanup() {
  if [[ "$created" -eq 1 ]] && ! is_forbidden_db "$temp_db"; then
    sudo -n -u postgres dropdb --if-exists "$temp_db" || true
  fi
}
trap cleanup EXIT

# File owner reads the dump; postgres restores from stdin. Permissions stay 600.
sudo -n -u postgres pg_restore --no-owner --no-privileges --dbname="$temp_db" < "$dump"
echo "RESTORE_TEST_OK"

if ! is_forbidden_db "$temp_db"; then
  sudo -n -u postgres dropdb "$temp_db"
  created=0
  echo "TEMP_DB_DROPPED=${temp_db}"
fi
