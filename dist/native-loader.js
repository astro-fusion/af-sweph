"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadNativeBinary = loadNativeBinary;
exports.getPlatformInfo = getPlatformInfo;
exports.hasPrebuilds = hasPrebuilds;
exports.getSupportedPlatforms = getSupportedPlatforms;
/**
 * Native Binary Loader for @af/sweph
 * Loads platform-specific pre-built Swiss Ephemeris binaries
 *
 * This module handles loading the correct native binary for the current platform,
 * enabling Vercel serverless deployment without native compilation.
 */
const path_1 = __importDefault(require("path"));
const os_1 = require("os");
// Cached native module instance
let nativeModule = null;
/**
 * Supported platform configurations
 */
const SUPPORTED_PLATFORMS = [
    'linux-x64', // Vercel, AWS Lambda, most Linux servers
    'darwin-arm64', // macOS M1/M2/M3
    'darwin-x64', // macOS Intel
    'win32-x64', // Windows x64
];
/**
 * Get the platform key for the current system
 */
function getPlatformKey() {
    return `${(0, os_1.platform)()}-${(0, os_1.arch)()}`;
}
/**
 * Check if the current platform is supported
 */
function isSupportedPlatform(key) {
    return SUPPORTED_PLATFORMS.includes(key);
}
/**
 * Get paths to search for pre-built binaries
 */
function getPrebuildPaths(platformKey) {
    const paths = [];
    // Standard prebuild location (when running from dist/)
    paths.push(path_1.default.join(__dirname, '..', 'prebuilds', platformKey, 'swisseph.node'));
    // When running from src/ during development
    paths.push(path_1.default.resolve(__dirname, '..', 'prebuilds', platformKey, 'swisseph.node'));
    // Alternative: node_modules location for installed packages
    paths.push(path_1.default.resolve(process.cwd(), 'node_modules', '@af', 'sweph', 'prebuilds', platformKey, 'swisseph.node'));
    return paths;
}
/**
 * Try to load a native binary from the given path
 */
function tryLoadBinary(binaryPath) {
    try {
        return require(binaryPath);
    }
    catch {
        return null;
    }
}
/**
 * Load the Swiss Ephemeris native module from pre-built binaries
 * Falls back to swisseph-v2 if prebuilds are not available
 *
 * @returns Swiss Ephemeris native module instance
 * @throws Error if no compatible native module can be loaded
 */
function loadNativeBinary() {
    // Return cached module if already loaded
    if (nativeModule) {
        return nativeModule;
    }
    const platformKey = getPlatformKey();
    const errors = [];
    // 1. Try loading from prebuilds
    const prebuildPaths = getPrebuildPaths(platformKey);
    for (const binaryPath of prebuildPaths) {
        const module = tryLoadBinary(binaryPath);
        if (module) {
            nativeModule = module;
            return nativeModule;
        }
    }
    errors.push(`No prebuild found for ${platformKey}`);
    // 2. Try node-gyp-build (for dynamically built binaries)
    try {
        const gypBuild = require('node-gyp-build');
        const module = gypBuild(path_1.default.resolve(__dirname, '..'));
        if (module) {
            nativeModule = module;
            return nativeModule;
        }
    }
    catch (e) {
        errors.push(`node-gyp-build failed: ${e}`);
    }
    // 3. Fallback to swisseph-v2 (optional dependency)
    try {
        const swissephV2 = require('swisseph-v2');
        nativeModule = swissephV2.default || swissephV2;
        return nativeModule;
    }
    catch (e) {
        errors.push(`swisseph-v2 fallback failed: ${e}`);
    }
    // 4. All loading attempts failed
    const supportedList = SUPPORTED_PLATFORMS.join(', ');
    const errorDetails = errors.join('; ');
    throw new Error(`Failed to load Swiss Ephemeris native module for platform '${platformKey}'. ` +
        `Supported platforms: ${supportedList}. ` +
        `Details: ${errorDetails}. ` +
        `For Vercel deployment, ensure prebuilds/linux-x64/swisseph.node is included in the package.`);
}
/**
 * Get information about the current platform
 * Useful for debugging deployment issues
 */
function getPlatformInfo() {
    const key = getPlatformKey();
    return {
        platform: (0, os_1.platform)(),
        arch: (0, os_1.arch)(),
        key,
        isSupported: isSupportedPlatform(key),
        prebuildPaths: getPrebuildPaths(key),
    };
}
/**
 * Check if prebuilds are available for the current platform
 */
function hasPrebuilds() {
    const platformKey = getPlatformKey();
    const prebuildPaths = getPrebuildPaths(platformKey);
    for (const binaryPath of prebuildPaths) {
        try {
            require.resolve(binaryPath);
            return true;
        }
        catch {
            continue;
        }
    }
    return false;
}
/**
 * Get the list of supported platforms
 */
function getSupportedPlatforms() {
    return SUPPORTED_PLATFORMS;
}
//# sourceMappingURL=native-loader.js.map