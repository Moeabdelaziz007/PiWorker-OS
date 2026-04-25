#!/bin/bash
# PiWorker-OS: Sovereign Engine Build Script
# Goal: Produce a zero-dependency static binary.
# Supported targets (set via environment):
#   - linux/amd64 (default CI/server target)
#   - linux/arm64 (Raspberry Pi 4/5 and other 64-bit ARM variants)
# Override with: GOOS=<os> GOARCH=<arch> ./scripts/build-sovereign-engine.sh

echo "👑 [Sovereign Build] Starting Gopher Awakening..."

# Set directory to the sidecar
cd sidecar/sovereign-engine

# Disable CGO for absolute portability and use static linking
export CGO_ENABLED=0
export GOOS="${GOOS:-linux}"
export GOARCH="${GOARCH:-amd64}"

echo "🎯 [Sovereign Build] Target resolved to GOOS=${GOOS} GOARCH=${GOARCH}"

echo "📦 [Sovereign Build] Compiling Static Binary (SovereignEngine)..."

# Ensure bin directory exists
mkdir -p ../../bin

# Build command with flags to reduce size and strip debug info
go build -ldflags="-s -w -extldflags '-static'" -o ../../bin/sovereign-engine main.go

if [ $? -eq 0 ]; then
    echo "✅ [Success] Sovereign Engine built at: bin/sovereign-engine"
    echo "🚀 [Status] Ready for deployment. Zero dependencies required."
else
    echo "❌ [Error] Build failed. Check Go installation and module dependencies."
fi
