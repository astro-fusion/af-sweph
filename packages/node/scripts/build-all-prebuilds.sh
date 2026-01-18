#!/bin/bash
# Build prebuilds for ALL supported Node.js versions and platforms
#
# This script creates native binaries compatible with:
# - Node.js versions: 18, 20, 22
# - Platforms: linux-x64, linux-arm64, darwin-arm64, darwin-x64
#
# Prerequisites:
# - Docker installed and running (for Linux builds)
# - swisseph-v2 in node_modules
#
# Usage:
#   ./build-all-prebuilds.sh          # Build all versions and platforms
#   ./build-all-prebuilds.sh 22       # Build only Node.js 22
#   ./build-all-prebuilds.sh 22 linux # Build Node.js 22 for Linux only

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
NODE_VERSIONS=("18" "20" "22")
LINUX_PLATFORMS=("linux-x64" "linux-arm64")

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   @af/sweph Multi-Version Prebuild Builder     ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Parse arguments
FILTER_VERSION="${1:-all}"
FILTER_PLATFORM="${2:-all}"

if [ "$FILTER_VERSION" != "all" ]; then
    NODE_VERSIONS=("$FILTER_VERSION")
    echo -e "${YELLOW}Building only Node.js $FILTER_VERSION${NC}"
fi

if [ "$FILTER_PLATFORM" == "linux" ]; then
    echo -e "${YELLOW}Building only Linux platforms${NC}"
elif [ "$FILTER_PLATFORM" == "darwin" ]; then
    echo -e "${YELLOW}Building only macOS (darwin) platforms${NC}"
    LINUX_PLATFORMS=()
fi

# Check Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        return 1
    fi
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ Docker is available${NC}"
    return 0
}

# Check swisseph-v2
check_swisseph() {
    if [ ! -d "$PROJECT_DIR/node_modules/swisseph-v2" ]; then
        echo -e "${RED}❌ swisseph-v2 not found. Run 'pnpm install' first${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ swisseph-v2 found${NC}"
}

# Build for a specific Node version and platform using Docker
build_linux() {
    local node_version=$1
    local platform=$2
    local docker_platform=""
    
    if [ "$platform" == "linux-x64" ]; then
        docker_platform="linux/amd64"
    elif [ "$platform" == "linux-arm64" ]; then
        docker_platform="linux/arm64"
    else
        echo -e "${RED}Unknown platform: $platform${NC}"
        return 1
    fi
    
    local prebuild_dir="$PROJECT_DIR/prebuilds/$platform/node$node_version"
    mkdir -p "$prebuild_dir"
    
    echo -e "${BLUE}Building: Node $node_version for $platform${NC}"
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    cleanup() { rm -rf "$TEMP_DIR"; }
    trap cleanup EXIT
    
    # Copy source
    cp -r "$PROJECT_DIR/node_modules/swisseph-v2" "$TEMP_DIR/swisseph-v2"
    
    # Build in Docker
    docker run --rm --platform "$docker_platform" \
        -v "$TEMP_DIR:/build" \
        -w /build/swisseph-v2 \
        "node:$node_version-slim" \
        bash -c "
            apt-get update -qq && \
            apt-get install -y -qq python3 make g++ && \
            npm install --ignore-scripts && \
            npm run install 2>&1 && \
            ls -la build/Release/
        "
    
    # Copy result
    if [ -f "$TEMP_DIR/swisseph-v2/build/Release/swisseph.node" ]; then
        cp "$TEMP_DIR/swisseph-v2/build/Release/swisseph.node" "$prebuild_dir/swisseph.node"
        echo -e "${GREEN}✅ Built: $prebuild_dir/swisseph.node${NC}"
        
        # Also copy to the main prebuild location for the latest Node version
        if [ "$node_version" == "22" ]; then
            mkdir -p "$PROJECT_DIR/prebuilds/$platform"
            cp "$prebuild_dir/swisseph.node" "$PROJECT_DIR/prebuilds/$platform/swisseph.node"
            echo -e "${GREEN}   → Also copied to prebuilds/$platform/swisseph.node (default)${NC}"
        fi
    else
        echo -e "${RED}❌ Build failed for Node $node_version $platform${NC}"
        return 1
    fi
}

# Build darwin (macOS) - requires running on macOS with the target architecture
build_darwin() {
    local node_version=$1
    local current_arch=$(uname -m)
    local target_platform=""
    
    if [ "$current_arch" == "arm64" ]; then
        target_platform="darwin-arm64"
    elif [ "$current_arch" == "x86_64" ]; then
        target_platform="darwin-x64"
    else
        echo -e "${YELLOW}⚠️  Unknown macOS architecture: $current_arch${NC}"
        return 1
    fi
    
    # Check if we're on macOS
    if [ "$(uname -s)" != "Darwin" ]; then
        echo -e "${YELLOW}⚠️  Skipping darwin build (not on macOS)${NC}"
        return 0
    fi
    
    # Check if correct Node version is installed
    local current_node_major=$(node -v | cut -d. -f1 | tr -d 'v')
    if [ "$current_node_major" != "$node_version" ]; then
        echo -e "${YELLOW}⚠️  Skipping darwin/Node $node_version (current Node is v$current_node_major)${NC}"
        echo -e "${YELLOW}   Use nvm to switch: nvm use $node_version${NC}"
        return 0
    fi
    
    local prebuild_dir="$PROJECT_DIR/prebuilds/$target_platform/node$node_version"
    mkdir -p "$prebuild_dir"
    
    echo -e "${BLUE}Building: Node $node_version for $target_platform (native)${NC}"
    
    # Build using local swisseph-v2
    (cd "$PROJECT_DIR/node_modules/swisseph-v2" && npm run install 2>&1)
    
    if [ -f "$PROJECT_DIR/node_modules/swisseph-v2/build/Release/swisseph.node" ]; then
        cp "$PROJECT_DIR/node_modules/swisseph-v2/build/Release/swisseph.node" "$prebuild_dir/swisseph.node"
        echo -e "${GREEN}✅ Built: $prebuild_dir/swisseph.node${NC}"
        
        # Copy to main prebuild location if latest
        if [ "$node_version" == "22" ]; then
            mkdir -p "$PROJECT_DIR/prebuilds/$target_platform"
            cp "$prebuild_dir/swisseph.node" "$PROJECT_DIR/prebuilds/$target_platform/swisseph.node"
            echo -e "${GREEN}   → Also copied to prebuilds/$target_platform/swisseph.node (default)${NC}"
        fi
    else
        echo -e "${RED}❌ Build failed for darwin${NC}"
        return 1
    fi
}

# Main execution
echo ""
check_swisseph

DOCKER_AVAILABLE=false
if check_docker; then
    DOCKER_AVAILABLE=true
fi

echo ""
echo -e "${BLUE}Starting builds...${NC}"
echo ""

# Build Linux platforms (requires Docker)
if [ "$DOCKER_AVAILABLE" == "true" ] && [ "$FILTER_PLATFORM" != "darwin" ]; then
    for platform in "${LINUX_PLATFORMS[@]}"; do
        for version in "${NODE_VERSIONS[@]}"; do
            build_linux "$version" "$platform" || true
        done
    done
else
    if [ "$FILTER_PLATFORM" != "darwin" ]; then
        echo -e "${YELLOW}⚠️  Skipping Linux builds (Docker not available)${NC}"
    fi
fi

# Build Darwin (macOS) platform
if [ "$FILTER_PLATFORM" != "linux" ] && [ "$(uname -s)" == "Darwin" ]; then
    for version in "${NODE_VERSIONS[@]}"; do
        build_darwin "$version" || true
    done
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Build Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "Prebuilds directory structure:"
find "$PROJECT_DIR/prebuilds" -name "*.node" -exec ls -lh {} \; 2>/dev/null | while read line; do
    echo "  $line"
done

echo ""
echo -e "${GREEN}✅ Build process complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. git add prebuilds/"
echo "  2. git commit -m 'chore: rebuild prebuilds for Node 18/20/22'"
echo "  3. git push origin main"
echo "  4. Update astrofusion-nextjs to use new version"
