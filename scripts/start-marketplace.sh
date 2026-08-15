#!/bin/bash
# KWIKSELLER Marketplace (Next.js) startup script — self-healing
#
# Runs the marketplace Next.js dev server on port 3000 as a background daemon
# via start-stop-daemon. Runs `next dev` DIRECTLY (skipping the repo's dev.sh
# wrapper) because:
#   1. dev.sh's global `pkill -9 -f "next-server"` would kill the vendor app too
#   2. We want independent heap tuning and clean per-service logs
#
# SELF-HEALING: the marketplace is a very large Next.js 16 + Turbopack app.
# In this 4GB sandbox the cold compile can grow next-server to ~2.5GB RSS
# (V8 heap + Turbopack native Rust workers) and occasionally get OOM-killed.
# This wrapper restarts `next dev` automatically so the server stays
# available. The Turbopack on-disk cache (.next) makes recompiles fast.
#
# Memory note: --max-old-space-size bounds only the V8 heap, NOT Turbopack's
# native buffers. So a 1200MB cap still results in ~2.4GB total RSS during
# cold compile. To survive cold compile, start the marketplace BEFORE the
# API/Vendor (see start-all.sh ordering).

set -u

ROOT_DIR="/home/z/my-project"
APP_DIR="$ROOT_DIR/apps/marketplace"
PID_FILE="$ROOT_DIR/pids/marketplace.pid"
LOG_FILE="$ROOT_DIR/logs/marketplace.log"

# If already running, do nothing.
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
  echo "Marketplace already running (PID $(cat "$PID_FILE")). Use stop-all.sh first."
  exit 0
fi
rm -f "$PID_FILE"

# Heap cap for the V8 heap only. Turbopack native workers add ~1GB on top
# during cold compile, so total RSS can still reach ~2.4GB. 1200MB is the
# sweet spot that keeps V8 GC aggressive without starving Turbopack.
export NODE_OPTIONS="--max-old-space-size=1200"

cd "$APP_DIR"

# Self-healing loop wrapper: restarts next dev on exit (OOM, crash, signal).
# Daemonized via start-stop-daemon so it survives across bash tool calls.
start-stop-daemon --start \
  --background \
  --make-pidfile \
  --pidfile "$PID_FILE" \
  --chdir "$APP_DIR" \
  --startas /bin/bash \
  -- -c "
    while true; do
      '$ROOT_DIR/node_modules/.bin/next' dev -p 3000 >> '$LOG_FILE' 2>&1
      rc=\$?
      echo \"[marketplace] next dev exited (rc=\$rc) — restarting in 3s\" >> '$LOG_FILE'
      sleep 3
    done
  "

RC=$?
if [ $RC -eq 0 ]; then
  echo "Marketplace starting (PID $(cat "$PID_FILE" 2>/dev/null)) → $LOG_FILE"
  echo "  Port: 3000  (http://localhost:3000)  [self-healing: auto-restarts on OOM]"
else
  echo "Failed to start Marketplace (rc=$RC)"
fi
