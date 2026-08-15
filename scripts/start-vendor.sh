#!/bin/bash
# KWIKSELLER Vendor (Next.js) startup script
#
# Runs the vendor Next.js dev server on port 3001 as a background daemon
# via start-stop-daemon.

set -u

ROOT_DIR="/home/z/my-project"
APP_DIR="$ROOT_DIR/apps/vendor"
PID_FILE="$ROOT_DIR/pids/vendor.pid"
LOG_FILE="$ROOT_DIR/logs/vendor.log"

# If already running, do nothing.
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
  echo "Vendor already running (PID $(cat "$PID_FILE")). Use stop-all.sh first."
  exit 0
fi
rm -f "$PID_FILE"

cd "$APP_DIR"

# Heap cap tuned for this 4GB sandbox.
export NODE_OPTIONS="--max-old-space-size=1536"

# Start next dev as a detached background daemon.
start-stop-daemon --start \
  --background \
  --make-pidfile \
  --pidfile "$PID_FILE" \
  --chdir "$APP_DIR" \
  --startas /bin/bash \
  -- -c "exec '$ROOT_DIR/node_modules/.bin/next' dev -p 3001 >> '$LOG_FILE' 2>&1"

RC=$?
if [ $RC -eq 0 ]; then
  echo "Vendor starting (PID $(cat "$PID_FILE" 2>/dev/null)) → $LOG_FILE"
  echo "  Port: 3001  (http://localhost:3001)"
else
  echo "Failed to start Vendor (rc=$RC)"
fi
