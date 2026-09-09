#!/usr/bin/env bash
# Verify a custom-format PostgreSQL dump and optionally restore it to a
# temporary database. Never restores onto clevones_prod. Never drops
# clevones_prod. Never deletes backup files. Never loads application environment files.
set -euo pipefail
umask 077

usage() {
  cat <<'EOF'
Usage: verify-backup.sh --dump FILE [--checksum FILE] [--restore-test --temp-db NAME]
                        [--no-sudo] [--host HOST] [--port PORT] [--username NAME]

The dump must remain mode 600. Restore uses stdin so postgres need not read the file.
--host is loopback only. Never pass DATABASE_URL.
EOF
}

dump=""
checksum=""
restore_test=0
temp_db=""
no_sudo=0
pg_host=""
pg_port="5432"
pg_username=""

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

if [[ -n "$pg_host" ]] && ! is_loopback_host "$pg_host"; then
  echo "refusing non-loopback PostgreSQL host" >&2
  exit 2
fi

if [[ ! "$pg_port" =~ ^[0-9]+$ ]] || (( pg_port < 1 || pg_port > 65535 )); then
  echo "invalid port" >&2
  exit 2
fi

if [[ -n "$pg_host" || -n "$pg_username" ]] && [[ "$no_sudo" -ne 1 ]]; then
  echo "refusing --host/--username without --no-sudo" >&2
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
  [[ "$name" =~ ^(clevones_)?(t00[145]_)?(restore|tmp|test)_[A-Za-z0-9_]+$ ]] || [[ "$name" =~ (restore|tmp|t004|t011) ]]
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

exists="$(run_pg psql -d postgres -Atqc "SELECT datname FROM pg_database WHERE datname='${temp_db}';")"
if [[ -n "$exists" ]]; then
  echo "refusing restore test: temporary database already exists" >&2
  exit 3
fi
run_pg createdb --maintenance-db=postgres --encoding=UTF8 "$temp_db"
created=1

cleanup() {
  if [[ "$created" -eq 1 ]] && ! is_forbidden_db "$temp_db"; then
    run_pg dropdb --maintenance-db=postgres --if-exists "$temp_db" || true
  fi
}
trap cleanup EXIT

# File owner reads the dump; postgres restores from stdin. Permissions stay 600.
run_pg pg_restore --no-owner --no-privileges --dbname="$temp_db" < "$dump"
echo "RESTORE_TEST_OK"

if ! is_forbidden_db "$temp_db"; then
  run_pg dropdb --maintenance-db=postgres "$temp_db"
  created=0
  echo "TEMP_DB_DROPPED=${temp_db}"
fi
