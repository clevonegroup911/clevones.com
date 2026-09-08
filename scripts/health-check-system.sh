#!/usr/bin/env bash
# Non-destructive local system probe: disk, memory, load. Optional PM2/Nginx presence.
# Never restarts services, never loads .env, never dumps process environments.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: health-check-system.sh [--dry-run] [--disk-path PATH] [--disk-critical PCT]

Inspects local disk, memory and load. If PM2 or Nginx is installed, reports
presence without restarting. Does not print environment variables.
EOF
}

dry_run=0
disk_path="/"
disk_critical=95

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=1
      shift
      ;;
    --disk-path)
      disk_path="${2:?}"
      shift 2
      ;;
    --disk-critical)
      disk_critical="${2:?}"
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

if [[ ! "$disk_critical" =~ ^[0-9]+$ ]] || (( disk_critical < 50 || disk_critical > 99 )); then
  echo "disk-critical must be an integer between 50 and 99" >&2
  exit 2
fi

if [[ "$disk_path" != /* || "$disk_path" == *..* ]]; then
  echo "disk-path must be an absolute path without .." >&2
  exit 2
fi

echo "CHECK=system"
echo "DISK_PATH=${disk_path}"
echo "DISK_CRITICAL=${disk_critical}"

if [[ "$dry_run" -eq 1 ]]; then
  echo "DRY_RUN_OK"
  exit 0
fi

df_line="$(df -P "$disk_path" | awk 'NR==2 {print $5 " " $6}')"
disk_pct="${df_line%%\%*}"
disk_mount="${df_line##* }"
echo "DISK_USED_PCT=${disk_pct}"
echo "DISK_MOUNT=${disk_mount}"

mem_available_kb="$(awk '/MemAvailable:/ {print $2}' /proc/meminfo)"
mem_total_kb="$(awk '/MemTotal:/ {print $2}' /proc/meminfo)"
echo "MEM_AVAILABLE_KB=${mem_available_kb}"
echo "MEM_TOTAL_KB=${mem_total_kb}"

read -r load1 load5 load15 _ </proc/loadavg
echo "LOAD1=${load1}"
echo "LOAD5=${load5}"
echo "LOAD15=${load15}"

if command -v pm2 >/dev/null 2>&1; then
  if pm2 pid clevones-com >/dev/null 2>&1; then
    echo "PM2=present"
  else
    echo "PM2=missing_process"
  fi
else
  echo "PM2=not_installed"
fi

if command -v nginx >/dev/null 2>&1; then
  echo "NGINX=binary_present"
else
  echo "NGINX=not_installed"
fi

if (( disk_pct >= disk_critical )); then
  echo "SYSTEM_DISK_CRITICAL"
  exit 1
fi

echo "SYSTEM_OK"
exit 0
