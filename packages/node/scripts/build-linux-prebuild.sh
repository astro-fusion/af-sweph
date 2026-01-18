#!/bin/bash
# Build linux-x64 prebuild using Docker
# 
# This script builds the swisseph native module for linux-x64 platform
# using a Docker container. The resulting binary is compatible with
# Vercel's serverless environment.
#
# Prerequisites:
# - Docker installed and running
# - swisseph-v2 in node_modules

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔨 Building linux-x64 prebuild using Docker..."
echo "   Project directory: $PROJECT_DIR"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "   Please install Docker to build linux-x64 prebuilds"
    echo "   Alternatively, you can use GitHub Actions to build and commit the binary"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running"
    echo "   Please start Docker and try again"
    exit 1
fi

# Check if swisseph-v2 source is available
SWISSEPH_DIR="$PROJECT_DIR/node_modules/swisseph-v2"
if [ ! -d "$SWISSEPH_DIR" ]; then
    echo "❌ swisseph-v2 not found in node_modules"
    echo "   Please run 'pnpm install' first"
    exit 1
fi

# Create a temporary directory for building
TEMP_DIR=$(mktemp -d)
cleanup() { 
    echo "🧹 Cleaning up temporary directory..."
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "📦 Copying swisseph-v2 source to build directory..."
cp -r "$SWISSEPH_DIR" "$TEMP_DIR/swisseph-v2"

# Build using Node.js 18 Docker image (matches common Vercel runtime)
# CRITICAL: Use --platform linux/amd64 to ensure x86_64 binary (Vercel's architecture)
# Without this flag, Docker on M1/M2 Macs builds ARM64 binaries by default
echo "🐳 Starting Docker build (platform: linux/amd64)..."
docker run --rm \
    --platform linux/amd64 \
    -v "$TEMP_DIR:/build" \
    -w /build/swisseph-v2 \
    node:22-slim \
    bash -c "
        echo '📥 Installing build dependencies...' && \
        apt-get update -qq && \
        apt-get install -y -qq python3 make g++ && \
        echo '🔧 Building native module for x86_64...' && \
        npm install --ignore-scripts && \
        npm run install 2>&1 && \
        echo '✅ Build complete!' && \
        ls -la build/Release/ && \
        (file build/Release/swisseph.node 2>/dev/null || echo 'Note: file command not available')
    "

# Create prebuilds directory if it doesn't exist
PREBUILD_DIR="$PROJECT_DIR/prebuilds/linux-x64"
mkdir -p "$PREBUILD_DIR"

# Copy the built binary
BUILT_BINARY="$TEMP_DIR/swisseph-v2/build/Release/swisseph.node"
if [ -f "$BUILT_BINARY" ]; then
    cp "$BUILT_BINARY" "$PREBUILD_DIR/swisseph.node"
    echo ""
    echo "✅ linux-x64 prebuild created successfully!"
    echo "   Location: $PREBUILD_DIR/swisseph.node"
    echo "   Size: $(du -h "$PREBUILD_DIR/swisseph.node" | cut -f1)"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Commit the prebuild: git add prebuilds/linux-x64/"
    echo "   2. Rebuild TypeScript: pnpm build"
    echo "   3. Test: pnpm test"
else
    echo "❌ Build failed - binary not found"
    echo "   Expected: $BUILT_BINARY"
    exit 1
fi
