#!/bin/bash
# KWIKSELLER API (NestJS) startup script
#
# Runs the NestJS API on port 4000 as a background daemon via
# start-stop-daemon (the only mechanism that survives across bash tool calls
# in this sandbox — nohup/setsid/disown all get reaped).
#
# IMPORTANT: the sandbox pre-sets DATABASE_URL=file:/home/z/my-project/db/custom.db
# (leftover from the original Next.js scaffold). NestJS's dotenv does NOT
# override existing process env vars, so the API would silently fall back to
# that SQLite path and Prisma would reject it ("URL must start with postgresql://").
# We source apps/api/.env FIRST (bash `source` DOES override existing vars)
# so the correct Neon Postgres DATABASE_URL is in process.env before NestJS runs.

set -u

ROOT_DIR="/home/z/my-project"
APP_DIR="$ROOT_DIR/apps/api"
ENV_FILE="$APP_DIR/.env"
PID_FILE="$ROOT_DIR/pids/api.pid"
LOG_FILE="$ROOT_DIR/logs/api.log"

# If already running, do nothing.
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
  echo "API already running (PID $(cat "$PID_FILE")). Use stop-all.sh first."
  exit 0
fi
rm -f "$PID_FILE"

# Source the API .env into the current shell environment so the correct
# DATABASE_URL (Neon Postgres) overrides the sandbox's SQLite default.
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "ERROR: $ENV_FILE not found. Create it from apps/api/.env.example first."
  exit 1
fi

cd "$APP_DIR"

# Start nest start --watch as a detached background daemon.
start-stop-daemon --start \
  --background \
  --make-pidfile \
  --pidfile "$PID_FILE" \
  --chdir "$APP_DIR" \
  --startas /bin/bash \
  -- -c "exec pnpm run start:dev >> '$LOG_FILE' 2>&1"

RC=$?
if [ $RC -eq 0 ]; then
  echo "API starting (PID $(cat "$PID_FILE" 2>/dev/null)) → $LOG_FILE"
  echo "  Port: 4000  (http://localhost:4000, Swagger: /api/docs)"
else
  echo "Failed to start API (rc=$RC)"
fi
