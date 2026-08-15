#!/bin/bash
# KWIKSELLER — Start all 3 dev services (Marketplace + API + Vendor)
#
# Starts each service as an INDEPENDENT background daemon via
# start-stop-daemon, in a memory-safe SEQUENCE optimized for this 4GB sandbox:
#
#   1. Marketplace (Next.js) FIRST  — heaviest cold compile (~2.4GB RSS).
#      Started alone so it has the full 4GB available. The first request to
#      / triggers the cold compile; we wait for it to finish before proceeding.
#   2. API (NestJS) second          — lightweight (~700MB), needed by frontends
#   3. Vendor (Next.js) last        — lighter cold compile, starts after
#      marketplace is warm (warm recompile uses ~600MB, not 2.4GB)
#
# Why this order: starting all 3 at once causes the kernel OOM killer to
# murder next-server processes mid-compile. Starting the marketplace alone
# gives its cold compile the full 4GB headroom it needs.
#
# Usage:  bash scripts/start-all.sh

set -u

ROOT_DIR="/home/z/my-project"
SCRIPT_DIR="$ROOT_DIR/scripts"

echo "========================================"
echo "  KWIKSELLER — Starting all services"
echo "========================================"
echo ""

# 0. Kill any orphaned dev processes from a previous run (defensive cleanup).
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "next/dist/bin/next" 2>/dev/null
pkill -9 -f "nest start" 2>/dev/null
pkill -9 -f "nest.js start" 2>/dev/null
pkill -9 -f "node.*apps/api/dist/src/main" 2>/dev/null
pkill -9 -f "turbo run dev" 2>/dev/null
pkill -9 -f "pnpm run dev" 2>/dev/null
pkill -9 -f "pnpm run start:dev" 2>/dev/null
pkill -9 -f "postcss.js" 2>/dev/null
sleep 2
rm -f "$ROOT_DIR"/pids/*.pid

# 1. Marketplace FIRST — needs the full 4GB for cold compile.
bash "$SCRIPT_DIR/start-marketplace.sh"
echo ""
echo "  → triggering cold compile by curling / ..."
# Trigger the cold compile with a long-timeout curl (can take 40-60s).
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 120 http://localhost:3000/ 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo "  → Marketplace cold compile DONE (HTTP 200). Starting API + Vendor."
else
  echo "  → Marketplace cold compile returned HTTP $HTTP_CODE (may still be warming)."
  echo "    Proceeding anyway — the self-healing loop will restart it if needed."
fi
sleep 5

# 2. API second (lightweight, ~700MB).
bash "$SCRIPT_DIR/start-api.sh"
echo ""
echo "  → waiting 20s for API to finish booting..."
sleep 20

# 3. Vendor last (lighter cold compile, marketplace is now warm).
bash "$SCRIPT_DIR/start-vendor.sh"
echo ""
echo "========================================"
echo "  All services launched."
echo "  Run: bash scripts/status.sh"
echo "========================================"
