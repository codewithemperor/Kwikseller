#!/bin/bash
# KWIKSELLER Marketplace — self-healing dev launcher
#
# The marketplace is a large Next.js 16 + Turbopack app. In this ~4 GB
# sandbox the dev server can exit unexpectedly (container memory pressure,
# rare compile-time crashes). This wrapper restarts `next dev` automatically
# whenever it exits so the server stays available. The Turbopack on-disk
# cache (apps/marketplace/.next) makes recompiles fast (~2-3 s) after a
# restart.
#
# NOTE: a container-level OOM kill takes down the whole cgroup (including
# this script) — that cannot be survived from inside the container. The loop
# below handles all OTHER exit causes (crashes, signals, V8 OOM, etc.).
#
# Only ONE next process runs at any time (no duplicate instances).

set -u

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="/home/z/my-project"
NEXT_BIN="$APP_DIR/node_modules/.bin/next"
LOG_FILE="$ROOT_DIR/dev.log"

# Cap the V8 heap so the process stays small enough to coexist with the
# container's page cache. 1024 MB is the sweet spot: enough for warm-cache
# route compiles, low enough to leave headroom for the page cache + a second
# route compile.
export NODE_OPTIONS="--max-old-space-size=1024"

cd "$APP_DIR"

echo "[dev] starting supervised next dev (heap cap 1024 MB) → $LOG_FILE" >> "$LOG_FILE"

while true; do
  # Run next as a CHILD process (not exec) so this script survives next's
  # exit and can restart it.
  "$NEXT_BIN" dev -p 3000 >> "$LOG_FILE" 2>&1
  rc=$?
  echo "[dev] next dev exited (rc=$rc) — restarting in 2 s…" >> "$LOG_FILE"
  # Clear any stale port binding / orphaned workers before relaunching.
  pkill -9 -f "next-server" 2>/dev/null || true
  sleep 2
done
