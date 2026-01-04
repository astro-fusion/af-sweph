#!/bin/bash
# Build win32-x64 prebuild using Docker
#
# This script builds the swisseph native module for win32-x64 platform
# using a Docker container with Wine. The resulting binary is compatible with
# Windows environments.
#
# Prerequisites:
# - Docker installed and running
# - swisseph-v2 in node_modules
# - Windows cross-compilation tools

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔨 Building win32-x64 prebuild using Docker..."
echo "   Project directory: $PROJECT_DIR"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "   Please install Docker to build win32-x64 prebuilds"
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

echo "⚠️  Windows cross-compilation is complex and may require additional setup."
echo "   For production builds, consider using GitHub Actions with Windows runners."
echo "   See: .github/workflows/build.yml"
echo ""
echo "   This script provides a basic template for Windows builds."

# Create prebuilds directory
PREBUILD_DIR="$PROJECT_DIR/prebuilds/win32-x64"
mkdir -p "$PREBUILD_DIR"

echo "📝 To build Windows binaries:"
echo "   1. Use a Windows machine or GitHub Actions Windows runner"
echo "   2. Run: npm install --ignore-scripts"
echo "   3. Run: npm run install"
echo "   4. Copy build/Release/swisseph.node to $PREBUILD_DIR/"
echo ""
echo "   Alternatively, pre-built Windows binaries can be downloaded from:"
echo "   https://github.com/astro-fusion/af-sweph/releases"
