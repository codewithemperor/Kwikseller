#!/bin/bash
# KWIKSELLER — Stop all 3 dev services
#
# Kills each service via its PID file only (no global pkill) so that
# stopping one never affects the others.
#
# Usage:  bash scripts/stop-all.sh

set -u

ROOT_DIR="/home/z/my-project"
PIDS_DIR="$ROOT_DIR/pids"

stop_service() {
  local name="$1"
  local pid_file="$PIDS_DIR/$name.pid"
  local label="$2"

  if [ ! -f "$pid_file" ]; then
    echo "$label: no PID file (not running via scripts?)"
    return 0
  fi

  local pid
  pid=$(cat "$pid_file" 2>/dev/null)
  if [ -z "$pid" ]; then
    echo "$label: empty PID file, removing"
    rm -f "$pid_file"
    return 0
  fi

  if kill -0 "$pid" 2>/dev/null; then
    # Kill the process and its whole group (children like next-server).
    kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    sleep 1
    kill -0 "$pid" 2>/dev/null && kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    sleep 1
    # Final sweep for any orphaned workers spawned by this service
    pkill -9 -P "$pid" 2>/dev/null || true
    echo "$label: stopped (was PID $pid)"
  else
    echo "$label: not running (stale PID $pid)"
  fi
  rm -f "$pid_file"
}

echo "========================================"
echo "  KWIKSELLER — Stopping all services"
echo "========================================"
echo ""

stop_service "api"         "API (port 4000)        "
stop_service "marketplace" "Marketplace (port 3000)"
stop_service "vendor"      "Vendor (port 3001)     "

echo ""
echo "========================================"
echo "  All services stopped."
echo "========================================"
