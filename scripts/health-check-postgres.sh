#!/usr/bin/env bash
# Non-destructive PostgreSQL readiness probe. Loopback only. Never loads .env or passwords.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: health-check-postgres.sh [--dry-run] [--host HOST] [--port PORT]

Runs pg_isready against a loopback host (default 127.0.0.1:5432).
Never passes a password. Never loads application environment files.
EOF
}

dry_run=0
host="127.0.0.1"
port="5432"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=1
      shift
      ;;
    --host)
      host="${2:?}"
      shift 2
      ;;
    --port)
      port="${2:?}"
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

if [[ "$host" != "127.0.0.1" && "$host" != "localhost" && "$host" != "::1" ]]; then
  echo "refusing non-loopback PostgreSQL host" >&2
  exit 2
fi

if [[ ! "$port" =~ ^[0-9]+$ ]] || (( port < 1 || port > 65535 )); then
  echo "invalid port" >&2
  exit 2
fi

echo "CHECK=postgres"
echo "HOST=${host}"
echo "PORT=${port}"

if [[ "$dry_run" -eq 1 ]]; then
  echo "DRY_RUN_OK"
  exit 0
fi

if ! command -v pg_isready >/dev/null 2>&1; then
  echo "POSTGRES_SKIP"
  echo "REASON=pg_isready_missing"
  exit 0
fi

if pg_isready -h "$host" -p "$port" >/dev/null 2>&1; then
  echo "POSTGRES_OK"
  exit 0
fi

echo "POSTGRES_DOWN"
exit 1
