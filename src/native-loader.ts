/**
 * Native Binary Loader for @af/sweph
 * Loads platform-specific pre-built Swiss Ephemeris binaries
 * 
 * This module handles loading the correct native binary for the current platform,
 * enabling Vercel serverless deployment without native compilation.
 */
import path from 'path';
import { platform, arch } from 'os';

// Cached native module instance
let nativeModule: any = null;

/**
 * Supported platform configurations
 */
const SUPPORTED_PLATFORMS = [
  'linux-x64',    // Vercel, AWS Lambda, most Linux servers
  'darwin-arm64', // macOS M1/M2/M3
  'darwin-x64',   // macOS Intel
  'win32-x64',    // Windows x64
] as const;

type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];

/**
 * Get the platform key for the current system
 */
function getPlatformKey(): string {
  return `${platform()}-${arch()}`;
}

/**
 * Check if the current platform is supported
 */
function isSupportedPlatform(key: string): key is SupportedPlatform {
  return SUPPORTED_PLATFORMS.includes(key as SupportedPlatform);
}

/**
 * Get paths to search for pre-built binaries
 */
function getPrebuildPaths(platformKey: string): string[] {
  const paths: string[] = [];

  // Standard prebuild location (works from dist/ and src/)
  paths.push(path.resolve(__dirname, '..', 'prebuilds', platformKey, 'swisseph.node'));

  // Alternative: node_modules location for installed packages
  paths.push(path.resolve(process.cwd(), 'node_modules', '@af', 'sweph', 'prebuilds', platformKey, 'swisseph.node'));

  return paths;
}

/**
 * Try to load a native binary from the given path
 */
function tryLoadBinary(binaryPath: string): any | null {
  try {
    return require(binaryPath);
  } catch {
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
export function loadNativeBinary(): any {
  // Return cached module if already loaded
  if (nativeModule) {
    return nativeModule;
  }

  const platformKey = getPlatformKey();
  const errors: string[] = [];

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
    const module = gypBuild(path.resolve(__dirname, '..'));
    if (module) {
      nativeModule = module;
      return nativeModule;
    }
  } catch (e) {
    errors.push(`node-gyp-build failed: ${e}`);
  }

  // 3. Fallback to swisseph-v2 (optional dependency)
  try {
    const swissephV2 = require('swisseph-v2');
    nativeModule = swissephV2.default || swissephV2;
    return nativeModule;
  } catch (e) {
    errors.push(`swisseph-v2 fallback failed: ${e}`);
  }

  // 4. All loading attempts failed
  const supportedList = SUPPORTED_PLATFORMS.join(', ');
  const errorDetails = errors.join('; ');

  throw new Error(
    `Failed to load Swiss Ephemeris native module for platform '${platformKey}'. ` +
    `Supported platforms: ${supportedList}. ` +
    `Details: ${errorDetails}. ` +
    `For Vercel deployment, ensure prebuilds/linux-x64/swisseph.node is included in the package.`
  );
}

/**
 * Get information about the current platform
 * Useful for debugging deployment issues
 */
export function getPlatformInfo(): {
  platform: string;
  arch: string;
  key: string;
  isSupported: boolean;
  prebuildPaths: string[];
} {
  const key = getPlatformKey();
  return {
    platform: platform(),
    arch: arch(),
    key,
    isSupported: isSupportedPlatform(key),
    prebuildPaths: getPrebuildPaths(key),
  };
}

/**
 * Check if prebuilds are available for the current platform
 */
export function hasPrebuilds(): boolean {
  const platformKey = getPlatformKey();
  const prebuildPaths = getPrebuildPaths(platformKey);

  for (const binaryPath of prebuildPaths) {
    try {
      require.resolve(binaryPath);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

/**
 * Get the list of supported platforms
 */
export function getSupportedPlatforms(): readonly string[] {
  return SUPPORTED_PLATFORMS;
}
