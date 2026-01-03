#!/bin/bash
# Build WASM prebuild using Docker
# 
# This script builds the swisseph native module for WebAssembly (browser)
# using a Docker container with Emscripten.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SWISSEPH_DIR="$PROJECT_DIR/node_modules/swisseph-v2/deps/swisseph"
OUTPUT_DIR="$PROJECT_DIR/prebuilds/wasm"

echo "🔨 Building WASM prebuild using Docker..."
echo "   Project directory: $PROJECT_DIR"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Check if swisseph source is available
if [ ! -d "$SWISSEPH_DIR" ]; then
    echo "❌ swisseph source not found at $SWISSEPH_DIR"
    echo "   Please run 'pnpm install' first or ensure swisseph-v2 is installed"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "🐳 Starting Docker build..."

# Emscripten compilation flags
# -O3: Aggressive optimization
# -s WASM=1: Output WebAssembly
# -s MODULARIZE=1: Output a factory function
# -s EXPORT_NAME: Name of the factory function
# -s ALLOW_MEMORY_GROWTH=1: Allow memory to grow if needed
# -s FORCE_FILESYSTEM=1: Include file system support (for ephe files)
# -s EXPORTED_FUNCTIONS: C functions to expose (prefixed with _)
# -s EXPORTED_RUNTIME_METHODS: Emscripten runtime helpers to expose

# Define JSON arrays as single-line strings for command line
EXPORTED_FUNCTIONS_JSON='["_swe_julday","_swe_date_conversion","_swe_set_ephe_path","_swe_set_sid_mode","_swe_get_ayanamsa","_swe_get_ayanamsa_ut","_swe_calc_ut","_swe_fixstar2_ut","_swe_rise_trans","_swe_azalt","_swe_version","_swe_set_topo"]'
EXPORTED_RUNTIME_METHODS_JSON='["ccall","cwrap","FS","stringToUTF8","UTF8ToString","setValue","getValue","lengthBytesUTF8"]'

# Note: We map the source directory to /src in container
# and output directory to /out

docker run --rm \
    -v "$SWISSEPH_DIR:/src" \
    -v "$OUTPUT_DIR:/out" \
    emscripten/emsdk:latest \
    bash -c "emcc /src/*.c \
    -O3 \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='createSwephModule' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s FORCE_FILESYSTEM=1 \
    -s \"EXPORTED_FUNCTIONS=$EXPORTED_FUNCTIONS_JSON\" \
    -s \"EXPORTED_RUNTIME_METHODS=$EXPORTED_RUNTIME_METHODS_JSON\" \
    -o /out/swisseph.js"

if [ -f "$OUTPUT_DIR/swisseph.wasm" ]; then
    echo "✅ WASM build successful!"
    echo "   Output: $OUTPUT_DIR/swisseph.wasm"
    ls -lh "$OUTPUT_DIR/swisseph.wasm"
else
    echo "❌ WASM build failed. Check output for details."
    exit 1
fi
