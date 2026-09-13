#!/usr/bin/env bash
# Non-destructive HTTP/HTTPS probe. Loopback only. Never loads .env, never restarts services.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: health-check-app.sh [--dry-run] [--url URL] [--timeout SECONDS]

Probes a loopback HTTP origin (default http://127.0.0.1:3000/health).
Refuses non-loopback hosts. Does not load .env or print secrets.
EOF
}

dry_run=0
url="http://127.0.0.1:3000/health"
timeout_seconds=5

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=1
      shift
      ;;
    --url)
      url="${2:?}"
      shift 2
      ;;
    --timeout)
      timeout_seconds="${2:?}"
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

if [[ ! "$url" =~ ^https?://(127\.0\.0\.1|localhost|\[::1\])(:[0-9]+)?(/|$) ]]; then
  echo "refusing non-loopback URL" >&2
  exit 2
fi

if [[ ! "$timeout_seconds" =~ ^[0-9]+$ ]] || (( timeout_seconds < 1 || timeout_seconds > 30 )); then
  echo "timeout must be an integer between 1 and 30" >&2
  exit 2
fi

echo "CHECK=app"
echo "URL=${url}"
echo "TIMEOUT=${timeout_seconds}"

if [[ "$dry_run" -eq 1 ]]; then
  echo "DRY_RUN_OK"
  exit 0
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 2
fi

http_code="$(
  curl -sS -o /dev/null -w "%{http_code}" \
    --max-time "$timeout_seconds" \
    --connect-timeout "$timeout_seconds" \
    "$url"
)" || {
  echo "APP_DOWN"
  echo "REASON=connection_failed"
  exit 1
}

echo "HTTP_STATUS=${http_code}"

if [[ "$http_code" =~ ^5 ]]; then
  echo "APP_5XX"
  exit 1
fi

if [[ "$http_code" =~ ^[23] ]]; then
  echo "APP_OK"
  exit 0
fi

echo "APP_UNEXPECTED_STATUS"
exit 1
