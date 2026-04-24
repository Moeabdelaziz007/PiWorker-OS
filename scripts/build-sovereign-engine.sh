#!/bin/bash
# PiWorker-OS: Sovereign Engine Build Script
# Goal: Produce a zero-dependency static binary.

echo "👑 [Sovereign Build] Starting Gopher Awakening..."

# Set directory to the sidecar
cd sidecar/sovereign-engine

# Disable CGO for absolute portability and use static linking
export CGO_ENABLED=0
export GOOS=linux # Assuming target is a Linux-based Pi
export GOARCH=amd64 # Change to arm64 if targeting Pi 4/5 hardware

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
