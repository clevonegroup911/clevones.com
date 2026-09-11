#!/usr/bin/env bash
# T011 retention planner for dated PostgreSQL backup directories.
# Default is dry-run. Never deletes T004/T005 stamps. Never deletes the
# production backup root unless an explicit extra flag is passed (not used by T011).
set -euo pipefail
umask 077

usage() {
  cat <<'EOF'
Usage: retain-postgres-backups.sh --backup-root DIR [--dry-run|--apply]
                                  [--daily-days N] [--weekly-count N] [--monthly-count N]
                                  [--protect STAMP] [--allow-production-root]

Lists keep/expire decisions for UTC stamp directories (YYYYMMDDTHHMMSSZ).
--dry-run is the default. --apply deletes only expired stamp directories
on a non-production root after safety checks.
Protected stamps (never deleted): 20260907T020712Z (T004), 20260907T134843Z (T005).
EOF
}

production_root="/home/clevones/backups/clevones.com"
backup_root=""
mode="dry-run"
daily_days=7
weekly_count=4
monthly_count=12
allow_production_root=0
protect_stamps=("20260907T020712Z" "20260907T134843Z")

stamp_re='^[0-9]{8}T[0-9]{6}Z$'

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-root)
      backup_root="${2:?}"
      shift 2
      ;;
    --dry-run)
      mode="dry-run"
      shift
      ;;
    --apply)
      mode="apply"
      shift
      ;;
    --daily-days)
      daily_days="${2:?}"
      shift 2
      ;;
    --weekly-count)
      weekly_count="${2:?}"
      shift 2
      ;;
    --monthly-count)
      monthly_count="${2:?}"
      shift 2
      ;;
    --protect)
      protect_stamps+=("${2:?}")
      shift 2
      ;;
    --allow-production-root)
      allow_production_root=1
      shift
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

if [[ -z "$backup_root" || ! -d "$backup_root" ]]; then
  echo "backup-root missing or not a directory" >&2
  exit 2
fi

for value in "$daily_days" "$weekly_count" "$monthly_count"; do
  if [[ ! "$value" =~ ^[0-9]+$ ]] || (( value < 1 || value > 366 )); then
    echo "retention counts must be integers between 1 and 366" >&2
    exit 2
  fi
done

real_root="$(realpath "$backup_root")"
if [[ "$real_root" == "$production_root" && "$mode" == "apply" && "$allow_production_root" -ne 1 ]]; then
  echo "refusing --apply on the production backup root without --allow-production-root" >&2
  exit 2
fi

is_protected() {
  local stamp="$1"
  local item
  for item in "${protect_stamps[@]}"; do
    if [[ "$item" == "$stamp" ]]; then
      return 0
    fi
  done
  return 1
}

stamps=()
shopt -s nullglob
for entry in "$real_root"/*; do
  name="$(basename "$entry")"
  if [[ -d "$entry" && ! -L "$entry" && "$name" =~ $stamp_re ]]; then
    stamps+=("$name")
  fi
done
shopt -u nullglob

if [[ "${#stamps[@]}" -eq 0 ]]; then
  echo "RETENTION_OK"
  echo "MODE=${mode}"
  echo "KEEP_COUNT=0"
  echo "EXPIRE_COUNT=0"
  exit 0
fi

IFS=$'\n' stamps=($(printf '%s\n' "${stamps[@]}" | sort))
unset IFS

declare -A keep=()
declare -A week_best=()
declare -A month_best=()
declare -A reason=()

cutoff_ymd="$(date -u -d "$((daily_days - 1)) days ago" +%Y%m%d)"

for stamp in "${stamps[@]}"; do
  ymd="${stamp:0:8}"
  month="${stamp:0:6}"
  week="$(date -u -d "${stamp:0:4}-${stamp:4:2}-${stamp:6:2}" +%G%V)"
  if is_protected "$stamp"; then
    keep["$stamp"]=1
    reason["$stamp"]="protected"
  fi
  if [[ "$ymd" -ge "$cutoff_ymd" ]]; then
    keep["$stamp"]=1
    if [[ -z "${reason[$stamp]:-}" ]]; then
      reason["$stamp"]="daily"
    fi
  fi
  if [[ -z "${week_best[$week]:-}" || "$stamp" > "${week_best[$week]}" ]]; then
    week_best["$week"]="$stamp"
  fi
  if [[ -z "${month_best[$month]:-}" || "$stamp" > "${month_best[$month]}" ]]; then
    month_best["$month"]="$stamp"
  fi
done

allowed_weeks=()
for ((i = 0; i < weekly_count; i++)); do
  allowed_weeks+=("$(date -u -d "${i} weeks ago" +%G%V)")
done
for week in "${allowed_weeks[@]}"; do
  stamp="${week_best[$week]:-}"
  if [[ -n "$stamp" ]]; then
    keep["$stamp"]=1
    if [[ -z "${reason[$stamp]:-}" ]]; then
      reason["$stamp"]="weekly"
    fi
  fi
done

allowed_months=()
for ((i = 0; i < monthly_count; i++)); do
  allowed_months+=("$(date -u -d "${i} months ago" +%Y%m)")
done
for month in "${allowed_months[@]}"; do
  stamp="${month_best[$month]:-}"
  if [[ -n "$stamp" ]]; then
    keep["$stamp"]=1
    if [[ -z "${reason[$stamp]:-}" ]]; then
      reason["$stamp"]="monthly"
    fi
  fi
done

keep_count=0
expire_count=0
expire_stamps=()

for stamp in "${stamps[@]}"; do
  if [[ -n "${keep[$stamp]:-}" ]]; then
    keep_count=$((keep_count + 1))
    echo "RETENTION_KEEP stamp=${stamp} reason=${reason[$stamp]}"
  else
    expire_count=$((expire_count + 1))
    expire_stamps+=("$stamp")
    echo "RETENTION_EXPIRE stamp=${stamp}"
  fi
done

if [[ "$mode" == "apply" ]]; then
  for stamp in "${expire_stamps[@]}"; do
    if is_protected "$stamp"; then
      echo "refusing to delete a protected stamp: ${stamp}" >&2
      exit 2
    fi
    target="${real_root}/${stamp}"
    real_target="$(realpath "$target")"
    if [[ "$real_target" != "${real_root}/${stamp}" ]]; then
      echo "refusing to delete path outside backup root: ${stamp}" >&2
      exit 2
    fi
    if [[ -L "$target" || ! -d "$target" ]]; then
      echo "refusing to delete non-directory stamp path: ${stamp}" >&2
      exit 2
    fi
    shopt -s nullglob
    children=("$target"/*)
    shopt -u nullglob
    for child in "${children[@]}"; do
      base="$(basename "$child")"
      case "$base" in
        *.dump|*.dump.partial|SHA256SUMS)
          ;;
        *)
          echo "refusing to delete stamp with unexpected file: ${base}" >&2
          exit 2
          ;;
      esac
    done
    rm -rf -- "$real_target"
    echo "RETENTION_DELETED stamp=${stamp}"
  done
fi

echo "RETENTION_OK"
echo "MODE=${mode}"
echo "KEEP_COUNT=${keep_count}"
echo "EXPIRE_COUNT=${expire_count}"
echo "DAILY_DAYS=${daily_days}"
echo "WEEKLY_COUNT=${weekly_count}"
echo "MONTHLY_COUNT=${monthly_count}"
