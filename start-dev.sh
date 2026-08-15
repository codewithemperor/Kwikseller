#!/bin/bash
# KWIKSELLER dev:app startup wrapper
#
# The sandbox pre-sets DATABASE_URL=file:/home/z/my-project/db/custom.db
# (leftover from the original Next.js scaffold's SQLite config). NestJS's
# dotenv does NOT override existing process env vars, so the API would
# silently fall back to that SQLite path and Prisma would reject it
# ("URL must start with postgresql://").
#
# This wrapper sources apps/api/.env into the shell environment FIRST
# (bash `source` DOES override existing vars), then execs pnpm run dev:app.
# The result: the correct Neon Postgres DATABASE_URL is in process.env
# before any NestJS/Prisma code runs.

set -a
# shellcheck disable=SC1091
source /home/z/my-project/apps/api/.env
set +a

cd /home/z/my-project
exec pnpm run dev:app >> /home/z/my-project/dev.log 2>&1
