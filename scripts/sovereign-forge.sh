#!/bin/bash

# 🛠️ AMRIKYY LAB :: THE SOVEREIGN FORGE
# PURPOSE: A high-efficiency, zero-overhead Docker alternative for local development.
# It orchestrates the Go Engine (The Muscle) and Next.js (The Brain) in native processes.

# --- ⚙️ CONFIGURATION ---
GO_ENGINE_DIR="./sidecar/sovereign-engine"
NEXT_DIR="."
GO_PORT=50051
NEXT_PORT=3000

# --- 🎨 COLORS ---
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 [Forge] Igniting Sovereign Development Environment...${NC}"

# 0. Pre-flight Audit (Root-Cause Prevention)
echo -e "${CYAN}🔍 [Audit] Running Pre-flight Checks...${NC}"
node scripts/preflight-check.mjs
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ [Audit] Pre-flight failed. Resolve issues before starting the forge.${NC}"
    exit 1
fi

# 1. Check Dependencies
command -v go >/dev/null 2>&1 || { echo -e "${RED}❌ Go is not installed.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ NPM is not installed.${NC}"; exit 1; }

# 2. Start Go Engine (The Muscle)
echo -e "${GREEN}🦾 [Muscle] Starting Go Sovereign Engine on port $GO_PORT...${NC}"
cd "$GO_ENGINE_DIR" || exit
go build -o ../../bin/sovereign-engine main.go
../../bin/sovereign-engine & 
MUSCLE_PID=$!
cd - > /dev/null

# 3. Start Next.js (The Brain)
echo -e "${GREEN}🧠 [Brain] Starting Next.js Orchestrator on port $NEXT_PORT...${NC}"
npm run dev &
BRAIN_PID=$!

# 4. Cleanup on Exit
trap "echo -e '${RED}🛑 [Forge] Shutting down...${NC}'; kill $MUSCLE_PID $BRAIN_PID; exit" SIGINT SIGTERM

echo -e "${CYAN}✨ [Forge] Sovereign State Online.${NC}"
echo -e "   - Muscle: http://localhost:$GO_PORT (gRPC)"
echo -e "   - Brain:  http://localhost:$NEXT_PORT"
echo -e "   - Logs:   Merged Output Below"

# Keep script alive
wait
