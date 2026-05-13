#!/bin/bash
# PiWorker-OS :: Sovereign Build (Go-only)
# Frontend was removed; this script now drives the TypeScript typecheck
# of the shared contract layer and the Sovereign Engine Go binary build.

set -e

LOG_FILE="build_report_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "[SOVEREIGN_BUILD] Initializing build sequence..."
echo "[DEBUG] Environment: $(uname -a)"
echo "[DEBUG] Node: $(node -v)"
echo "[DEBUG] NPM: $(npm -v)"

echo "[PHASE 1] Installing dependencies..."
npm install --legacy-peer-deps --ignore-scripts --no-audit --no-fund

echo "[PHASE 2] TypeScript type check..."
npm run typecheck

echo "[PHASE 3] Compiling Sovereign Engine sidecar (Go)..."
chmod +x scripts/build-sovereign-engine.sh
./scripts/build-sovereign-engine.sh

echo "[PHASE 4] Verifying build integrity..."
if [ -f "bin/sovereign-engine" ]; then
    echo "[SUCCESS] Sovereign Build complete. Binary at bin/sovereign-engine"
    echo "[REPORT] Summary saved to $LOG_FILE"
else
    echo "[FATAL] Missing bin/sovereign-engine artifact."
    exit 1
fi
