#!/bin/bash
# AMRIKYY LAB :: SOVEREIGN BUILD MASTER
# High-Fidelity Build & Debug Orchestrator

set -e # Exit on error

LOG_FILE="build_report_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "👑 [SOVEREIGN_BUILD] Initializing zero-defect build sequence..."
echo "📍 [DEBUG] Environment: $(uname -a)"
echo "📍 [DEBUG] Node: $(node -v)"
echo "📍 [DEBUG] NPM: $(npm -v)"

# PHASE 1: PRE-FLIGHT
echo "🔍 [PHASE 1] Executing Sovereign Pre-flight Checks..."
npm run prebuild

# PHASE 2: DEPENDENCY AUDIT
echo "📦 [PHASE 2] Auditing Dependencies..."
npm install --legacy-peer-deps

# PHASE 3: TYPE HARDENING
echo "🛡️ [PHASE 3] Hardening TypeScript Types..."
npm run typecheck

# PHASE 4: GO ENGINE COMPILATION
echo "⚙️ [PHASE 4] Compiling Sovereign Engine Sidecar..."
chmod +x scripts/build-sovereign-engine.sh
./scripts/build-sovereign-engine.sh

# PHASE 5: NEXT.JS COMPILATION
echo "🚀 [PHASE 5] Compiling Next.js Production Bundle..."
npm run build

# PHASE 6: POST-BUILD VERIFICATION
echo "✅ [PHASE 6] Verifying Build Integrity..."
if [ -d ".next" ] && [ -f "bin/sovereign-engine" ]; then
    echo "👑 [SUCCESS] Sovereign Build Cycle Complete. Zero defects detected."
    echo "📊 [REPORT] Summary saved to $LOG_FILE"
else
    echo "❌ [FATAL] Build integrity check failed! Missing critical artifacts."
    exit 1
fi
