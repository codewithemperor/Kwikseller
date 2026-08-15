#!/bin/bash
# KWIKSELLER — Status of all 3 dev services
#
# Reports: PID alive? · port listening? · last 3 log lines
#
# Usage:  bash scripts/status.sh

set -u

ROOT_DIR="/home/z/my-project"
PIDS_DIR="$ROOT_DIR/pids"
LOGS_DIR="$ROOT_DIR/logs"

check_service() {
  local name="$1"
  local port="$2"
  local label="$3"
  local pid_file="$PIDS_DIR/$name.pid"
  local log_file="$LOGS_DIR/$name.log"

  echo "── $label ────────────────────────────"

  # PID check
  local pid=""
  if [ -f "$pid_file" ]; then
    pid=$(cat "$pid_file" 2>/dev/null)
  fi

  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "  process: RUNNING (PID $pid)"
  else
    echo "  process: NOT RUNNING"
  fi

  # Port check
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:$port/" 2>/dev/null)
  if [ "$http_code" = "000" ]; then
    echo "  port $port: not responding"
  else
    echo "  port $port: HTTP $http_code"
  fi

  # Last 3 log lines
  if [ -f "$log_file" ]; then
    echo "  last log:"
    tail -n 3 "$log_file" 2>/dev/null | sed 's/^/    | /'
  else
    echo "  last log: (no log file yet)"
  fi
  echo ""
}

echo "========================================"
echo "  KWIKSELLER — Service Status"
echo "========================================"
echo ""

check_service "api"         "4000" "API (NestJS)"
check_service "marketplace" "3000" "Marketplace (Next.js)"
check_service "vendor"      "3001" "Vendor (Next.js)"
